/**
 * Service per la gestione delle esperienze
 */
const logger = require('./logger');

// Definizione dei campi della tabella experiences
const EXPERIENCE_FIELDS = [
  'id', 
  'experience_id', 
  'title', 
  'course', 
  'location', 
  'date', 
  'duration', 
  'desc', 
  'language',
  'course_type', 
  'max_participants', 
  'current_participants', 
  'ora_inizio', 
  'ora_fine'
];

// Campi selezionabili per le query SELECT
const SELECT_FIELDS = EXPERIENCE_FIELDS.join(', ');

/**
 * Ottiene tutte le esperienze
 * @param {Object} db - Istanza del database
 * @param {string} language - Lingua (opzionale)
 * @param {string} orderBy - Campo per ordinamento (opzionale)
 * @returns {Promise<Array>} - Array di esperienze
 */
async function getAllExperiences(db, language = null, orderBy = 'title') {
  try {
    logger.info(`Recupero di tutte le esperienze${language ? ` per lingua: ${language}` : ''}`);
    
    let query = `SELECT ${SELECT_FIELDS} FROM experiences`;
    const params = [];
    
    if (language) {
      query += ' WHERE language = ?';
      params.push(language);
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          logger.error(`Errore nel recupero delle esperienze: ${err.message}`);
          reject(err);
        } else {
          logger.info(`Recuperate ${rows.length} esperienze`);
          resolve(rows);
        }
      });
    });
  } catch (error) {
    logger.error(`Errore in getAllExperiences: ${error.message}`);
    throw error;
  }
}

/**
 * Ottiene una singola esperienza per ID
 * @param {Object} db - Istanza del database
 * @param {number} id - ID dell'esperienza
 * @returns {Promise<Object>} - Oggetto esperienza
 */
async function getExperienceById(db, id) {
  try {
    logger.info(`Recupero esperienza con ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT ${SELECT_FIELDS} FROM experiences WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            logger.error(`Errore nel recupero dell'esperienza: ${err.message}`);
            reject(err);
          } else {
            if (!row) {
              logger.info(`Esperienza con ID ${id} non trovata`);
            } else {
              logger.info(`Esperienza con ID ${id} recuperata con successo`);
            }
            resolve(row);
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in getExperienceById: ${error.message}`);
    throw error;
  }
}

/**
 * Ottiene una singola esperienza per experience_id
 * @param {Object} db - Istanza del database
 * @param {string} experienceId - Experience ID
 * @param {string} language - Lingua (opzionale)
 * @returns {Promise<Object>} - Oggetto esperienza
 */
async function getExperienceByExperienceId(db, experienceId, language = null) {
  try {
    logger.info(`Recupero esperienza con experience_id: ${experienceId}${language ? ` e lingua: ${language}` : ''}`);
    
    let query = `SELECT ${SELECT_FIELDS} FROM experiences WHERE experience_id = ?`;
    const params = [experienceId];
    
    if (language) {
      query += ' AND language = ?';
      params.push(language);
    }
    
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          logger.error(`Errore nel recupero dell'esperienza: ${err.message}`);
          reject(err);
        } else {
          if (!row) {
            logger.info(`Esperienza con experience_id ${experienceId} non trovata`);
          } else {
            logger.info(`Esperienza con experience_id ${experienceId} recuperata con successo`);
          }
          resolve(row);
        }
      });
    });
  } catch (error) {
    logger.error(`Errore in getExperienceByExperienceId: ${error.message}`);
    throw error;
  }
}

