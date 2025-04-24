#!/usr/bin/env node

/**
 * Script per la gestione delle esperienze
 * 
 * Questo script:
 * 1. Crea un'interfaccia web per visualizzare tutte le esperienze
 * 2. Permette di filtrare le esperienze per lingua
 * 3. Permette di modificare le esperienze esistenti
 * 4. Permette di aggiungere nuove esperienze
 * 5. Permette di eliminare esperienze
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const logger = require('./logger');
const path = require('path');

// Crea un'app Express
const app = express();
const PORT = 3001; // Porta diversa dal server principale

// Configura middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connessione al database
const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err.message);
    logger.error('Errore nella connessione al database:', err);
    process.exit(1);
  }
  console.log('Connesso al database SQLite');
  logger.info('Connesso al database SQLite');
});

// Rotta principale - Visualizza tutte le esperienze
app.get('/', (req, res) => {
  const language = req.query.lang || 'it'; // Default a italiano
  
  db.all(
    `SELECT id, experience_id, title, course, location, date, duration, desc, language,
     course_type, max_participants, current_participants, ora_inizio, ora_fine
     FROM experiences
     WHERE language = ?
     ORDER BY title`,
    [language],
    (err, experiences) => {
      if (err) {
        console.error('Errore nel recupero delle esperienze:', err.message);
        logger.error('Errore nel recupero delle esperienze:', err);
        return res.status(500).send('Errore nel recupero delle esperienze');
      }
      
      res.render('manageExperiences', { 
        experiences, 
        language,
        message: req.query.message,
        error: req.query.error
      });
    }
  );
});

// API per ottenere una singola esperienza
app.get('/api/experience/:id', (req, res) => {
  const id = req.params.id;
  
  db.get(
    `SELECT id, experience_id, title, course, location, date, duration, desc, language,
     course_type, max_participants, current_participants, ora_inizio, ora_fine
     FROM experiences
     WHERE id = ?`,
    [id],
    (err, experience) => {
      if (err) {
        console.error('Errore nel recupero dell\'esperienza:', err.message);
        logger.error('Errore nel recupero dell\'esperienza:', err);
        return res.status(500).json({ error: 'Errore nel recupero dell\'esperienza' });
      }
      
      if (!experience) {
        return res.status(404).json({ error: 'Esperienza non trovata' });
      }
      
      res.json(experience);
    }
  );
});

// API per aggiornare un'esperienza
app.post('/api/experience/:id', (req, res) => {
  const id = req.params.id;
  const {
    title, course, location, date, duration, desc, language,
    course_type, max_participants, current_participants, ora_inizio, ora_fine
  } = req.body;
  
  db.run(
    `UPDATE experiences SET
     title = ?, course = ?, location = ?, date = ?, duration = ?, desc = ?,
     language = ?, course_type = ?, max_participants = ?, current_participants = ?,
     ora_inizio = ?, ora_fine = ?
     WHERE id = ?`,
    [title, course, location, date, duration, desc, language, course_type,
     max_participants, current_participants, ora_inizio, ora_fine, id],
    function(err) {
      if (err) {
        console.error('Errore nell\'aggiornamento dell\'esperienza:', err.message);
        logger.error('Errore nell\'aggiornamento dell\'esperienza:', err);
        return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'esperienza' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Esperienza non trovata' });
      }
      
      res.json({ success: true, message: 'Esperienza aggiornata con successo' });
    }
  );
});

// API per creare una nuova esperienza
app.post('/api/experience', (req, res) => {
  const {
    experience_id, title, course, location, date, duration, desc, language,
    course_type, max_participants, current_participants, ora_inizio, ora_fine
  } = req.body;
  
  // Verifica se l'experience_id esiste già per la lingua specificata
  db.get(
    'SELECT id FROM experiences WHERE experience_id = ? AND language = ?',
    [experience_id, language],
    (err, row) => {
      if (err) {
        console.error('Errore nella verifica dell\'esperienza:', err.message);
        logger.error('Errore nella verifica dell\'esperienza:', err);
        return res.status(500).json({ error: 'Errore nella verifica dell\'esperienza' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Esiste già un\'esperienza con questo ID per questa lingua' });
      }
      
      // Inserisci la nuova esperienza
      db.run(
        `INSERT INTO experiences
         (experience_id, title, course, location, date, duration, desc, language,
          course_type, max_participants, current_participants, ora_inizio, ora_fine)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [experience_id, title, course, location, date, duration, desc, language,
         course_type, max_participants || 0, current_participants || 0, ora_inizio, ora_fine],
        function(err) {
          if (err) {
            console.error('Errore nella creazione dell\'esperienza:', err.message);
            logger.error('Errore nella creazione dell\'esperienza:', err);
            return res.status(500).json({ error: 'Errore nella creazione dell\'esperienza' });
          }
          
          res.json({ 
            success: true, 
            message: 'Esperienza creata con successo', 
            id: this.lastID 
          });
        }
      );
    }
  );
});

// API per eliminare un'esperienza
app.delete('/api/experience/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM experiences WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Errore nell\'eliminazione dell\'esperienza:', err.message);
      logger.error('Errore nell\'eliminazione dell\'esperienza:', err);
      return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'esperienza' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Esperienza non trovata' });
    }
    
    res.json({ success: true, message: 'Esperienza eliminata con successo' });
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
  logger.info(`Server avviato sulla porta ${PORT}`);
  console.log(`Apri http://localhost:${PORT} nel browser per gestire le esperienze`);
});