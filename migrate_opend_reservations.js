/**
 * Script di migrazione per aggiornare i record esistenti nella tabella opend_reservations
 * in modo che il campo experience_id contenga il dbId (ID numerico) invece dell'experience_id testuale.
 */
const sqlite3 = require("sqlite3").verbose();
const logger = require('./logger');
const path = require('path');

// Connessione al database
const db = new sqlite3.Database(path.join(__dirname, "fcfs.sqlite"), async (err) => {
    if (err) {
        console.error("Errore nella connessione al database:", err.message);
        process.exit(1);
    }
    console.log("Connessione al database fcfs.sqlite stabilita");
    
    try {
        await migrateExistingReservations();
        console.log("Migrazione completata con successo");
        process.exit(0);
    } catch (error) {
        console.error("Errore durante la migrazione:", error.message);
        process.exit(1);
    }
});

/**
 * Funzione principale di migrazione
 */
async function migrateExistingReservations() {
    try {
        console.log('Inizio migrazione delle prenotazioni esistenti...');
        
        // Crea una tabella di backup prima di iniziare
        await new Promise((resolve, reject) => {
            db.run(
                "CREATE TABLE IF NOT EXISTS opend_reservations_backup AS SELECT * FROM opend_reservations",
                (err) => {
                    if (err) {
                        console.error("Errore nella creazione della tabella di backup:", err.message);
                        reject(err);
                    } else {
                        console.log("Tabella di backup creata con successo");
                        resolve();
                    }
                }
            );
        });
        
        // Ottieni tutte le prenotazioni esistenti
        const reservations = await new Promise((resolve, reject) => {
            db.all(
                "SELECT id, contact_id, experience_id, time_slot_id FROM opend_reservations",
                [],
                (err, rows) => {
                    if (err) {
                        console.error("Errore nel recupero delle prenotazioni:", err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        console.log(`Trovate ${reservations.length} prenotazioni da migrare`);
        
        // Contatori per statistiche
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        // Per ogni prenotazione, trova il dbId corrispondente all'experience_id testuale
        for (const reservation of reservations) {
            try {
                // Verifica se l'experience_id è già un numero
                if (!isNaN(Number(reservation.experience_id))) {
                    // Verifica se esiste un record nella tabella experiences con questo ID
                    const existingExperience = await new Promise((resolve, reject) => {
                        db.get(
                            "SELECT id FROM experiences WHERE id = ?",
                            [reservation.experience_id],
                            (err, row) => {
                                if (err) reject(err);
                                else resolve(row);
                            }
                        );
                    });
                    
                    if (existingExperience) {
                        console.log(`Prenotazione ${reservation.id}: experience_id ${reservation.experience_id} è già un ID numerico valido, saltata`);
                        skippedCount++;
                        continue;
                    }
                }
                
                // Trova il dbId corrispondente all'experience_id testuale
                const experience = await new Promise((resolve, reject) => {
                    db.get(
                        "SELECT id FROM experiences WHERE experience_id = ?",
                        [reservation.experience_id],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        }
                    );
                });
                
                if (experience) {
                    // Aggiorna il record con il dbId
                    await new Promise((resolve, reject) => {
                        db.run(
                            "UPDATE opend_reservations SET experience_id = ? WHERE id = ?",
                            [experience.id, reservation.id],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                    
                    console.log(`Migrata prenotazione ${reservation.id}: ${reservation.experience_id} -> ${experience.id}`);
                    successCount++;
                } else {
                    console.warn(`Impossibile trovare dbId per experience_id ${reservation.experience_id}, prenotazione ${reservation.id}`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`Errore nella migrazione della prenotazione ${reservation.id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('Migrazione completata');
        console.log(`Statistiche: ${successCount} migrate con successo, ${skippedCount} saltate, ${errorCount} errori`);
    } catch (error) {
        console.error(`Errore nella migrazione: ${error.message}`);
        throw error;
    }
}