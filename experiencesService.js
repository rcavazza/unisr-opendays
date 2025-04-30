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
async function incrementParticipantCount(db, experienceId) {
  try {
    logger.info(`Incremento contatore partecipanti per esperienza: ${experienceId}`);
    
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id = ?",
        [experienceId],
        function(err) {
          if (err) {
            logger.error(`Errore nell'incremento del contatore: ${err.message}`);
            reject(err);
          } else {
            if (this.changes === 0) {
              logger.info(`Esperienza con ID ${experienceId} non trovata per l'incremento del contatore`);
              resolve(false);
            } else {
              logger.info(`Contatore incrementato per esperienza ${experienceId}`);
              resolve(true);
            }
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
async function decrementParticipantCount(db, experienceId) {
  try {
    logger.info(`Decremento contatore partecipanti per esperienza: ${experienceId}`);
    
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = MAX(0, current_participants - 1) WHERE experience_id = ?",
        [experienceId],
        function(err) {
          if (err) {
            logger.error(`Errore nel decremento del contatore: ${err.message}`);
            reject(err);
          } else {
            if (this.changes === 0) {
              logger.info(`Esperienza con ID ${experienceId} non trovata per il decremento del contatore`);
              resolve(false);
            } else {
              logger.info(`Contatore decrementato per esperienza ${experienceId}`);
              resolve(true);
            }
          }
        }
      );
    });
  } catch (error) {
    logger.error(`Errore in decrementParticipantCount: ${error.message}`);
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
  decrementParticipantCount
};