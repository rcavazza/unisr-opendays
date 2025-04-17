#!/usr/bin/env node

/**
 * Script per testare l'implementazione del campo location
 * 
 * Questo script:
 * 1. Aggiunge il campo location al database se non esiste
 * 2. Inserisce alcuni dati di test
 * 3. Mostra i posti rimanenti per ogni slot
 */

const sqlite3 = require('sqlite3').verbose();
const { getRemainingSlots } = require('./remainingSlots');

// Carica le opzioni di prenotazione
const reservationOptions = require('./reservationOptions.json');

console.log('Avvio test implementazione location...');

// Apri il database
const db = new sqlite3.Database('fcfs.sqlite', async (err) => {
    if (err) {
        console.error('Errore nell\'apertura del database:', err.message);
        process.exit(1);
    }
    
    try {
        // Verifica se la tabella reservations esiste
        const tableExists = await new Promise((resolve, reject) => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'", (err, row) => {
                if (err) reject(err);
                else resolve(row ? true : false);
            });
        });
        
        if (!tableExists) {
            console.log('La tabella reservations non esiste. Creazione della tabella...');
            
            await new Promise((resolve, reject) => {
                db.run(`CREATE TABLE reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    day TEXT,
                    custom_object_location TEXT
                )`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log('Tabella reservations creata con successo');
        }
        
        // Verifica se la colonna custom_object_location esiste
        const columns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(reservations)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.name));
            });
        });
        
        if (!columns.includes('custom_object_location')) {
            console.log('La colonna custom_object_location non esiste. Aggiunta della colonna...');
            
            await new Promise((resolve, reject) => {
                db.run(`ALTER TABLE reservations ADD COLUMN custom_object_location TEXT`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log('Colonna custom_object_location aggiunta con successo');
        }
        
        // Ottieni i posti rimanenti prima di inserire i dati di test
        console.log('\nPosti rimanenti prima dell\'inserimento dei dati di test:');
        const remainingSlotsBefore = await getRemainingSlots(db, reservationOptions);
        console.log(JSON.stringify(remainingSlotsBefore, null, 2));
        
        // Inserisci alcuni dati di test se non ci sono già prenotazioni
        const reservationCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM reservations", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        if (reservationCount === 0) {
            console.log('\nNessuna prenotazione trovata. Inserimento di dati di test...');
            
            // Ottieni le date disponibili dalle opzioni di prenotazione
            const dateField = reservationOptions.fields.find(f => f.id === 'day') || { values: [] };
            const dates = dateField.values || [];
            
            if (dates.length === 0) {
                console.log('Nessuna data disponibile nelle opzioni di prenotazione');
            } else {
                // Inserisci alcune prenotazioni di test
                const testData = [
                    { user_id: 'test1', day: dates[0], custom_object_location: 'Milano' },
                    { user_id: 'test2', day: dates[0], custom_object_location: 'Milano' },
                    { user_id: 'test3', day: dates[0], custom_object_location: 'Milano' }
                ];
                
                for (const data of testData) {
                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT INTO reservations (user_id, day, custom_object_location) VALUES (?, ?, ?)`,
                            [data.user_id, data.day, data.custom_object_location],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                }
                
                console.log(`Inserite ${testData.length} prenotazioni di test`);
            }
        } else {
            console.log(`\nTrovate ${reservationCount} prenotazioni esistenti nel database`);
        }
        
        // Ottieni i posti rimanenti dopo l'inserimento dei dati di test
        console.log('\nPosti rimanenti dopo l\'inserimento dei dati di test:');
        const remainingSlotsAfter = await getRemainingSlots(db, reservationOptions);
        console.log(JSON.stringify(remainingSlotsAfter, null, 2));
        
        console.log('\nTest completato con successo!');
        console.log('\nPer vedere i risultati nell\'interfaccia utente, avvia il server con:');
        console.log('node server.js');
        console.log('\nQuindi visita:');
        console.log('http://localhost:[porta]/selection?contactID=test&lang=it&location=Milano');
        
    } catch (error) {
        console.error('Errore durante il test:', error);
    } finally {
        // Chiudi il database
        db.close();
    }
});