#!/usr/bin/env node

/**
 * HubSpot Custom Object Location Update Script
 * 
 * Questo script aggiorna il campo "location" di un oggetto personalizzato
 * collegato a un contatto in HubSpot.
 * 
 * Uso: node update_location.js <contact_id> <new_location>
 */

// Importazione delle dipendenze
require('dotenv').config();
const axios = require('axios');

// Ottenere i parametri dalla riga di comando
const contactId = process.argv[2];
const newLocation = process.argv[3];

// Validare i parametri
if (!contactId || !newLocation) {
    console.error("Errore: Sono richiesti ID contatto e nuovo valore location");
    console.error("Uso: node update_location.js <contact_id> <new_location>");
    process.exit(1);
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

/**
 * Funzione principale per aggiornare il campo location
 */
async function updateCustomObjectLocation() {
    try {
        // Ottenere l'ID del custom object type dalle variabili d'ambiente
        const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
        
        if (!customObjectTypeId) {
            console.error("Errore: HUBSPOT_CUSTOM_OBJECT_TYPE_ID non definito nelle variabili d'ambiente");
            process.exit(1);
        }
        
        // Trovare l'oggetto personalizzato associato al contatto
        const associationsResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${customObjectTypeId}`
        );
        
        // Verificare se ci sono associazioni
        if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
            // Ottenere l'ID del primo oggetto personalizzato associato
            const customObjectId = associationsResponse.data.results[0].toObjectId;
            
            // Aggiornare il campo location dell'oggetto personalizzato
            await axios.patch(`https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}`, {
                "properties": {
                    "location": newLocation
                }
            });
            
            // Crea la data corrente nel formato desiderato
            const now = new Date();
            const formattedDate = now.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Utilizza codici ANSI per il grassetto: \x1b[1m per iniziare il grassetto, \x1b[0m per terminarlo
            console.log(`Aggiornamento completato con successo il \x1b[1m${formattedDate}\x1b[0m. Location impostata a: ${newLocation}`);
        } else {
            console.error("Nessun oggetto personalizzato associato trovato per questo contatto");
            process.exit(1);
        }
    } catch (error) {
        console.error("Errore durante l'aggiornamento:", error.message);
        if (error.response) {
            console.error("Stato HTTP:", error.response.status);
            console.error("Risposta:", JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Eseguire la funzione principale
updateCustomObjectLocation();