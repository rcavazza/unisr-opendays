# Implementazione di experiencesService.js

Di seguito è riportato il codice completo per il file `experiencesService.js` che fornisce un'interfaccia 1:1 con la tabella experiences nel database.

```javascript
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
              logger.warn(`Esperienza con ID ${id} non trovata`);
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
            logger.warn(`Esperienza con experience_id ${experienceId} non trovata`);
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
      logger.warn(`Esperienza con experience_id ${experienceData.experience_id} e lingua ${experienceData.language} già esistente`);
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
              logger.warn(`Esperienza con ID ${id} non trovata per l'aggiornamento`);
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
              logger.warn(`Esperienza con ID ${id} non trovata per l'eliminazione`);
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
              logger.warn(`Esperienza con ID ${experienceId} non trovata per l'incremento del contatore`);
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
              logger.warn(`Esperienza con ID ${experienceId} non trovata per il decremento del contatore`);
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
```

## Istruzioni per l'Implementazione

1. Passa alla modalità Code utilizzando il pulsante di cambio modalità
2. Crea un nuovo file chiamato `experiencesService.js` nella directory principale del progetto
3. Copia e incolla il codice sopra nel nuovo file
4. Salva il file

## Aggiornamento di manage_experiences.js

Dopo aver creato il file `experiencesService.js`, dovrai aggiornare `manage_experiences.js` per utilizzare il nuovo servizio. Ecco come modificare le rotte principali:

### 1. Importa il servizio

All'inizio del file, dopo gli altri require, aggiungi:

```javascript
const experiencesService = require('./experiencesService');
```

### 2. Aggiorna la rotta principale (GET /)

```javascript
app.get('/', async (req, res) => {
  const language = req.query.lang || 'it'; // Default a italiano
  
  try {
    // Get all experiences for the selected language
    const experiences = await experiencesService.getAllExperiences(db, language);
    
    // Get reservation counts for all time slots
    const reservationCounts = await reservationService.getReservationCounts(db);
    
    // Log all reservation counts for debugging
    console.log("All reservation counts:", JSON.stringify(reservationCounts));
    
    // Calculate remaining spots for each experience
    const experiencesWithRemainingSpots = experiences.map(exp => {
      // Extract the base experience ID
      const baseExperienceId = exp.experience_id.replace(/-\d+$/, '');
      
      // Try different key formats to find a match
      let reservationCount = 0;
      let matchedKey = null;
      
      // First try the exact key format
      const exactKey = `${baseExperienceId}_${exp.experience_id}`;
      if (reservationCounts[exactKey]) {
        reservationCount = reservationCounts[exactKey];
        matchedKey = exactKey;
      } else {
        // Try all possible keys with this base ID
        for (const [key, count] of Object.entries(reservationCounts)) {
          if (key.startsWith(`${baseExperienceId}_`)) {
            reservationCount = count;
            matchedKey = key;
            break;
          }
        }
      }
      
      console.log(`Experience: ${exp.experience_id}, Matched Key: ${matchedKey}, Count: ${reservationCount}`);
      
      // Calculate remaining spots
      const remainingSpots = Math.max(0, exp.max_participants - reservationCount);
      
      return {
        ...exp,
        reservationCount,
        remainingSpots
      };
    });
    
    res.render('manageExperiences', {
      experiences: experiencesWithRemainingSpots,
      language,
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    console.error('Errore nel recupero delle esperienze:', error.message);
    logger.error('Errore nel recupero delle esperienze:', error);
    return res.status(500).send('Errore nel recupero delle esperienze');
  }
});
```

### 3. Aggiorna la rotta GET /api/experience/:id

```javascript
app.get('/api/experience/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const experience = await experiencesService.getExperienceById(db, id);
    
    if (!experience) {
      return res.status(404).json({ error: 'Esperienza non trovata' });
    }
    
    res.json(experience);
  } catch (error) {
    console.error('Errore nel recupero dell\'esperienza:', error.message);
    logger.error('Errore nel recupero dell\'esperienza:', error);
    return res.status(500).json({ error: 'Errore nel recupero dell\'esperienza' });
  }
});
```

### 4. Aggiorna la rotta POST /api/experience/:id

```javascript
app.post('/api/experience/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await experiencesService.updateExperience(db, id, req.body);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({ success: true, message: 'Esperienza aggiornata con successo' });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'esperienza:', error.message);
    logger.error('Errore nell\'aggiornamento dell\'esperienza:', error);
    return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'esperienza' });
  }
});
```

### 5. Aggiorna la rotta POST /api/experience

```javascript
app.post('/api/experience', async (req, res) => {
  try {
    const result = await experiencesService.createExperience(db, req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ 
      success: true, 
      message: 'Esperienza creata con successo', 
      id: result.id 
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'esperienza:', error.message);
    logger.error('Errore nella creazione dell\'esperienza:', error);
    return res.status(500).json({ error: 'Errore nella creazione dell\'esperienza' });
  }
});
```

### 6. Aggiorna la rotta DELETE /api/experience/:id

```javascript
app.delete('/api/experience/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await experiencesService.deleteExperience(db, id);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({ success: true, message: 'Esperienza eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'esperienza:', error.message);
    logger.error('Errore nell\'eliminazione dell\'esperienza:', error);
    return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'esperienza' });
  }
});
```

Queste modifiche trasformeranno `manage_experiences.js` per utilizzare il nuovo servizio `experiencesService.js`, creando un'interfaccia 1:1 con la tabella experiences nel database.