/**
 * Crea una nuova esperienza
 * @param {Object} db - Istanza del database
 * @param {Object} experienceData - Dati dell'esperienza
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
async function createExperience(db, experienceData) {
  try {
    logger.info(`Creazione nuova esperienza: ${experienceData.title}`);
    
    // Verifica se l'experience_id esiste già per la lingua specificata
    const existingExperience = await getExperienceByExperienceId(db, experienceData.experience_id, experienceData.language);
    
    if (existingExperience) {
      logger.info(`Esperienza con experience_id ${experienceData.experience_id} e lingua ${experienceData.language} già esistente`);
      return { success: false, error: 'Esiste già un\'esperienza con questo ID per questa lingua' };
    }
    
    // Prepara i campi e i valori per l'inserimento
    const fields = Object.keys(experienceData).filter(key => EXPERIENCE_FIELDS.includes(key));
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => experienceData[field]);
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO experiences (${fields.join(', ')}) VALUES (${placeholders})`,
        values,
        function(err) {
          if (err) {
            logger.error(`Errore nella creazione dell'esperienza: ${err.message}`);
            reject(err);
          } else {
            logger.info(`Esperienza creata con successo, ID: ${this.lastID}`);
            resolve({ 
              success: true, 
              message: 'Esperienza creata con successo', 
              id: this.lastID 
            });
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in createExperience: ${error.message}`);
    throw error;
  }
}

/**
 * Aggiorna un'esperienza esistente
 * @param {Object} db - Istanza del database
 * @param {number} id - ID dell'esperienza
 * @param {Object} experienceData - Dati aggiornati dell'esperienza
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
async function updateExperience(db, id, experienceData) {
  try {
    logger.info(`Aggiornamento esperienza con ID: ${id}`);
    
    // Prepara i campi e i valori per l'aggiornamento
    const fields = Object.keys(experienceData).filter(key => EXPERIENCE_FIELDS.includes(key));
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => experienceData[field]);
    
    // Aggiungi l'ID alla fine dell'array dei valori
    values.push(id);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE experiences SET ${setClause} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            logger.error(`Errore nell'aggiornamento dell'esperienza: ${err.message}`);
            reject(err);
          } else {
            if (this.changes === 0) {
              logger.info(`Esperienza con ID ${id} non trovata per l'aggiornamento`);
              resolve({ success: false, error: 'Esperienza non trovata' });
            } else {
              logger.info(`Esperienza con ID ${id} aggiornata con successo`);
              resolve({ success: true, message: 'Esperienza aggiornata con successo' });
            }
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in updateExperience: ${error.message}`);
    throw error;
  }
}

/**
 * Elimina un'esperienza
 * @param {Object} db - Istanza del database
 * @param {number} id - ID dell'esperienza
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
async function deleteExperience(db, id) {
  try {
    logger.info(`Eliminazione esperienza con ID: ${id}`);
    
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM experiences WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            logger.error(`Errore nell'eliminazione dell'esperienza: ${err.message}`);
            reject(err);
          } else {
            if (this.changes === 0) {
              logger.info(`Esperienza con ID ${id} non trovata per l'eliminazione`);
              resolve({ success: false, error: 'Esperienza non trovata' });
            } else {
              logger.info(`Esperienza con ID ${id} eliminata con successo`);
              resolve({ success: true, message: 'Esperienza eliminata con successo' });
            }
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in deleteExperience: ${error.message}`);
    throw error;
  }
}

/**
 * Incrementa il contatore dei partecipanti per un'esperienza
 * @param {Object} db - Istanza del database
 * @param {string} experienceId - Experience ID
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
/**
 * Incrementa il contatore dei partecipanti per uno slot specifico usando l'ID dello slot
 * @param {Object} db - Istanza del database
 * @param {number} slotId - ID dello slot (campo id della tabella experiences)
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
async function incrementParticipantCount(db, slotId) {
  try {
    logger.info(`Incremento contatore per slot con ID: ${slotId}`);
    
    // Verifica che lo slot esista e abbia posti disponibili
    const slot = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, experience_id, current_participants, max_participants FROM experiences WHERE id = ?",
        [slotId],
        (err, row) => {
          if (err) {
            logger.error(`Errore nel recupero dello slot: ${err.message}`);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    if (!slot) {
      logger.warn(`Slot con ID ${slotId} non trovato`);
      return false;
    }
    
    // Verifica che ci siano ancora posti disponibili
    if (slot.current_participants >= slot.max_participants) {
      logger.warn(`Slot ${slotId} pieno: current=${slot.current_participants}, max=${slot.max_participants}`);
      return false;
    }
    
    // Incrementa il contatore per lo slot specifico
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = current_participants + 1 WHERE id = ?",
        [slotId],
        function(err) {
          if (err) {
            logger.error(`Errore nell'incremento del contatore: ${err.message}`);
            reject(err);
          } else {
            logger.info(`Contatore incrementato per slot ID ${slotId}, nuovo valore: ${slot.current_participants + 1}`);
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in incrementParticipantCount: ${error.message}`);
    throw error;
  }
}

/**
 * Decrementa il contatore dei partecipanti per un'esperienza
 * @param {Object} db - Istanza del database
 * @param {string} experienceId - Experience ID
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
/**
 * Decrementa il contatore dei partecipanti per uno slot specifico
 * @param {Object} db - Istanza del database
 * @param {number} slotId - ID dello slot (campo id della tabella experiences)
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
async function decrementParticipantCount(db, slotId) {
  try {
    logger.info(`Decremento contatore per slot con ID: ${slotId}`);
    
    // Verifica che lo slot esista
    const slot = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, experience_id, current_participants FROM experiences WHERE id = ?",
        [slotId],
        (err, row) => {
          if (err) {
            logger.error(`Errore nel recupero dello slot: ${err.message}`);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    if (!slot) {
      logger.warn(`Slot con ID ${slotId} non trovato`);
      return false;
    }
    
    // Decrementa il contatore per lo slot specifico
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = MAX(0, current_participants - 1) WHERE id = ?",
        [slotId],
        function(err) {
          if (err) {
            logger.error(`Errore nel decremento del contatore: ${err.message}`);
            reject(err);
          } else {
            logger.info(`Contatore decrementato per slot ID ${slotId}, nuovo valore: ${Math.max(0, slot.current_participants - 1)}`);
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in decrementParticipantCount: ${error.message}`);
    throw error;
  }
}

/**
 * Incrementa il contatore dei partecipanti per uno slot orario specifico
 * @param {Object} db - Istanza del database
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
/**
 * Incrementa il contatore dei partecipanti per uno slot specifico usando l'ID dello slot
 * @param {Object} db - Istanza del database
 * @param {number} slotId - ID dello slot (campo id della tabella experiences)
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
async function incrementParticipantCount(db, slotId) {
  try {
    logger.info(`Incremento contatore per slot con ID: ${slotId}`);
    
    // Verifica che lo slot esista e abbia posti disponibili
    const slot = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, experience_id, current_participants, max_participants FROM experiences WHERE id = ?",
        [slotId],
        (err, row) => {
          if (err) {
            logger.error(`Errore nel recupero dello slot: ${err.message}`);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    if (!slot) {
      logger.warn(`Slot con ID ${slotId} non trovato`);
      return false;
    }
    
    // Verifica che ci siano ancora posti disponibili
    if (slot.current_participants >= slot.max_participants) {
      logger.warn(`Slot ${slotId} pieno: current=${slot.current_participants}, max=${slot.max_participants}`);
      return false;
    }
    
    // Incrementa il contatore per lo slot specifico
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = current_participants + 1 WHERE id = ?",
        [slotId],
        function(err) {
          if (err) {
            logger.error(`Errore nell'incremento del contatore: ${err.message}`);
            reject(err);
          } else {
            logger.info(`Contatore incrementato per slot ID ${slotId}, nuovo valore: ${slot.current_participants + 1}`);
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in incrementParticipantCount: ${error.message}`);
    throw error;
  }
}

/**
 * Funzione legacy per incrementare il contatore dei partecipanti per uno slot temporale
 * Questa funzione è mantenuta per compatibilità con il codice esistente
 * @param {Object} db - Istanza del database
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
async function incrementParticipantCountForTimeSlot(db, experienceId, timeSlotId) {
  try {
    logger.info(`[LEGACY] Incremento contatore per experienceId: ${experienceId}, timeSlotId: ${timeSlotId}`);
    
    // Ottieni l'ID dello slot usando experience_id
    const slot = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, current_participants, max_participants FROM experiences WHERE experience_id = ?",
        [experienceId],
        (err, row) => {
          if (err) {
            logger.error(`Errore nel recupero dello slot: ${err.message}`);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    if (!slot) {
      logger.warn(`Nessuno slot trovato con experience_id ${experienceId}`);
      return false;
    }
    
    // Usa la nuova funzione con l'ID dello slot
    return incrementParticipantCount(db, slot.id);
  } catch (error) {
    logger.error(`Errore in incrementParticipantCountForTimeSlot: ${error.message}`);
    throw error;
  }
}

/**
 * Decrementa il contatore dei partecipanti per uno slot orario specifico
 * @param {Object} db - Istanza del database
 * @param {string|number} experienceId - Experience ID o dbId (ID numerico)
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<boolean>} - Successo dell'operazione
 */
