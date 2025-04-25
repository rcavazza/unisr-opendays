#!/usr/bin/env node

/**
 * Script per popolare i campi ora_inizio e ora_fine nella tabella experiences
 * per le esperienze che hanno questi campi vuoti
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Aggiornamento dei campi ora_inizio e ora_fine nella tabella experiences...');
logger.info('Aggiornamento dei campi ora_inizio e ora_fine nella tabella experiences');

const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err.message);
    logger.error('Errore nella connessione al database:', err);
    process.exit(1);
  }
  console.log('Connesso al database');
  logger.info('Connesso al database');
});

// Ottieni tutte le esperienze con ora_inizio vuoto
db.all(
  `SELECT id, experience_id, title, duration
   FROM experiences
   WHERE ora_inizio = '' OR ora_inizio IS NULL`,
  (err, rows) => {
    if (err) {
      console.error('Errore nella query:', err.message);
      logger.error('Errore nella query:', err);
      closeDb();
      return;
    }
    
    console.log(`Trovate ${rows.length} esperienze da aggiornare`);
    logger.info(`Trovate ${rows.length} esperienze da aggiornare`);
    
    if (rows.length === 0) {
      console.log('Nessuna esperienza da aggiornare');
      logger.info('Nessuna esperienza da aggiornare');
      closeDb();
      return;
    }
    
    // Default start times for different experiences
    const defaultStartTimes = ['09:00', '11:00', '14:00', '16:00'];
    
    // Update each experience with default time values
    let updateCount = 0;
    rows.forEach((row, index) => {
      // Assign a default start time based on the index (cycling through the options)
      const startTime = defaultStartTimes[index % defaultStartTimes.length];
      
      // Calculate end time based on duration if available
      let endTime = '10:00'; // Default end time
      
      if (row.duration) {
        // Try to extract duration in minutes
        const durationMatch = row.duration.match(/(\d+)\s*(?:ore|ore|minuti|min)/i);
        if (durationMatch) {
          const durationValue = parseInt(durationMatch[1]);
          const isDurationInHours = row.duration.toLowerCase().includes('ore');
          
          // Convert to minutes
          const durationMinutes = isDurationInHours ? durationValue * 60 : durationValue;
          
          // Parse start time
          const [startHours, startMinutes] = startTime.split(':').map(Number);
          
          // Calculate end time
          let endHours = startHours;
          let endMinutes = startMinutes + durationMinutes;
          
          // Adjust for hour overflow
          if (endMinutes >= 60) {
            endHours += Math.floor(endMinutes / 60);
            endMinutes = endMinutes % 60;
          }
          
          // Format end time
          endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        }
      }
      
      console.log(`Aggiornamento esperienza ${row.id} (${row.title}): ora_inizio=${startTime}, ora_fine=${endTime}`);
      logger.info(`Aggiornamento esperienza ${row.id} (${row.title}): ora_inizio=${startTime}, ora_fine=${endTime}`);
      
      db.run(
        "UPDATE experiences SET ora_inizio = ?, ora_fine = ? WHERE id = ?", 
        [startTime, endTime, row.id], 
        (err) => {
          if (err) {
            console.error(`Errore nell'aggiornamento dei valori di tempo per l'esperienza ${row.id}:`, err.message);
            logger.error(`Errore nell'aggiornamento dei valori di tempo per l'esperienza ${row.id}:`, err);
          } else {
            updateCount++;
            console.log(`Aggiornati i valori di tempo per l'esperienza ${row.id}: ${startTime} - ${endTime}`);
            logger.info(`Aggiornati i valori di tempo per l'esperienza ${row.id}: ${startTime} - ${endTime}`);
            
            if (updateCount === rows.length) {
              console.log('Tutte le esperienze aggiornate con i valori di tempo');
              logger.info('Tutte le esperienze aggiornate con i valori di tempo');
              closeDb();
            }
          }
        }
      );
    });
  }
);

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Errore nella chiusura del database:', err.message);
      logger.error('Errore nella chiusura del database:', err);
    } else {
      console.log('Connessione al database chiusa');
      logger.info('Connessione al database chiusa');
    }
  });
}