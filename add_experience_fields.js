#!/usr/bin/env node

/**
 * Script to modify the experiences table to add language and description fields
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Starting to modify experiences table...');
logger.info('Starting to modify experiences table');

const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    logger.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to the database');
});

db.serialize(() => {
  // Check if the experiences table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='experiences'", (err, row) => {
    if (err) {
      console.error('Error checking if table exists:', err.message);
      logger.error('Error checking if table exists:', err);
      closeDb();
      return;
    }

    if (!row) {
      console.log('Experiences table does not exist. Please run create_course_experience_tables.js first.');
      logger.warn('Experiences table does not exist');
      closeDb();
      return;
    }

    // Check if the language column already exists
    db.all("PRAGMA table_info(experiences)", (err, rows) => {
      if (err) {
        console.error('Error getting table info:', err.message);
        logger.error('Error getting table info:', err);
        closeDb();
        return;
      }

      const columns = rows || [];
      const hasLanguage = columns.some(col => col.name === 'language');
      const hasDesc = columns.some(col => col.name === 'desc');
      const hasDuration = columns.some(col => col.name === 'duration');

      let alterTablePromises = [];

      if (!hasLanguage) {
        alterTablePromises.push(
          new Promise((resolve, reject) => {
            db.run("ALTER TABLE experiences ADD COLUMN language TEXT DEFAULT 'it'", (err) => {
              if (err) {
                console.error('Error adding language column:', err.message);
                logger.error('Error adding language column:', err);
                reject(err);
              } else {
                console.log('Added language column to experiences table');
                logger.info('Added language column to experiences table');
                resolve();
              }
            });
          })
        );
      } else {
        console.log('Language column already exists');
        logger.info('Language column already exists');
      }

      if (!hasDesc) {
        alterTablePromises.push(
          new Promise((resolve, reject) => {
            db.run("ALTER TABLE experiences ADD COLUMN desc TEXT", (err) => {
              if (err) {
                console.error('Error adding desc column:', err.message);
                logger.error('Error adding desc column:', err);
                reject(err);
              } else {
                console.log('Added desc column to experiences table');
                logger.info('Added desc column to experiences table');
                resolve();
              }
            });
          })
        );
      } else {
        console.log('Desc column already exists');
        logger.info('Desc column already exists');
      }

      if (!hasDuration) {
        alterTablePromises.push(
          new Promise((resolve, reject) => {
            db.run("ALTER TABLE experiences ADD COLUMN duration TEXT", (err) => {
              if (err) {
                console.error('Error adding duration column:', err.message);
                logger.error('Error adding duration column:', err);
                reject(err);
              } else {
                console.log('Added duration column to experiences table');
                logger.info('Added duration column to experiences table');
                resolve();
              }
            });
          })
        );
      } else {
        console.log('Duration column already exists');
        logger.info('Duration column already exists');
      }

      Promise.all(alterTablePromises)
        .then(() => {
          console.log('All modifications completed successfully');
          logger.info('All modifications completed successfully');
          
          // Add sample data in both languages
          addSampleData();
        })
        .catch((err) => {
          console.error('Error during table modifications:', err);
          logger.error('Error during table modifications:', err);
          closeDb();
        });
    });
  });
});

function addSampleData() {
  // First, check if we already have sample data
  db.get("SELECT COUNT(*) as count FROM experiences WHERE language = 'en' OR language = 'it'", (err, row) => {
    if (err) {
      console.error('Error checking for existing sample data:', err.message);
      logger.error('Error checking for existing sample data:', err);
      closeDb();
      return;
    }

    if (row && row.count > 0) {
      console.log(`Found ${row.count} existing multilingual experiences. Skipping sample data insertion.`);
      logger.info(`Found ${row.count} existing multilingual experiences. Skipping sample data insertion.`);
      closeDb();
      return;
    }

    console.log('Adding sample data in English and Italian...');
    logger.info('Adding sample data in English and Italian');

    // Sample data based on the current example in server.js
    const sampleData = [
      // English experiences
      {
        experience_id: 'exp1',
        title: 'Mannequin with listening and viewing of the eardrum',
        course: 'Medical Diagnostics',
        location: 'Medical Lab A',
        duration: '45 minutes',
        desc: 'Practice diagnostic techniques on a medical mannequin',
        language: 'en',
        max_participants: 15,
        current_participants: 5,
        course_type: 'course1'
      },
      {
        experience_id: 'exp2',
        title: 'Minor surgery, suturing',
        course: 'Basic Surgery',
        location: 'Surgical Lab B',
        duration: '60 minutes',
        desc: 'Learn basic suturing techniques on practice materials',
        language: 'en',
        max_participants: 12,
        current_participants: 0,
        course_type: 'course1'
      },
      {
        experience_id: 'exp3',
        title: 'Airway obstruction maneuver with mannequin',
        course: 'Emergency Medicine',
        location: 'Emergency Lab C',
        duration: '30 minutes',
        desc: 'Practice emergency airway management techniques',
        language: 'en',
        max_participants: 20,
        current_participants: 1,
        course_type: 'course2'
      },
      {
        experience_id: 'exp4',
        title: 'Semiotics',
        course: 'Medical Diagnostics',
        location: 'Room 101',
        duration: '45 minutes',
        desc: 'Learn to interpret signs and symptoms in medical diagnosis',
        language: 'en',
        max_participants: 10,
        current_participants: 0,
        course_type: 'course2'
      },
      {
        experience_id: 'exp5',
        title: 'DNA Extraction',
        course: 'Laboratory Medicine',
        location: 'Lab D',
        duration: '90 minutes',
        desc: 'Hands-on experience with DNA extraction techniques',
        language: 'en',
        max_participants: 8,
        current_participants: 0,
        course_type: 'course3'
      },
      
      // Italian experiences
      {
        experience_id: 'exp1',
        title: 'Manichino con ascolto e visione del timpano',
        course: 'Diagnostica Medica',
        location: 'Laboratorio Medico A',
        duration: '45 minuti',
        desc: 'Pratica tecniche diagnostiche su un manichino medico',
        language: 'it',
        max_participants: 15,
        current_participants: 5,
        course_type: 'course1'
      },
      {
        experience_id: 'exp2',
        title: 'Piccola chirurgia, sutura',
        course: 'Chirurgia di Base',
        location: 'Laboratorio Chirurgico B',
        duration: '60 minuti',
        desc: 'Impara le tecniche di sutura di base su materiali di pratica',
        language: 'it',
        max_participants: 12,
        current_participants: 0,
        course_type: 'course1'
      },
      {
        experience_id: 'exp3',
        title: 'Manovra di disostruzione delle vie aeree con manichino',
        course: 'Medicina d\'Emergenza',
        location: 'Laboratorio di Emergenza C',
        duration: '30 minuti',
        desc: 'Pratica tecniche di gestione delle vie aeree in emergenza',
        language: 'it',
        max_participants: 20,
        current_participants: 1,
        course_type: 'course2'
      },
      {
        experience_id: 'exp4',
        title: 'Semiotica',
        course: 'Diagnostica Medica',
        location: 'Stanza 101',
        duration: '45 minuti',
        desc: 'Impara a interpretare segni e sintomi nella diagnosi medica',
        language: 'it',
        max_participants: 10,
        current_participants: 0,
        course_type: 'course2'
      },
      {
        experience_id: 'exp5',
        title: 'Estrazione DNA',
        course: 'Medicina di Laboratorio',
        location: 'Laboratorio D',
        duration: '90 minuti',
        desc: 'Esperienza pratica con tecniche di estrazione del DNA',
        language: 'it',
        max_participants: 8,
        current_participants: 0,
        course_type: 'course3'
      }
    ];

    // Insert sample data
    const stmt = db.prepare(`
      INSERT INTO experiences 
      (experience_id, title, course, location, duration, desc, language, max_participants, current_participants, course_type, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    let insertCount = 0;
    sampleData.forEach((exp) => {
      stmt.run(
        exp.experience_id,
        exp.title,
        exp.course,
        exp.location,
        exp.duration,
        exp.desc,
        exp.language,
        exp.max_participants,
        exp.current_participants,
        exp.course_type,
        (err) => {
          if (err) {
            console.error(`Error inserting sample data for ${exp.title}:`, err.message);
            logger.error(`Error inserting sample data for ${exp.title}:`, err);
          } else {
            insertCount++;
            console.log(`Inserted sample data for ${exp.title} (${exp.language})`);
            logger.info(`Inserted sample data for ${exp.title} (${exp.language})`);
            
            if (insertCount === sampleData.length) {
              console.log('All sample data inserted successfully');
              logger.info('All sample data inserted successfully');
              closeDb();
            }
          }
        }
      );
    });

    stmt.finalize();
  });
}

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
      logger.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
      logger.info('Database connection closed');
    }
  });
}