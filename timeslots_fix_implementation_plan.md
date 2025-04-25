# Piano di Implementazione: Correzione Timeslots nell'API `/get_experiences`

## Problema
L'esperienza ha più sessioni nel database (più righe con lo stesso experience_id ma orari diversi), ma solo una viene mostrata nell'API.

## Soluzione
Modificare la funzione `getExperiencesByCustomObjectIds` in `courseExperienceService.js` per garantire che tutte le sessioni con lo stesso experience_id ma orari diversi vengano aggiunte come timeslot separati.

## Passi di Implementazione

### 1. Aggiungere Log di Debug
Aggiungere log dettagliati per tracciare come vengono elaborate le righe con lo stesso experience_id:

```javascript
// Nella funzione getExperiencesByCustomObjectIds
// Dopo aver eseguito la query al database

// Log per debug
logger.info(`Numero totale di righe: ${rows.length}`);

// Conteggio delle righe per experience_id
const countByExperienceId = {};
rows.forEach(row => {
    countByExperienceId[row.experience_id] = (countByExperienceId[row.experience_id] || 0) + 1;
});
logger.info(`Conteggio righe per experience_id: ${JSON.stringify(countByExperienceId)}`);
```

### 2. Migliorare l'Ordinamento dei Risultati
Modificare la query SQL per ordinare i risultati per experience_id e ora_inizio:

```javascript
db.all(
    `SELECT experience_id, title, course, location, desc, max_participants, current_participants, duration, ora_inizio, ora_fine
     FROM experiences
     WHERE course_type IN (${placeholders}) AND language = ?
     ORDER BY experience_id, ora_inizio`,  // Aggiunto ORDER BY
    [...customObjectIds, language],
    // ...
);
```

### 3. Migliorare la Logica di Elaborazione delle Righe
Aggiungere log dettagliati durante l'elaborazione di ogni riga:

```javascript
rows.forEach(row => {
    logger.info(`Elaborazione riga per experience_id: ${row.experience_id}, ora_inizio: ${row.ora_inizio}`);
    
    if (!experienceMap.has(row.experience_id)) {
        logger.info(`Creazione nuova esperienza per ${row.experience_id}`);
        experienceMap.set(row.experience_id, {
            id: row.experience_id,
            title: row.title,
            course: row.course || '',
            location: row.location,
            duration: row.duration,
            desc: row.desc,
            timeSlots: []
        });
    }
    
    const experience = experienceMap.get(row.experience_id);
    
    // Assicurati che timeSlots esista
    if (!experience.timeSlots) {
        logger.info(`Creazione array timeSlots per ${row.experience_id}`);
        experience.timeSlots = [];
    }
    
    // Aggiungi sempre un timeslot se ora_inizio ha un valore
    if (row.ora_inizio && row.ora_inizio.trim() !== '') {
        logger.info(`Aggiunta timeslot per ${row.experience_id} con ora_inizio: ${row.ora_inizio}`);
        experience.timeSlots.push({
            id: `${row.experience_id}-${experience.timeSlots.length + 1}`,
            time: formatTime(row.ora_inizio),
            available: Math.max(0, row.max_participants - row.current_participants)
        });
        logger.info(`Dopo l'aggiunta del timeslot, lunghezza timeSlots: ${experience.timeSlots.length}`);
    } else {
        // Codice esistente per i timeslot predefiniti
    }
});
```

### 4. Aggiungere Log Finali
Aggiungere log per verificare il numero di timeslot per ogni esperienza:

```javascript
// Log finale per verificare il numero di timeslot per ogni esperienza
experienceMap.forEach((exp, id) => {
    logger.info(`Esperienza ${id} ha ${exp.timeSlots.length} timeslots`);
});
```

## Codice Completo della Funzione Modificata

```javascript
/**
 * Retrieves experiences based on custom object IDs and language
 * @param {Object} db - Database instance
 * @param {Array<string>} customObjectIds - Array of custom object IDs
 * @param {string} language - Language code (e.g., 'en', 'it')
 * @returns {Promise<Array<Object>>} - Array of experience objects
 */
