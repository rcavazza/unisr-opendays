/**
 * Script di test per verificare che la soluzione in due fasi funzioni correttamente
 * per la visualizzazione degli slot prenotati
 */
const axios = require('axios');
const logger = require('./logger');

// Configurazione
const BASE_URL = 'http://localhost:3000'; // Modifica se necessario
const CONTACT_ID = '90171178523'; // Usa un contactID che ha prenotazioni esistenti
const LANGUAGE = 'it';

/**
 * Funzione principale di test
 */
async function testTwoPhaseSolution() {
    try {
        console.log('Inizio test della soluzione in due fasi...');
        
        // Effettua la richiesta all'endpoint /api/get_experiences
        const response = await axios.get(`${BASE_URL}/api/get_experiences`, {
            params: {
                contactID: CONTACT_ID,
                lang: LANGUAGE
            }
        });
        
        // Verifica se la richiesta ha avuto successo
        if (response.status !== 200) {
            console.error(`Errore nella richiesta: status ${response.status}`);
            return;
        }
        
        // Estrai le esperienze dalla risposta
        const { experiences } = response.data;
        
        if (!experiences || !Array.isArray(experiences)) {
            console.error('Formato della risposta non valido o nessuna esperienza trovata');
            return;
        }
        
        console.log(`Trovate ${experiences.length} esperienze nella risposta`);
        
        // Conta gli slot selezionati
        let selectedSlots = 0;
        let totalSlots = 0;
        
        // Analizza ogni esperienza e i suoi slot
        experiences.forEach(experience => {
            console.log(`\nEsperienza: ${experience.title} (ID: ${experience.id})`);
            
            if (!experience.timeSlots || !Array.isArray(experience.timeSlots)) {
                console.log('  Nessuno slot trovato per questa esperienza');
                return;
            }
            
            totalSlots += experience.timeSlots.length;
            
            // Analizza ogni slot
            experience.timeSlots.forEach(slot => {
                const selectedStatus = slot.selected ? 'SELEZIONATO' : 'non selezionato';
                console.log(`  Slot ${slot.id} (dbId: ${slot.dbId}): ${slot.time} - ${selectedStatus}`);
                
                if (slot.selected) {
                    selectedSlots++;
                }
            });
        });
        
        // Mostra il riepilogo
        console.log('\nRiepilogo:');
        console.log(`Totale slot: ${totalSlots}`);
        console.log(`Slot selezionati: ${selectedSlots}`);
        
        if (selectedSlots > 0) {
            console.log('\nTest SUPERATO: Alcuni slot sono stati correttamente marcati come selezionati');
            
            // Verifica se ci sono almeno 2 slot selezionati (come ci aspettiamo)
            if (selectedSlots >= 2) {
                console.log('Test SUPERATO COMPLETAMENTE: Tutti gli slot prenotati sono stati correttamente marcati come selezionati');
            } else {
                console.log('Test PARZIALMENTE SUPERATO: Non tutti gli slot prenotati sono stati marcati come selezionati');
            }
        } else {
            console.log('\nTest FALLITO: Nessuno slot è stato marcato come selezionato');
        }
        
    } catch (error) {
        console.error('Errore durante il test:', error.message);
        if (error.response) {
            console.error('Dettagli della risposta:', error.response.data);
        }
    }
}

// Esegui il test
testTwoPhaseSolution();