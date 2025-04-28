/**
 * Modulo per il conteggio dei posti rimanenti per ogni slot
 */

/**
 * Funzione per ottenere i posti rimanenti per ogni slot
 * @param {Object} db - Istanza del database SQLite
 * @returns {Promise<Object>} Un oggetto con chiavi nel formato "data_location" e valori che rappresentano i posti rimanenti
 */
async function getRemainingSlots(db) {
    // Crea un oggetto per memorizzare i posti rimanenti
    const remainingSlots = {};
    
    // Ottieni i limiti dalle esperienze nel database
    try {
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, max_participants FROM experiences",
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        });
        
        // Inizializza i posti rimanenti con i limiti totali
        for (const exp of experiences) {
            // Crea chiavi per ogni time slot dell'esperienza
            // Assumiamo che ci siano fino a 5 time slot per esperienza
            for (let i = 1; i <= 5; i++) {
                const key = `${exp.experience_id}_${exp.experience_id}-${i}`;
                remainingSlots[key] = exp.max_participants;
            }
        }
    } catch (error) {
        console.error('Errore nel recupero dei limiti dalle esperienze:', error);
    }
    
    // Ottieni il conteggio delle prenotazioni per ogni combinazione di data e location
    return new Promise((resolve, reject) => {
        // First, get counts from the reservations table
        db.all(
            `SELECT day, custom_object_location, COUNT(*) as count FROM reservations GROUP BY day, custom_object_location`,
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Sottrai il conteggio delle prenotazioni dai limiti totali
                rows.forEach(row => {
                    // Se la location è vuota, usa una stringa vuota
                    const location = row.custom_object_location || '';
                    const day = row.day || '';
                    
                    // Crea la chiave nel formato usato in reservationOptions.limits
                    // Include both day and location in the key
                    const key = `${day}_${location}`;
                    
                    if (remainingSlots[key] !== undefined) {
                        remainingSlots[key] -= row.count;
                        
                        // Assicurati che il valore non sia negativo
                        if (remainingSlots[key] < 0) {
                            remainingSlots[key] = 0;
                        }
                    }
                });
                
                // Now, get counts from the opend_reservations table
                db.all(
                    `SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations GROUP BY experience_id, time_slot_id`,
                    (err, openDayRows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        // Process the counts from opend_reservations
                        openDayRows.forEach(row => {
                            const key = `${row.experience_id}_${row.time_slot_id}`;
                            
                            // If we have a limit for this key, subtract the count
                            if (remainingSlots[key] !== undefined) {
                                remainingSlots[key] -= row.count;
                                
                                // Ensure the value is not negative
                                if (remainingSlots[key] < 0) {
                                    remainingSlots[key] = 0;
                                }
                            }
                        });
                        
                        resolve(remainingSlots);
                    }
                );
            }
        );
    });
}

module.exports = { getRemainingSlots };