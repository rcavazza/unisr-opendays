#!/usr/bin/env node

/**
 * Script per verificare i valori dei campi ora_inizio e ora_fine nella tabella experiences
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Verifica dei campi ora_inizio e ora_fine nella tabella experiences...');
logger.info('Verifica dei campi ora_inizio e ora_fine nella tabella experiences');

const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err.message);
    logger.error('Errore nella connessione al database:', err);
    process.exit(1);
  }
  console.log('Connesso al database');
  logger.info('Connesso al database');
});

db.all(
  `SELECT id, experience_id, title, ora_inizio, ora_fine, language, course_type
   FROM experiences
   ORDER BY id`,
  (err, rows) => {
    if (err) {
      console.error('Errore nella query:', err.message);
      logger.error('Errore nella query:', err);
      closeDb();
      return;
    }
    
    console.log(`Trovate ${rows.length} esperienze nel database`);
    logger.info(`Trovate ${rows.length} esperienze nel database`);
    
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Experience ID: ${row.experience_id}, Title: ${row.title}, Language: ${row.language}, Course Type: ${row.course_type}`);
      console.log(`  ora_inizio: "${row.ora_inizio}", tipo: ${typeof row.ora_inizio}, lunghezza: ${row.ora_inizio ? row.ora_inizio.length : 0}`);
      console.log(`  ora_fine: "${row.ora_fine}", tipo: ${typeof row.ora_fine}, lunghezza: ${row.ora_fine ? row.ora_fine.length : 0}`);
      console.log('---');
      
      logger.info(`ID: ${row.id}, Experience ID: ${row.experience_id}, Title: ${row.title}, Language: ${row.language}, Course Type: ${row.course_type}`);
      logger.info(`  ora_inizio: "${row.ora_inizio}", tipo: ${typeof row.ora_inizio}, lunghezza: ${row.ora_inizio ? row.ora_inizio.length : 0}`);
      logger.info(`  ora_fine: "${row.ora_fine}", tipo: ${typeof row.ora_fine}, lunghezza: ${row.ora_fine ? row.ora_fine.length : 0}`);
    });
    
    // Verifica anche la query utilizzata in getExperiencesByCustomObjectIds
    console.log('\nVerifica della query utilizzata in getExperiencesByCustomObjectIds:');
    logger.info('Verifica della query utilizzata in getExperiencesByCustomObjectIds');
    
    // Simula la query con un course_type di esempio
    const courseTypes = [...new Set(rows.map(row => row.course_type))].filter(Boolean);
    
    if (courseTypes.length > 0) {
      const placeholders = courseTypes.map(() => '?').join(',');
      const language = 'it'; // Esempio con lingua italiana
      
      db.all(
        `SELECT experience_id, title, course, location, desc, max_participants, current_participants, duration, ora_inizio, ora_fine
         FROM experiences
         WHERE course_type IN (${placeholders}) AND language = ?`,
        [...courseTypes, language],
        (err, queryRows) => {
          if (err) {
            console.error('Errore nella query di simulazione:', err.message);
            logger.error('Errore nella query di simulazione:', err);
            closeDb();
            return;
          }
          
          console.log(`La query ha restituito ${queryRows.length} righe`);
          logger.info(`La query ha restituito ${queryRows.length} righe`);
          
          queryRows.forEach((row, index) => {
            console.log(`Riga ${index}: ${JSON.stringify(row)}`);
            console.log(`Riga ${index} ora_inizio: ${row.ora_inizio}, tipo: ${typeof row.ora_inizio}`);
            console.log(`Riga ${index} ora_fine: ${row.ora_fine}, tipo: ${typeof row.ora_fine}`);
            
            logger.info(`Riga ${index}: ${JSON.stringify(row)}`);
            logger.info(`Riga ${index} ora_inizio: ${row.ora_inizio}, tipo: ${typeof row.ora_inizio}`);
            logger.info(`Riga ${index} ora_fine: ${row.ora_fine}, tipo: ${typeof row.ora_fine}`);
          });
          
          closeDb();
        }
      );
    } else {
      console.log('Nessun course_type trovato per simulare la query');
      logger.info('Nessun course_type trovato per simulare la query');
      closeDb();
    }
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