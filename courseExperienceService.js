/**
 * Servizio per la gestione di corsi ed esperienze
 * 
 * Questo modulo fornisce funzioni per:
 * - Recuperare i dettagli del contatto da HubSpot
 * - Salvare i corsi confermati nel database
 * - Recuperare le esperienze disponibili in base ai corsi confermati
 * - Salvare le esperienze selezionate nel database
 */

const axios = require('axios');
const logger = require('./logger');

/**
 * Recupera i dettagli del contatto da HubSpot
 * @param {string} contactId - ID del contatto HubSpot
 * @returns {Promise<Object>} - Oggetto con le proprietà del contatto
 */
async function getContactDetails(contactId) {
    try {
        logger.info(`Recupero dettagli contatto da HubSpot per ID: ${contactId}`);
        const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts/' + contactId + '?properties=email,firstname,lastname');
        logger.info(`Dettagli contatto recuperati con successo: ${response.data.properties.email}`);
        return response.data.properties;
    } catch (error) {
        logger.error('Errore nel recupero dei dettagli del contatto:', error);
        throw error;
    }
}

/**
 * Salva i corsi confermati nel database
 * @param {Object} db - Istanza del database SQLite
 * @param {string} contactId - ID del contatto HubSpot
 * @param {Array<string>} courseIds - Array di ID dei corsi confermati
 * @returns {Promise<boolean>} - true se l'operazione è riuscita
 */
async function saveConfirmedCourses(db, contactId, courseIds) {
    try {
        logger.info(`Salvataggio corsi confermati per contatto ID: ${contactId}`);
        
        // Elimina eventuali corsi confermati in precedenza
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM user_courses WHERE user_id = ?", [contactId], (err) => {
                if (err) {
                    logger.error(`Errore nell'eliminazione dei corsi precedenti: ${err.message}`);
                    reject(err);
                } else {
                    logger.info(`Corsi precedenti eliminati per contatto ID: ${contactId}`);
                    resolve();
                }
            });
        });
        
        // Se non ci sono corsi da salvare, termina qui
        if (!courseIds || courseIds.length === 0) {
            logger.info(`Nessun corso da salvare per contatto ID: ${contactId}`);
            return true;
        }
        
        // Recupera i dettagli dei corsi (in produzione, da HubSpot)
        // Per ora, utilizziamo dati mock
        const mockCourses = [
            { id: 'course1', title: 'Introduzione alla Medicina', date: '2025-05-10 10:00', location: 'Aula Magna' },
            { id: 'course2', title: 'Biologia Cellulare', date: '2025-05-11 14:30', location: 'Laboratorio B' }
        ];
        
        // Inserisci i nuovi corsi confermati
        for (const courseId of courseIds) {
            const course = mockCourses.find(c => c.id === courseId);
            if (course) {
                await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO user_courses (user_id, course_id, course_title, course_date, course_location, confirmed) VALUES (?, ?, ?, ?, ?, ?)",
                        [contactId, course.id, course.title, course.date, course.location, 1],
                        (err) => {
                            if (err) {
                                logger.error(`Errore nell'inserimento del corso ${course.id}: ${err.message}`);
                                reject(err);
                            } else {
                                logger.info(`Corso ${course.id} salvato per contatto ID: ${contactId}`);
                                resolve();
                            }
                        }
                    );
                });
            } else {
                logger.warn(`Corso con ID ${courseId} non trovato nei dati mock`);
            }
        }
        
        logger.info(`Tutti i corsi salvati con successo per contatto ID: ${contactId}`);
        return true;
    } catch (error) {
        logger.error('Errore nel salvataggio dei corsi confermati:', error);
        throw error;
    }
}

/**
 * Recupera le esperienze disponibili in base ai corsi confermati
 * @param {Object} db - Istanza del database SQLite
 * @param {Array<string>} courseIds - Array di ID dei corsi confermati
 * @returns {Promise<Array<Object>>} - Array di oggetti esperienza
 */