async function decrementParticipantCountForTimeSlot(db, experienceId, timeSlotId) {
  try {
    logger.info(`[DEBUG] Decremento contatore per experienceId/dbId: ${experienceId}, timeSlotId: ${timeSlotId}`);
    
    // Verifica se experienceId è un numero (dbId)
    const isNumeric = !isNaN(Number(experienceId));
    
    if (isNumeric) {
      // Se experienceId è un numero (dbId), usa direttamente decrementParticipantCount
      logger.info(`[DEBUG] Usando direttamente il dbId: ${experienceId}`);
      return decrementParticipantCount(db, experienceId);
    }
    
    // Altrimenti, procedi con la logica esistente per l'experience_id testuale
    // Estrai il numero dello slot dal timeSlotId
    const parts = timeSlotId.split('-');
    const slotNumber = parseInt(parts[parts.length - 1]);
    logger.info(`[DEBUG] Numero slot estratto: ${slotNumber}, parts: ${JSON.stringify(parts)}`);
    
    // Ottieni tutte le esperienze con lo stesso titolo
    // Prima ottieni il titolo dell'esperienza corrente
    const currentExperience = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, title FROM experiences WHERE experience_id = ?",
        [experienceId],
        (err, row) => {
          if (err) {
            logger.error(`Errore nel recupero dell'esperienza: ${err.message}`);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    if (!currentExperience) {
      logger.warn(`Nessuna esperienza trovata con ID ${experienceId}`);
      return false;
    }
    
    logger.info(`[DEBUG] Esperienza corrente: id=${currentExperience.id}, title=${currentExperience.title}`);
    
    // Ora ottieni tutte le esperienze con lo stesso titolo, ordinate per ora_inizio
    const allExperiences = await new Promise((resolve, reject) => {
      db.all(
        "SELECT id, experience_id, title, ora_inizio FROM experiences WHERE title = ? ORDER BY ora_inizio",
        [currentExperience.title],
        (err, rows) => {
          if (err) {
            logger.error(`Errore nel recupero delle esperienze: ${err.message}`);
            reject(err);
          } else {
            logger.info(`[DEBUG] Trovate ${rows.length} esperienze con titolo "${currentExperience.title}"`);
            rows.forEach((row, index) => {
              logger.info(`[DEBUG] Riga ${index}: id=${row.id}, experience_id=${row.experience_id}, ora_inizio=${row.ora_inizio}`);
            });
            resolve(rows);
          }
        }
      );
    });
    
    if (allExperiences.length === 0) {
      logger.warn(`Nessuna esperienza trovata con titolo "${currentExperience.title}"`);
      return false;
    }
    
    // Ottieni l'ID della riga per lo slot orario specifico
    const rowIndex = (slotNumber > 0 && slotNumber <= allExperiences.length) ? (slotNumber - 1) : 0;
    const rowId = allExperiences[rowIndex].id;
    logger.info(`[DEBUG] Indice riga selezionato: ${rowIndex}, ID riga: ${rowId}, slotNumber: ${slotNumber}, allExperiences.length: ${allExperiences.length}`);
    
    // Decrementa il campo current_participants per questa riga specifica
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = MAX(0, current_participants - 1) WHERE id = ?",
        [rowId],
        function(err) {
          if (err) {
            logger.error(`Errore nel decremento del contatore: ${err.message}`);
            reject(err);
          } else {
            logger.info(`[DEBUG] Contatore decrementato per ID riga ${rowId}, changes: ${this.changes}`);
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in decrementParticipantCountForTimeSlot: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getAllExperiences,
  getExperienceById,
  getExperienceByExperienceId,
  createExperience,
  updateExperience,
  deleteExperience,
  incrementParticipantCount,
  decrementParticipantCount,
  incrementParticipantCountForTimeSlot,
  decrementParticipantCountForTimeSlot
};