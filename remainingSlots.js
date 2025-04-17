/**
 * Modulo per il conteggio dei posti rimanenti per ogni slot
 */

/**
 * Funzione per ottenere i posti rimanenti per ogni slot
 * @param {Object} db - Istanza del database SQLite
 * @param {Object} reservationOptions - Opzioni di prenotazione con i limiti
 * @returns {Promise<Object>} Un oggetto con chiavi nel formato "data_location" e valori che rappresentano i posti rimanenti
 */
async function getRemainingSlots(db, reservationOptions) {
    // Ottieni tutti i limiti dalle opzioni di prenotazione
    const limits = reservationOptions.limits || {};
    
    // Crea un oggetto per memorizzare i posti rimanenti
    const remainingSlots = {};
    
    // Inizializza i posti rimanenti con i limiti totali
    for (const key in limits) {
        remainingSlots[key] = limits[key];
    }
    
    // Ottieni il conteggio delle prenotazioni per ogni combinazione di data e location
    return new Promise((resolve, reject) => {
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
                
                resolve(remainingSlots);
            }
        );
    });
}

module.exports = { getRemainingSlots };