async function getAvailableExperiences(db, courseIds) {
    try {
        logger.info(`Recupero esperienze disponibili per corsi: ${courseIds.join(', ')}`);
        
        // In produzione, questa funzione dovrebbe recuperare le esperienze dal database
        // in base ai corsi confermati utilizzando la tabella course_experience_mapping
        
        // Per ora, utilizziamo dati mock
        const mockExperiences = [
            { id: 'exp1', title: 'Visita Laboratorio Ricerca', date: '2025-05-12 09:00', location: 'Edificio A', course_type: 'course1' },
            { id: 'exp2', title: 'Simulazione Chirurgica', date: '2025-05-12 11:00', location: 'Sala Operatoria Didattica', course_type: 'course1' },
            { id: 'exp3', title: 'Analisi Microscopica', date: '2025-05-13 10:00', location: 'Laboratorio C', course_type: 'course2' }
        ];
        
        // Filtra le esperienze in base ai corsi confermati
        const availableExperiences = mockExperiences.filter(exp => 
            courseIds.includes(exp.course_type)
        );
        
        logger.info(`Trovate ${availableExperiences.length} esperienze disponibili`);
        return availableExperiences;
    } catch (error) {
        logger.error('Errore nel recupero delle esperienze disponibili:', error);
        throw error;
    }
}

/**
 * Salva le esperienze selezionate nel database
 * @param {Object} db - Istanza del database SQLite
 * @param {string} contactId - ID del contatto HubSpot
 * @param {Array<string>} experienceIds - Array di ID delle esperienze selezionate
 * @returns {Promise<boolean>} - true se l'operazione è riuscita
 */
async function saveSelectedExperiences(db, contactId, experienceIds) {
    try {
        logger.info(`Salvataggio esperienze selezionate per contatto ID: ${contactId}`);
        
        // Elimina eventuali esperienze selezionate in precedenza
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM user_experiences WHERE user_id = ?", [contactId], (err) => {
                if (err) {
                    logger.error(`Errore nell'eliminazione delle esperienze precedenti: ${err.message}`);
                    reject(err);
                } else {
                    logger.info(`Esperienze precedenti eliminate per contatto ID: ${contactId}`);
                    resolve();
                }
            });
        });
        
        // Se non ci sono esperienze da salvare, termina qui
        if (!experienceIds || experienceIds.length === 0) {
            logger.info(`Nessuna esperienza da salvare per contatto ID: ${contactId}`);
            return true;
        }
        
        // Recupera i dettagli delle esperienze
        // Per ora, utilizziamo dati mock
        const mockExperiences = [
            { id: 'exp1', title: 'Visita Laboratorio Ricerca', date: '2025-05-12 09:00', location: 'Edificio A' },
            { id: 'exp2', title: 'Simulazione Chirurgica', date: '2025-05-12 11:00', location: 'Sala Operatoria Didattica' },
            { id: 'exp3', title: 'Analisi Microscopica', date: '2025-05-13 10:00', location: 'Laboratorio C' }
        ];
        
        // Inserisci le nuove esperienze selezionate
        for (const expId of experienceIds) {
            const experience = mockExperiences.find(e => e.id === expId);
            if (experience) {
                await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO user_experiences (user_id, experience_id, experience_title, experience_date, experience_location) VALUES (?, ?, ?, ?, ?)",
                        [contactId, experience.id, experience.title, experience.date, experience.location],
                        (err) => {
                            if (err) {
                                logger.error(`Errore nell'inserimento dell'esperienza ${experience.id}: ${err.message}`);
                                reject(err);
                            } else {
                                logger.info(`Esperienza ${experience.id} salvata per contatto ID: ${contactId}`);
                                resolve();
                            }
                        }
                    );
                });
                
                // Aggiorna il conteggio dei partecipanti per questa esperienza
                await new Promise((resolve, reject) => {
                    db.run(
                        "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id = ?",
                        [experience.id],
                        (err) => {
                            if (err) {
                                logger.error(`Errore nell'aggiornamento del conteggio partecipanti per l'esperienza ${experience.id}: ${err.message}`);
                                reject(err);
                            } else {
                                logger.info(`Conteggio partecipanti aggiornato per l'esperienza ${experience.id}`);
                                resolve();
                            }
                        }
                    );
                });
            } else {
                logger.warn(`Esperienza con ID ${expId} non trovata nei dati mock`);
            }
        }
        
        logger.info(`Tutte le esperienze salvate con successo per contatto ID: ${contactId}`);
        return true;
    } catch (error) {
        logger.error('Errore nel salvataggio delle esperienze selezionate:', error);
        throw error;
    }
}

