#!/usr/bin/env node

/**
 * HubSpot Contact Search Script
 *
 * Questo script estrae da HubSpot tutti i contatti filtrando su tre campi di un custom object:
 * location, ritiro_avvenuto e data_ritiro_text.
 *
 * Supporta la paginazione per recuperare migliaia di contatti e offre opzioni per limitare
 * il numero di contatti da elaborare e per attivare la modalità debug.
 *
 * Uso: node conta_ritiri.js <location> <ritiro_avvenuto> <data_ritiro_text> [max_contatti] [debug]
 * Esempi:
 *   node conta_ritiri.js "Milano" "true" "7 aprile"
 *   node conta_ritiri.js "Milano" "true" "7 aprile" 1000
 *   node conta_ritiri.js "Milano" "true" "7 aprile" 1000 debug
 */

// Importazione delle dipendenze
require('dotenv').config();
const axios = require('axios');

// Ottenere i parametri dalla riga di comando
const locationFilter = process.argv[2];
const ritiroAvvenutoFilter = process.argv[3];
const dataRitiroFilter = process.argv[4];
const maxContactsToProcess = process.argv[5] ? parseInt(process.argv[5]) : undefined;
const debugMode = process.argv[6] === "debug";

// Validare i parametri
if (!locationFilter || !ritiroAvvenutoFilter || !dataRitiroFilter) {
    console.error("Errore: Sono richiesti tutti i parametri di filtro");
    console.error("Uso: node conta_ritiri.js <location> <ritiro_avvenuto> <data_ritiro_text> [max_contatti] [debug]");
    console.error("Esempio: node conta_ritiri.js \"Milano\" \"true\" \"7 aprile\" 1000 debug");
    process.exit(1);
}

// Validare il parametro opzionale max_contatti
if (maxContactsToProcess !== undefined && (isNaN(maxContactsToProcess) || maxContactsToProcess <= 0)) {
    console.error("Errore: Il parametro max_contatti deve essere un numero positivo");
    process.exit(1);
}

// Funzione di utilità per il logging condizionale
function debugLog(...args) {
    if (debugMode) {
        console.log(...args);
    }
}

// Configurazione HubSpot API
const HUBSPOT_DEV = process.env.HUBSPOT_DEV;
let apiKey = "";

// Selezionare l'API key appropriata in base all'ambiente
if (HUBSPOT_DEV == 0) {
    apiKey = process.env.HUBSPOT_APIKEY_PROD;
    console.log("Utilizzo ambiente HubSpot PRODUCTION");
} else {
    apiKey = process.env.HUBSPOT_APIKEY_SAND;
    console.log("Utilizzo ambiente HubSpot SANDBOX");
}

// Configurare axios con l'header di autorizzazione
const apiHeader = "Bearer " + apiKey;
axios.defaults.headers.common['Authorization'] = apiHeader;
axios.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Funzione per ottenere tutti i contatti con paginazione
 */
