#!/usr/bin/env node

/**
 * Script per Analizzare i Log e Contare i Ritiri per Location
 *
 * Questo script analizza un file di log per contare il numero di ritiri avvenuti
 * (identificati da aggiornamenti di data_ritiro_text) per ciascuna location.
 *
 * Uso: node conta_ritiri_log_analyzer.js <percorso_file_log> [--locations=Milano2,Olgettina] [--debug]
 * Esempi:
 *   node conta_ritiri_log_analyzer.js ./app.log
 *   node conta_ritiri_log_analyzer.js ./app.log --locations=Milano2,Olgettina
 *   node conta_ritiri_log_analyzer.js ./app.log --debug
 */

const fs = require('fs');
const path = require('path');

/**
 * Funzione principale per analizzare i log e contare i ritiri per location
 * @param {string} logFilePath - Percorso del file di log da analizzare
 * @param {string[]} availableLocations - Array di location disponibili per il raggruppamento
 * @param {boolean} debug - Se true, mostra informazioni di debug
 * @returns {Object} - Oggetto con il conteggio dei ritiri per location
 */
function analyzePickupLogs(logFilePath, availableLocations = ['Milano2', 'Olgettina'], debug = false) {
    console.log(`Analisi del file di log: ${logFilePath}`);
    
    // Verifica se il file esiste
    if (!fs.existsSync(logFilePath)) {
        console.error(`Errore: Il file ${logFilePath} non esiste`);
        process.exit(1);
    }
    
    // Leggi il file di log
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    const logLines = logContent.split('\n');
    
    console.log(`Lette ${logLines.length} righe dal file di log`);
    
    // Oggetto per memorizzare i dettagli degli oggetti personalizzati
    const customObjectDetails = {};
    
    // Oggetto per contare i ritiri per location
    const pickupCountByLocation = {};
    
    // Oggetto per memorizzare gli ID dei contatti associati agli oggetti personalizzati
    const customObjectToContact = {};
    
    // Oggetto per memorizzare le location associate agli ID dei contatti
    const contactToLocation = {};
    
    // Oggetto per memorizzare le location associate agli ID degli oggetti personalizzati
    const customObjectToLocation = {};
    
    // Oggetto per il debug
    const debugInfo = {
        locationLines: [],
        updateLines: [],
        customObjectDetailsLines: [],
        responseLines: [],
        locationCount: 0,
        updateCount: 0,
        customObjectDetailsCount: 0,
        responseCount: 0
    };
    
    console.log('Fase 1: Raccolta dei dettagli degli oggetti personalizzati e delle location...');
    
    // Prima passata: raccogliere i dettagli degli oggetti personalizzati e le associazioni
    for (let i = 0; i < logLines.length; i++) {
        const line = logLines[i];
        
        // Cerca le righe che contengono informazioni sulla location
        if (line.includes('Custom object location:') || line.includes('Custom object location from form:')) {
            // Per il debug
            if (debug) {
                debugInfo.locationCount++;
                if (debugInfo.locationLines.length < 5) {
                    debugInfo.locationLines.push(line);
                }
            }
            
            try {
                // Estrai la location
                let locationMatch;
                if (line.includes('Custom object location:')) {
                    locationMatch = line.match(/Custom object location: (.*)/);
                } else {
                    locationMatch = line.match(/Custom object location from form: (.*)/);
                }
                
                if (locationMatch && locationMatch[1]) {
                    const location = locationMatch[1].trim();
                    
                    // Cerca l'ID dell'oggetto personalizzato nelle righe precedenti
                    if (i > 0 && logLines[i-1].includes('Fetching custom object details for ID:')) {
                        const customObjectIdMatch = logLines[i-1].match(/Fetching custom object details for ID: (\d+)/);
                        if (customObjectIdMatch) {
                            const customObjectId = customObjectIdMatch[1];
                            customObjectToLocation[customObjectId] = location;
                            
                            // Cerca l'ID del contatto nelle righe precedenti
                            for (let j = i-2; j >= Math.max(0, i-10); j--) {
                                if (logLines[j].includes('Checking for custom object associations for contact ID:')) {
                                    const contactIdMatch = logLines[j].match(/contact ID: (\d+)/);
                                    if (contactIdMatch) {
                                        const contactId = contactIdMatch[1];
                                        customObjectToContact[customObjectId] = contactId;
                                        contactToLocation[contactId] = location;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Errore durante l\'analisi della riga con location:', error);
            }
        }
        
        // Cerca anche le righe che contengono i dettagli dell'oggetto personalizzato
        if (line.includes('Custom object details:')) {
            // Per il debug
            if (debug) {
                debugInfo.customObjectDetailsCount++;
                if (debugInfo.customObjectDetailsLines.length < 5) {
                    debugInfo.customObjectDetailsLines.push(line);
                }
            }
            try {
                // Estrai i dettagli dell'oggetto personalizzato
                const detailsMatch = line.match(/Custom object details: ({.*})/);
                if (detailsMatch) {
                    const details = JSON.parse(detailsMatch[1]);
                    
                    // Estrai l'ID dell'oggetto personalizzato direttamente dal JSON
                    if (details.hs_object_id) {
                        const customObjectId = details.hs_object_id;
                        customObjectDetails[customObjectId] = details;
                        
                        // Se l'oggetto personalizzato ha una location, memorizzala
                        if (details.location) {
                            customObjectToLocation[customObjectId] = details.location;
                        }
                        
                        // Cerca l'ID del contatto nelle righe precedenti (per compatibilità)
                        if (i > 0 && logLines[i-1].includes('Found custom object association:')) {
                            for (let j = i-2; j >= Math.max(0, i-10); j--) {
                                if (logLines[j].includes('Checking for custom object associations for contact ID:')) {
                                    const contactIdMatch = logLines[j].match(/contact ID: (\d+)/);
                                    if (contactIdMatch) {
                                        const contactId = contactIdMatch[1];
                                        customObjectToContact[customObjectId] = contactId;
                                        
                                        // Se l'oggetto personalizzato ha una location, memorizzala per questo contatto
                                        if (details.location) {
                                            contactToLocation[contactId] = details.location;
                                        }
                                        
                                        break;
                                    }
                                }
                            }
                        }
                    } else {
                        // Metodo alternativo: cerca l'ID dell'oggetto personalizzato nella riga precedente
                        if (i > 0 && logLines[i-1].includes('Found custom object association:')) {
                            const customObjectIdMatch = logLines[i-1].match(/Found custom object association: (\d+)/);
                            if (customObjectIdMatch) {
                                const customObjectId = customObjectIdMatch[1];
                                customObjectDetails[customObjectId] = details;
                                
                                // Se l'oggetto personalizzato ha una location, memorizzala
                                if (details.location) {
                                    customObjectToLocation[customObjectId] = details.location;
                                }
                                
                                // Cerca l'ID del contatto nelle righe precedenti
                                for (let j = i-2; j >= Math.max(0, i-10); j--) {
                                    if (logLines[j].includes('Checking for custom object associations for contact ID:')) {
                                        const contactIdMatch = logLines[j].match(/contact ID: (\d+)/);
                                        if (contactIdMatch) {
                                            const contactId = contactIdMatch[1];
                                            customObjectToContact[customObjectId] = contactId;
                                            
                                            // Se l'oggetto personalizzato ha una location, memorizzala per questo contatto
                                            if (details.location) {
                                                contactToLocation[contactId] = details.location;
                                            }
                                            
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Errore durante l\'analisi della riga:', error);
            }
        }
        
        // Cerca anche le righe che contengono la risposta finale
        if (line.includes('Risposta finale:')) {
            // Per il debug
            if (debug) {
                debugInfo.responseCount++;
                if (debugInfo.responseLines.length < 5) {
                    debugInfo.responseLines.push(line);
                }
            }
            try {
                // Estrai l'oggetto di risposta
                const responseMatch = line.match(/Risposta finale: ({.*})/);
                if (responseMatch) {
                    // A volte il JSON potrebbe non essere ben formattato nel log
                    // Proviamo a estrarre la location e l'ID del contatto manualmente
                    const locationMatch = line.match(/location:\s*['"]([^'"]+)['"]/);
                    const contactIdMatch = line.match(/id:\s*['"]?(\d+)['"]?/);
                    
                    if (locationMatch && contactIdMatch) {
                        const location = locationMatch[1];
                        const contactId = contactIdMatch[1];
                        contactToLocation[contactId] = location;
                    }
                }
            } catch (error) {
                // Ignora gli errori di parsing qui
            }
        }
    }
    
    // Aggiungi informazioni di debug sugli oggetti personalizzati e le location
    if (debug) {
        console.log('\nDettagli degli oggetti personalizzati:');
        const sampleCustomObjectIds = Object.keys(customObjectDetails).slice(0, 3);
        for (const customObjectId of sampleCustomObjectIds) {
            console.log(`ID: ${customObjectId}, Location: ${customObjectDetails[customObjectId].location || 'N/A'}`);
        }
        
        console.log('\nLocation associate agli oggetti personalizzati:');
        const sampleCustomObjectToLocationIds = Object.keys(customObjectToLocation).slice(0, 3);
        for (const customObjectId of sampleCustomObjectToLocationIds) {
            console.log(`ID: ${customObjectId}, Location: ${customObjectToLocation[customObjectId]}`);
        }
    }
    
    console.log(`Raccolti dettagli per ${Object.keys(customObjectDetails).length} oggetti personalizzati`);
    console.log(`Raccolte location per ${Object.keys(contactToLocation).length} contatti`);
    console.log(`Raccolte location per ${Object.keys(customObjectToLocation).length} oggetti personalizzati`);
    
    // Mostra informazioni di debug
    if (debug) {
        console.log('\n=== INFORMAZIONI DI DEBUG ===');
        console.log(`Righe con informazioni sulla location trovate: ${debugInfo.locationCount}`);
        console.log(`Righe con "Custom object details" trovate: ${debugInfo.customObjectDetailsCount}`);
        console.log(`Righe con "Risposta finale" trovate: ${debugInfo.responseCount}`);
        
        if (debugInfo.locationLines.length > 0) {
            console.log('\nEsempi di righe con informazioni sulla location:');
            debugInfo.locationLines.forEach((line, index) => {
                console.log(`${index + 1}. ${line}`);
            });
        }
        
        if (debugInfo.customObjectDetailsLines.length > 0) {
            console.log('\nEsempi di righe con "Custom object details":');
            debugInfo.customObjectDetailsLines.forEach((line, index) => {
                console.log(`${index + 1}. ${line}`);
            });
        }
        
        if (debugInfo.responseLines.length > 0) {
            console.log('\nEsempi di righe con "Risposta finale":');
            debugInfo.responseLines.forEach((line, index) => {
                console.log(`${index + 1}. ${line}`);
            });
        }
    }
    
    console.log('Fase 2: Conteggio dei ritiri per location...');
    
    // Contatore per il numero totale di ritiri
    let totalPickupsFound = 0;
    
    // Seconda passata: contare i ritiri per location
    for (const line of logLines) {
        if (line.includes('Successfully updated custom object') && line.includes('data_ritiro_text')) {
            // Per il debug
            if (debug) {
                debugInfo.updateCount++;
                if (debugInfo.updateLines.length < 5) {
                    debugInfo.updateLines.push(line);
                }
            }
            try {
                // Estrai l'ID dell'oggetto personalizzato
                const customObjectIdMatch = line.match(/Successfully updated custom object (\d+) with data_ritiro_text/);
                if (customObjectIdMatch) {
                    const customObjectId = customObjectIdMatch[1];
                    totalPickupsFound++;
                    
                    // Metodo 1: Usa la location associata direttamente all'oggetto personalizzato
                    if (customObjectToLocation[customObjectId]) {
                        const location = normalizeLocation(customObjectToLocation[customObjectId], availableLocations);
                        pickupCountByLocation[location] = (pickupCountByLocation[location] || 0) + 1;
                        
                        if (debug && totalPickupsFound <= 5) {
                            console.log(`Ritiro #${totalPickupsFound}: ID ${customObjectId}, Location: ${location} (da customObjectToLocation)`);
                        }
                        continue;
                    }
                    
                    // Metodo 2: Usa i dettagli dell'oggetto personalizzato
                    const details = customObjectDetails[customObjectId];
                    if (details && details.location) {
                        const location = normalizeLocation(details.location, availableLocations);
                        pickupCountByLocation[location] = (pickupCountByLocation[location] || 0) + 1;
                        
                        if (debug && totalPickupsFound <= 5) {
                            console.log(`Ritiro #${totalPickupsFound}: ID ${customObjectId}, Location: ${location} (da customObjectDetails)`);
                        }
                        continue;
                    }
                    
                    // Metodo 3: Usa l'associazione oggetto personalizzato -> contatto -> location
                    const contactId = customObjectToContact[customObjectId];
                    if (contactId && contactToLocation[contactId]) {
                        const location = normalizeLocation(contactToLocation[contactId], availableLocations);
                        pickupCountByLocation[location] = (pickupCountByLocation[location] || 0) + 1;
                        
                        if (debug && totalPickupsFound <= 5) {
                            console.log(`Ritiro #${totalPickupsFound}: ID ${customObjectId}, Location: ${location} (da contactToLocation)`);
                        }
                        continue;
                    }
                    
                    // Se non abbiamo trovato una location, incrementa il conteggio per "Unknown"
                    pickupCountByLocation['Unknown'] = (pickupCountByLocation['Unknown'] || 0) + 1;
                    
                    if (debug && totalPickupsFound <= 5) {
                        console.log(`Ritiro #${totalPickupsFound}: ID ${customObjectId}, Location: Unknown`);
                    }
                }
            } catch (error) {
                console.error('Errore durante l\'analisi della riga:', error);
            }
        }
    }
    
    // Mostra informazioni di debug sulla fase 2
    if (debug) {
        console.log(`\nTotale ritiri trovati: ${totalPickupsFound}`);
        console.log(`\nRighe con "Successfully updated custom object" e "data_ritiro_text" trovate: ${debugInfo.updateCount}`);
        
        if (debugInfo.updateLines.length > 0) {
            console.log('\nEsempi di righe con "Successfully updated custom object" e "data_ritiro_text":');
            debugInfo.updateLines.forEach((line, index) => {
                console.log(`${index + 1}. ${line}`);
            });
        }
    }
    
    return pickupCountByLocation;
}

/**
 * Funzione per normalizzare una location in base alle location disponibili
 * @param {string} location - La location da normalizzare
 * @param {string[]} availableLocations - Array di location disponibili
 * @returns {string} - La location normalizzata
 */
function normalizeLocation(location, availableLocations) {
    if (!location) return 'Unknown';
    
    // Cerca una corrispondenza tra le location disponibili
    const matchedLocation = availableLocations.find(l =>
        location.toLowerCase().includes(l.toLowerCase()) ||
        l.toLowerCase().includes(location.toLowerCase())
    );
    
    return matchedLocation || location;
}

/**
 * Funzione principale
 */
function main() {
    // Ottieni gli argomenti dalla riga di comando
    const args = process.argv.slice(2);
    
    // Verifica se è stato fornito un percorso del file di log
    if (args.length === 0) {
        console.error('Errore: Percorso del file di log non specificato');
        console.error('Uso: node conta_ritiri_log_analyzer.js <percorso_file_log> [--locations=Milano2,Olgettina] [--debug]');
        console.error('Esempio: node conta_ritiri_log_analyzer.js ./app.log --locations=Milano2,Olgettina --debug');
        process.exit(1);
    }
    
    // Ottieni il percorso del file di log (primo argomento)
    const logFilePath = args[0];
    
    // Analizza gli altri argomenti
    let availableLocations = ['Milano2', 'Olgettina'];
    let debug = false;
    
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        
        // Controlla se l'argomento è --locations
        if (arg.startsWith('--locations=')) {
            const locationsStr = arg.substring('--locations='.length);
            availableLocations = locationsStr.split(',').map(l => l.trim());
        }
        
        // Controlla se l'argomento è --debug
        if (arg === '--debug') {
            debug = true;
        }
    }
    
    console.log(`Location disponibili: ${availableLocations.join(', ')}`);
    if (debug) {
        console.log('Modalità debug: attivata');
    }
    
    // Analizza i log
    const pickupCounts = analyzePickupLogs(logFilePath, availableLocations, debug);
    
    // Visualizza i risultati
    console.log('\n=== CONTEGGIO RITIRI PER LOCATION ===');
    
    // Crea la data corrente nel formato desiderato
    const now = new Date();
    const formattedDate = now.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    console.log(`Data e ora: ${formattedDate}`);
    console.log('\nLocation\t\tRitiri');
    console.log('----------------------------------------');
    
    // Ordina le location per numero di ritiri (decrescente)
    const sortedLocations = Object.entries(pickupCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Calcola il totale
    const totalPickups = sortedLocations.reduce((sum, [_, count]) => sum + count, 0);
    
    // Visualizza i conteggi per ciascuna location
    for (const [location, count] of sortedLocations) {
        // Calcola la percentuale
        const percentage = (count / totalPickups * 100).toFixed(1);
        console.log(`${location.padEnd(20)}\t${count}\t(${percentage}%)`);
    }
    
    console.log('----------------------------------------');
    console.log(`TOTALE\t\t\t${totalPickups}\t(100.0%)`);
}

// Esegui la funzione principale
main();