/**
 * Recupera i dettagli dei corsi confermati per un contatto
 * @param {Object} db - Istanza del database SQLite
 * @param {string} contactId - ID del contatto HubSpot
 * @returns {Promise<Array<Object>>} - Array di oggetti corso
 */
async function getConfirmedCourses(db, contactId) {
    try {
        logger.info(`Recupero corsi confermati per contatto ID: ${contactId}`);
        
        return new Promise((resolve, reject) => {
            db.all(
                "SELECT course_id, course_title, course_date, course_location FROM user_courses WHERE user_id = ? AND confirmed = 1",
                [contactId],
                (err, rows) => {
                    if (err) {
                        logger.error(`Errore nel recupero dei corsi confermati: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Recuperati ${rows.length} corsi confermati per contatto ID: ${contactId}`);
                        
                        // Trasforma i risultati nel formato desiderato
                        const courses = rows.map(row => ({
                            id: row.course_id,
                            title: row.course_title,
                            date: row.course_date,
                            location: row.course_location
                        }));
                        
                        resolve(courses);
                    }
                }
            );
        });
    } catch (error) {
        logger.error('Errore nel recupero dei corsi confermati:', error);
        throw error;
    }
}

/**
 * Recupera i dettagli delle esperienze selezionate per un contatto
 * @param {Object} db - Istanza del database SQLite
 * @param {string} contactId - ID del contatto HubSpot
 * @returns {Promise<Array<Object>>} - Array di oggetti esperienza
 */