async function getExperiencesByCustomObjectIds(db, customObjectIds, language) {
    try {
        logger.info(`Retrieving experiences for custom object IDs: ${customObjectIds.join(', ')} in language: ${language}`);
        
        // Create placeholders for the SQL query
        const placeholders = customObjectIds.map(() => '?').join(',');
        
        // Log the custom object IDs being used in the query
        logger.info(`Custom object IDs for query: ${JSON.stringify(customObjectIds)}`);
        
        // Query the database to see what course_type values are available
        db.all("SELECT DISTINCT course_type FROM experiences", (err, rows) => {
            if (err) {
                logger.error(`Error retrieving course_type values: ${err.message}`);
            } else {
                logger.info(`Available course_type values: ${JSON.stringify(rows.map(row => row.course_type))}`);
            }
        });
        
        // Query the database to see what experiences have ora_inizio and ora_fine values
        db.all("SELECT id, experience_id, title, course_type, ora_inizio, ora_fine FROM experiences WHERE ora_inizio != '' OR ora_fine != ''", (err, rows) => {
            if (err) {
                logger.error(`Error retrieving experiences with time values: ${err.message}`);
            } else {
                logger.info(`Experiences with time values: ${JSON.stringify(rows)}`);
            }
        });
        
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT experience_id, title, course, location, desc, max_participants, current_participants, duration, ora_inizio, ora_fine
                 FROM experiences
                 WHERE course_type IN (${placeholders}) AND language = ?
                 ORDER BY experience_id, ora_inizio`,  // Aggiunto ORDER BY per raggruppare le righe con lo stesso experience_id
                [...customObjectIds, language],
                (err, rows) => {
                    if (err) {
                        logger.error(`Error retrieving experiences: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Retrieved ${rows.length} experiences`);
                        
                        // Log per debug
                        logger.info(`Numero totale di righe: ${rows.length}`);
                        
                        // Conteggio delle righe per experience_id
                        const countByExperienceId = {};
                        rows.forEach(row => {
                            countByExperienceId[row.experience_id] = (countByExperienceId[row.experience_id] || 0) + 1;
                        });
                        logger.info(`Conteggio righe per experience_id: ${JSON.stringify(countByExperienceId)}`);
                        
                        // Log all rows to see what fields are present
                        rows.forEach((row, index) => {
                            logger.info(`Row ${index}: ${JSON.stringify(row)}`);
                            logger.info(`Row ${index} ora_inizio: ${row.ora_inizio}, type: ${typeof row.ora_inizio}`);
                            logger.info(`Row ${index} ora_fine: ${row.ora_fine}, type: ${typeof row.ora_fine}`);
                        });
                        
                        // Group the rows by experience_id
                        const experienceMap = new Map();
                        
                        rows.forEach(row => {
                            logger.info(`Elaborazione riga per experience_id: ${row.experience_id}, ora_inizio: ${row.ora_inizio}`);
                            
                            if (!experienceMap.has(row.experience_id)) {
                                logger.info(`Creazione nuova esperienza per ${row.experience_id}`);
                                experienceMap.set(row.experience_id, {
                                    id: row.experience_id,
                                    title: row.title,
                                    course: row.course || '',
                                    location: row.location,
                                    duration: row.duration,
                                    desc: row.desc,
                                    timeSlots: []
                                });
                            }
                            
                            const experience = experienceMap.get(row.experience_id);
                            
                            // Assicurati che timeSlots esista
                            if (!experience.timeSlots) {
                                logger.info(`Creazione array timeSlots per ${row.experience_id}`);
                                experience.timeSlots = [];
                            }
                            
                            // Log the current state of timeSlots
                            logger.info(`Current timeSlots for ${row.experience_id}: ${JSON.stringify(experience.timeSlots)}`);
                            
                            // Aggiungi sempre un timeslot se ora_inizio ha un valore
                            if (row.ora_inizio && row.ora_inizio.trim() !== '') {
                                logger.info(`Aggiunta timeslot per ${row.experience_id} con ora_inizio: ${row.ora_inizio}`);
                                experience.timeSlots.push({
                                    id: `${row.experience_id}-${experience.timeSlots.length + 1}`,
                                    time: formatTime(row.ora_inizio),
                                    available: Math.max(0, row.max_participants - row.current_participants)
                                });
                                logger.info(`Dopo l'aggiunta del timeslot, lunghezza timeSlots: ${experience.timeSlots.length}`);
                            } else {
                                // Add default time slots if ora_inizio is empty
                                logger.info(`Adding default time slots for ${row.experience_id}`);
                                const defaultTimeSlots = [
                                    { time: '09:00', offset: 0 },
                                    { time: '11:00', offset: 2 },
                                    { time: '14:00', offset: 1 }
                                ];
                                
                                // Log the default time slots
                                logger.info(`Default time slots: ${JSON.stringify(defaultTimeSlots)}`);
                                
                                defaultTimeSlots.forEach((slot, index) => {
                                    const available = Math.max(0, row.max_participants - row.current_participants - slot.offset);
                                    const formattedTime = formatTime(slot.time);
                                    
                                    logger.info(`Adding default slot ${index + 1}: time=${slot.time}, formatted=${formattedTime}, available=${available}`);
                                    
                                    experience.timeSlots.push({
                                        id: `${row.experience_id}-${index + 1}`,
                                        time: formattedTime,
                                        available: available
                                    });
                                });
                                
                                // Verify that the time slots were added
                                logger.info(`After adding default slots, timeSlots length: ${experience.timeSlots.length}`);
                                logger.info(`Updated timeSlots: ${JSON.stringify(experience.timeSlots)}`);
                            }
                        });
                        
                        // Log finale per verificare il numero di timeslot per ogni esperienza
                        experienceMap.forEach((exp, id) => {
                            logger.info(`Esperienza ${id} ha ${exp.timeSlots.length} timeslots`);
                        });
                        
                        // Convert the map to an array
                        const experiences = Array.from(experienceMap.values());
                        
                        resolve(experiences);
                    }
                }
            );
        });
    } catch (error) {
        logger.error('Error in getExperiencesByCustomObjectIds:', error);
        throw error;
    }
}
```

## Test della Soluzione

1. Implementare le modifiche al codice
2. Riavviare il server
3. Testare l'endpoint `/api/get_experiences` con un contactID valido
4. Verificare nei log che:
   - Vengano trovate più righe per lo stesso experience_id
   - Ogni riga aggiunga un timeslot separato
   - La risposta API contenga tutti i timeslot

## Verifica del Successo

La soluzione sarà considerata implementata con successo quando:
1. L'endpoint `/api/get_experiences` restituisce esperienze con tutti i timeslot disponibili
2. I log mostrano che ogni riga con lo stesso experience_id ma orari diversi aggiunge un timeslot separato
3. Non ci sono errori nei log relativi all'elaborazione dei timeslot