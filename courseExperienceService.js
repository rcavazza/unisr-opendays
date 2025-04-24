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
        
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT experience_id, title, course, location, desc, max_participants, current_participants, duration
                 FROM experiences
                 WHERE course_type IN (${placeholders}) AND language = ?`,
                [...customObjectIds, language],
                (err, rows) => {
                    if (err) {
                        logger.error(`Error retrieving experiences: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Retrieved ${rows.length} experiences`);
                        
                        // Transform the results into the desired format with timeSlots
                        const experiences = rows.map(row => {
                            // Create a basic experience object
                            const experience = {
                                id: row.experience_id,
                                title: row.title,
                                course: row.course || '',
                                location: row.location,
                                duration: row.duration,
                                desc: row.desc,
                                timeSlots: []
                            };
                            
                            // Add time slots (this would be retrieved from another table in a real implementation)
                            // For now, we'll add mock time slots
                            experience.timeSlots = [
                                {
                                    id: `${row.experience_id}-1`,
                                    time: '09:00 AM',
                                    available: Math.max(0, row.max_participants - row.current_participants)
                                },
                                {
                                    id: `${row.experience_id}-2`,
                                    time: '11:00 AM',
                                    available: Math.max(0, row.max_participants - row.current_participants - 2)
                                },
                                {
                                    id: `${row.experience_id}-3`,
                                    time: '02:00 PM',
                                    available: Math.max(0, row.max_participants - row.current_participants - 1)
                                }
                            ];
                            
                            return experience;
                        });
                        
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

module.exports = {
    getContactDetails,
    saveConfirmedCourses,
    getAvailableExperiences,
    saveSelectedExperiences,
    getConfirmedCourses,
    getSelectedExperiences,
    getExperiencesByCustomObjectIds
};