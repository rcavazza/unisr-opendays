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
const reservationService = require('./reservationService');
const experiencesService = require('./experiencesService');

// Crea un'app Express
const app = express();
const PORT = 3002; // Porta diversa dal server principale

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
app.get('/', async (req, res) => {
  const language = req.query.lang || 'it'; // Default a italiano
  
  try {
    // Get all experiences for the selected language using the service
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

// API per ottenere una singola esperienza
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

// API per aggiornare un'esperienza
app.post('/api/experience/:id', async (req, res) => {
  const id = req.params.id;
  
  // Log the update for debugging
  console.log('Updating experience:', id);
  console.log('New max_participants:', req.body.max_participants);
  
  try {
    const result = await experiencesService.updateExperience(db, id, req.body);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    
    console.log('Experience updated successfully');
    res.json({ success: true, message: 'Esperienza aggiornata con successo' });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'esperienza:', error.message);
    logger.error('Errore nell\'aggiornamento dell\'esperienza:', error);
    return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'esperienza' });
  }
});

// API per creare una nuova esperienza
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

// API per eliminare un'esperienza
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

// API per ottenere i conteggi delle prenotazioni per un'esperienza
app.get('/api/reservation-counts/:experienceId', async (req, res) => {
  const experienceId = req.params.experienceId;
  
  try {
    // Get reservation counts for all time slots
    const reservationCounts = await reservationService.getReservationCounts(db);
    
    // Filter counts for the specified experience
    const filteredCounts = {};
    for (const [key, count] of Object.entries(reservationCounts)) {
      if (key.includes(experienceId)) {
        filteredCounts[key] = count;
      }
    }
    
    res.json(filteredCounts);
  } catch (error) {
    console.error('Errore nel recupero dei conteggi delle prenotazioni:', error.message);
    logger.error('Errore nel recupero dei conteggi delle prenotazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero dei conteggi delle prenotazioni' });
  }
});

// Debug endpoint to show all reservations in the database
app.get('/api/debug/reservations', (req, res) => {
  db.all(
    "SELECT * FROM opend_reservations ORDER BY experience_id, time_slot_id",
    [],
    (err, rows) => {
      if (err) {
        console.error('Errore nel recupero delle prenotazioni:', err.message);
        logger.error('Errore nel recupero delle prenotazioni:', err);
        return res.status(500).json({ error: 'Errore nel recupero delle prenotazioni' });
      }
      
      // Group reservations by experience_id and time_slot_id
      const groupedReservations = {};
      rows.forEach(row => {
        const key = `${row.experience_id}_${row.time_slot_id}`;
        if (!groupedReservations[key]) {
          groupedReservations[key] = [];
        }
        groupedReservations[key].push(row);
      });
      
      res.json({
        total: rows.length,
        raw: rows,
        grouped: groupedReservations,
        keys: Object.keys(groupedReservations)
      });
    }
  );
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
  logger.info(`Server avviato sulla porta ${PORT}`);
  console.log(`Apri http://localhost:${PORT} nel browser per gestire le esperienze`);
});