async function getSelectedExperiences(db, contactId) {
    try {
        logger.info(`Recupero esperienze selezionate per contatto ID: ${contactId}`);
        
        return new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, experience_title, experience_date, experience_location FROM user_experiences WHERE user_id = ?",
                [contactId],
                (err, rows) => {
                    if (err) {
                        logger.error(`Errore nel recupero delle esperienze selezionate: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Recuperate ${rows.length} esperienze selezionate per contatto ID: ${contactId}`);
                        
                        // Trasforma i risultati nel formato desiderato
                        const experiences = rows.map(row => ({
                            id: row.experience_id,
                            title: row.experience_title,
                            date: row.experience_date,
                            location: row.experience_location
                        }));
                        
                        resolve(experiences);
                    }
                }
            );
        });
    } catch (error) {
        logger.error('Errore nel recupero delle esperienze selezionate:', error);
        throw error;
    }
}

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
            // First, get all experience_ids that match the course_type
            db.all(
                `SELECT DISTINCT experience_id
                 FROM experiences
                 WHERE course_type IN (${placeholders}) AND language = ?`,
                [...customObjectIds, language],
                (err, experienceIds) => {
                    if (err) {
                        logger.error(`Error retrieving experience IDs: ${err.message}`);
                        reject(err);
                        return;
                    }
                    
                    // If no experiences found, return empty array
                    if (experienceIds.length === 0) {
                        logger.info(`No experiences found for the given course types`);
                        resolve([]);
                        return;
                    }
                    
                    // Extract the experience_ids
                    const ids = experienceIds.map(row => row.experience_id);
                    logger.info(`Found experience IDs: ${JSON.stringify(ids)}`);
                    
                    // Create placeholders for the experience_ids
                    const experiencePlaceholders = ids.map(() => '?').join(',');
                    
                    // Get the course_type for each experience_id
                    db.all(
                        `SELECT experience_id, course_type FROM experiences WHERE experience_id IN (${experiencePlaceholders})`,
                        [...ids],
                        (err, courseTypeRows) => {
                            if (err) {
                                logger.error(`Error retrieving course types: ${err.message}`);
                                reject(err);
                                return;
                            }
                            
                            // Create a map of experience_id to course_type
                            const courseTypeMap = {};
                            courseTypeRows.forEach(row => {
                                courseTypeMap[row.experience_id] = row.course_type;
                            });
                            
                            logger.info(`Course type map: ${JSON.stringify(courseTypeMap)}`);
                            
                            // Extract base experience IDs (without the number suffix)
                            const baseIds = ids.map(id => id.replace(/-\d+$/, ''));
                            logger.info(`Base experience IDs: ${JSON.stringify(baseIds)}`);
                            
                            // Create a SQL LIKE condition for each base ID with its corresponding course_type
                            const whereClauses = [];
                            const whereParams = [];
                            
                            ids.forEach(id => {
                                const baseId = id.replace(/-\d+$/, '');
                                const courseType = courseTypeMap[id];
                                
                                if (baseId && courseType) {
                                    whereClauses.push('(experience_id LIKE ? AND course_type = ?)');
                                    whereParams.push(`${baseId}-%`, courseType);
                                }
                            });
                            
                            // If no valid clauses, return empty array
                            if (whereClauses.length === 0) {
                                logger.info(`No valid experience IDs with course types found`);
                                resolve([]);
                                return;
                            }
                            
                            const whereClause = whereClauses.join(' OR ');
                            
                            logger.info(`WHERE clauses: ${whereClause}`);
                            logger.info(`WHERE params: ${JSON.stringify(whereParams)}`);
                            
                            // Now get all rows where experience_id starts with any of these base names AND has the same course_type
                            db.all(
                                `SELECT experience_id, title, course, location, desc, max_participants, current_participants, duration, ora_inizio, ora_fine
                                 FROM experiences
                                 WHERE (${whereClause}) AND language = ?
                                 ORDER BY experience_id, ora_inizio`,
                                [...whereParams, language],
                                (err, rows) => {
                                    if (err) {
                                        logger.error(`Error retrieving experiences: ${err.message}`);
                                        reject(err);
                                        return;
                                    }
                                    
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
                                    
                                    // Group the rows by base experience_id (without the number suffix)
                                    const experienceMap = new Map();
                                    
                                    rows.forEach(row => {
                                        logger.info(`Elaborazione riga per experience_id: ${row.experience_id}, ora_inizio: ${row.ora_inizio}`);
                                        
                                        // Extract the base name from the experience_id (e.g., "imdp-e-medicina-chirurgia-mani" from "imdp-e-medicina-chirurgia-mani-2")
                                        const baseExperienceId = row.experience_id.replace(/-\d+$/, '');
                                        logger.info(`Base experience ID: ${baseExperienceId}`);
                                        
                                        if (!experienceMap.has(baseExperienceId)) {
                                            logger.info(`Creazione nuova esperienza per base ${baseExperienceId}`);
                                            experienceMap.set(baseExperienceId, {
                                                id: baseExperienceId, // Use the base ID as the experience ID
                                                title: row.title,
                                                course: row.course || '',
                                                location: row.location,
                                                duration: row.duration,
                                                desc: row.desc,
                                                timeSlots: []
                                            });
                                        }
                                        
                                        const experience = experienceMap.get(baseExperienceId);
                                        
                                        // Add time slot if ora_inizio exists and is not an empty string
                                        logger.info(`Checking ora_inizio for ${row.experience_id}: ${row.ora_inizio}, type: ${typeof row.ora_inizio}`);
                                        
                                        // Check if timeSlots array exists
                                        if (!experience.timeSlots) {
                                            logger.info(`Creating timeSlots array for ${row.experience_id}`);
                                            experience.timeSlots = [];
                                        }
                                        
                                        // Log the current state of timeSlots
                                        logger.info(`Current timeSlots for ${row.experience_id}: ${JSON.stringify(experience.timeSlots)}`);
                                        
                                        if (row.ora_inizio && row.ora_inizio.trim() !== '') {
                                            logger.info(`Adding time slot for ${row.experience_id} with ora_inizio: ${row.ora_inizio} and ora_fine: ${row.ora_fine}`);
                                            experience.timeSlots.push({
                                                id: `${row.experience_id}-${experience.timeSlots.length + 1}`,
                                                time: formatTime(row.ora_inizio),
                                                endTime: formatTime(row.ora_fine),
                                                available: Math.max(0, row.max_participants - row.current_participants)
                                            });
                                            logger.info(`After adding time slot, timeSlots length: ${experience.timeSlots.length}`);
                                        }
                                        // No else clause - we don't add default timeslots anymore
                                    });
                                    
                                    // Log finale per verificare il numero di timeslot per ogni esperienza
                                    experienceMap.forEach((exp, id) => {
                                        logger.info(`Esperienza ${id} ha ${exp.timeSlots.length} timeslots`);
                                    });
                                    
                                    // Convert the map to an array
                                    const experiences = Array.from(experienceMap.values());
                                    
                                    // Sort timeslots for each experience by time (earliest to latest)
                                    experiences.forEach(experience => {
                                        if (experience.timeSlots && experience.timeSlots.length > 0) {
                                            experience.timeSlots.sort((a, b) => {
                                                // Parse the time strings to compare them
                                                const timeA = a.time.replace(/[APM]/g, '').trim();
                                                const timeB = b.time.replace(/[APM]/g, '').trim();
                                                
                                                // Extract hours and minutes
                                                const [hoursA, minutesA] = timeA.split(':').map(Number);
                                                const [hoursB, minutesB] = timeB.split(':').map(Number);
                                                
                                                // Convert to 24-hour format for comparison
                                                const isPMA = a.time.includes('PM') && hoursA !== 12;
                                                const isPMB = b.time.includes('PM') && hoursB !== 12;
                                                const isAMA = a.time.includes('AM') && hoursA === 12;
                                                const isAMB = b.time.includes('AM') && hoursB === 12;
                                                
                                                const hours24A = isPMA ? hoursA + 12 : (isAMA ? 0 : hoursA);
                                                const hours24B = isPMB ? hoursB + 12 : (isAMB ? 0 : hoursB);
                                                
                                                // Compare hours first, then minutes if hours are equal
                                                if (hours24A !== hours24B) {
                                                    return hours24A - hours24B;
                                                }
                                                return minutesA - minutesB;
                                            });
                                            
                                            // Reassign IDs to maintain sequential numbering after sorting
                                            experience.timeSlots.forEach((slot, index) => {
                                                slot.id = `${experience.id}-${index + 1}`;
                                            });
                                        }
                                    });
                                    
                                    resolve(experiences);
                                }
                            );
                        }
                    );
                }
            );
        });
    } catch (error) {
        logger.error('Error in getExperiencesByCustomObjectIds:', error);
        throw error;
    }
}

/**
 * Formats time from 24-hour format to AM/PM format
 * @param {string} time - Time in HH:MM format
 * @returns {string} - Formatted time string
 */
function formatTime(time) {
    if (!time) return '';
    
    // Parse the time - handle both colon and period separators
    let hours, minutes;
    if (time.includes(':')) {
        [hours, minutes] = time.split(':').map(Number);
    } else if (time.includes('.')) {
        [hours, minutes] = time.split('.').map(Number);
    } else {
        // If no separator is found, assume it's just hours
        hours = Number(time);
        minutes = 0;
    }
    
    // Ensure hours and minutes are valid numbers
    hours = isNaN(hours) ? 0 : hours;
    minutes = isNaN(minutes) ? 0 : minutes;
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    
    // Format the time
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

module.exports = {
    getContactDetails,
    saveConfirmedCourses,
    formatTime,
    getAvailableExperiences,
    saveSelectedExperiences,
    getConfirmedCourses,
    getSelectedExperiences,
    getExperiencesByCustomObjectIds
};