async function getAllContacts() {
    try {
        let allContacts = [];
        let hasMore = true;
        let after = undefined;
        let pageSize = 100;
        let pageCount = 0;
        
        console.log("Recupero contatti in corso...");
        
        // Continuare a recuperare contatti finché ce ne sono altri disponibili
        while (hasMore) {
            pageCount++;
            console.log(`Recupero pagina ${pageCount} di contatti...`);
            
            const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
                params: {
                    limit: pageSize,
                    after: after,
                    properties: ['firstname', 'lastname', 'email', 'phone']
                }
            });
            
            const results = response.data.results || [];
            allContacts = allContacts.concat(results);
            
            console.log(`Recuperati ${results.length} contatti nella pagina ${pageCount}. Totale: ${allContacts.length}`);
            
            // Verificare se ci sono altre pagine o se abbiamo raggiunto il limite
            if (results.length < pageSize ||
                (maxContactsToProcess !== undefined && allContacts.length >= maxContactsToProcess)) {
                hasMore = false;
                
                // Se abbiamo superato il limite, troncare l'array
                if (maxContactsToProcess !== undefined && allContacts.length > maxContactsToProcess) {
                    allContacts = allContacts.slice(0, maxContactsToProcess);
                    console.log(`Limitato a ${maxContactsToProcess} contatti come richiesto.`);
                }
            } else {
                // Ottenere l'ID dell'ultimo contatto per la paginazione
                after = results[results.length - 1].id;
            }
            
            // Aggiungere un breve ritardo per evitare di sovraccaricare l'API
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return allContacts;
    } catch (error) {
        console.error("Errore durante il recupero dei contatti:", error.message);
        if (error.response) {
            console.error("Stato HTTP:", error.response.status);
            console.error("Risposta:", JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

/**
 * Funzione per ottenere le associazioni di un contatto con un custom object
 */
async function getContactAssociations(contactId, customObjectTypeId) {
    try {
        const response = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${customObjectTypeId}`
        );
        return response.data.results || [];
    } catch (error) {
        // Se non ci sono associazioni, restituisci un array vuoto
        if (error.response && error.response.status === 404) {
            return [];
        }
        console.error(`Errore durante il recupero delle associazioni per il contatto ${contactId}:`, error.message);
        return [];
    }
}

/**
 * Funzione per ottenere i dettagli di un custom object
 */
async function getCustomObject(customObjectTypeId, customObjectId) {
    try {
        const response = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}`,
            {
                params: {
                    properties: ['location', 'ritiro_avvenuto', 'data_ritiro_text']
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Errore durante il recupero del custom object ${customObjectId}:`, error.message);
        return null;
    }
}

/**
 * Funzione principale per cercare contatti con filtri su custom object
 */
async function searchContacts() {
    try {
        // Ottenere l'ID del custom object type dalle variabili d'ambiente
        const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
        
        if (!customObjectTypeId) {
            console.error("Errore: HUBSPOT_CUSTOM_OBJECT_TYPE_ID non definito nelle variabili d'ambiente");
            process.exit(1);
        }
        
        console.log("\nRicerca contatti con i seguenti filtri:");
        console.log(`- Location: ${locationFilter}`);
        console.log(`- Ritiro avvenuto: ${ritiroAvvenutoFilter}`);
        console.log(`- Data ritiro: ${dataRitiroFilter}`);
        if (maxContactsToProcess !== undefined) {
            console.log(`- Limite contatti: ${maxContactsToProcess}`);
        }
        if (debugMode) {
            console.log(`- Modalità debug: attivata`);
        }
        console.log("\nEsecuzione ricerca...");
        
        // Ottenere tutti i contatti
        const contacts = await getAllContacts();
        console.log(`Recuperati ${contacts.length} contatti totali. Applicazione filtri in corso...`);
        
        // Array per memorizzare i contatti che soddisfano i criteri
        const matchingContacts = [];
        
        // Per ogni contatto, verificare se ha un'associazione con il custom object
        // e se le proprietà del custom object soddisfano i criteri di filtro
        let processedContacts = 0;
        for (const contact of contacts) {
            try {
                processedContacts++;
                if (processedContacts % 10 === 0) {
                    console.log(`Elaborati ${processedContacts}/${contacts.length} contatti...`);
                }
                
                // Mostrare il progresso più frequentemente in modalità debug
                if (debugMode && processedContacts % 1 === 0) {
                    debugLog(`Elaborazione contatto ${processedContacts}/${contacts.length}: ${contact.id}`);
                }
                
                const associations = await getContactAssociations(contact.id, customObjectTypeId);
                
                // Se il contatto ha almeno un'associazione con il custom object
                if (associations.length > 0) {
                    // Ottenere i dettagli del primo custom object associato
                    const customObjectId = associations[0].toObjectId;
                    const customObject = await getCustomObject(customObjectTypeId, customObjectId);
                    
                    // Aggiungere informazioni di debug
                    if (customObject) {
                        // Informazioni dettagliate solo in modalità debug
                        debugLog(`\nCustom object trovato per il contatto ${contact.id}:`);
                        debugLog(`- Location: ${customObject.properties.location || 'N/A'}`);
                        debugLog(`- Ritiro avvenuto: ${customObject.properties.ritiro_avvenuto || 'N/A'}`);
                        debugLog(`- Data ritiro: ${customObject.properties.data_ritiro_text || 'N/A'}`);
                        
                        // Se il custom object esiste e soddisfa i criteri di filtro
                        if (customObject.properties.location === locationFilter &&
                            customObject.properties.ritiro_avvenuto === ritiroAvvenutoFilter &&
                            customObject.properties.data_ritiro_text === dataRitiroFilter) {
                            debugLog(`✅ Contatto ${contact.id} soddisfa i criteri!`);
                            matchingContacts.push(contact);
                        } else {
                            debugLog(`❌ Contatto ${contact.id} non soddisfa i criteri.`);
                        }
                    }
                }
            } catch (error) {
                console.error(`Errore durante l'elaborazione del contatto ${contact.id}:`, error.message);
            }
        }
        
        // Elaborare i risultati
        const totalContacts = matchingContacts.length;
        
        if (totalContacts === 0) {
            console.log("\nNessun contatto trovato con i criteri specificati.");
            return;
        }
        
        // Visualizzare solo le sommatorie finali
        console.log("\n=== RISULTATI DELLA RICERCA ===");
        
        // Crea la data corrente nel formato desiderato
        const now = new Date();
        const formattedDate = now.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Utilizza codici ANSI per il grassetto
        console.log(`Data e ora: \x1b[1m${formattedDate}\x1b[0m`);
        console.log(`Filtri applicati: Location="${locationFilter}", Ritiro avvenuto="${ritiroAvvenutoFilter}", Data ritiro="${dataRitiroFilter}"`);
        console.log(`\nTotale contatti trovati: \x1b[1m${totalContacts}\x1b[0m`);
        
    } catch (error) {
        console.error("\nErrore durante la ricerca:", error.message);
        if (error.response) {
            console.error("Stato HTTP:", error.response.status);
            console.error("Risposta:", JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Eseguire la funzione principale
searchContacts();