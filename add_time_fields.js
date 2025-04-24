#!/usr/bin/env node

/**
 * Script to add 'ora_inizio' and 'ora_fine' columns to the experiences table
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Starting to add time fields to experiences table...');
logger.info('Starting to add time fields to experiences table');

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

    // Check if the columns already exist
    db.all("PRAGMA table_info(experiences)", (err, rows) => {
      if (err) {
        console.error('Error getting table info:', err.message);
        logger.error('Error getting table info:', err);
        closeDb();
        return;
      }

      const columns = rows || [];
      const hasOraInizio = columns.some(col => col.name === 'ora_inizio');
      const hasOraFine = columns.some(col => col.name === 'ora_fine');

      let alterTablePromises = [];

      if (!hasOraInizio) {
        alterTablePromises.push(
          new Promise((resolve, reject) => {
            db.run("ALTER TABLE experiences ADD COLUMN ora_inizio TEXT", (err) => {
              if (err) {
                console.error('Error adding ora_inizio column:', err.message);
                logger.error('Error adding ora_inizio column:', err);
                reject(err);
              } else {
                console.log('Added ora_inizio column to experiences table');
                logger.info('Added ora_inizio column to experiences table');
                resolve();
              }
            });
          })
        );
      } else {
        console.log('ora_inizio column already exists');
        logger.info('ora_inizio column already exists');
      }

      if (!hasOraFine) {
        alterTablePromises.push(
          new Promise((resolve, reject) => {
            db.run("ALTER TABLE experiences ADD COLUMN ora_fine TEXT", (err) => {
              if (err) {
                console.error('Error adding ora_fine column:', err.message);
                logger.error('Error adding ora_fine column:', err);
                reject(err);
              } else {
                console.log('Added ora_fine column to experiences table');
                logger.info('Added ora_fine column to experiences table');
                resolve();
              }
            });
          })
        );
      } else {
        console.log('ora_fine column already exists');
        logger.info('ora_fine column already exists');
      }

      Promise.all(alterTablePromises)
        .then(() => {
          console.log('All modifications completed successfully');
          logger.info('All modifications completed successfully');
          
          // Update existing records with default time values
          updateTimeValues();
        })
        .catch((err) => {
          console.error('Error during table modifications:', err);
          logger.error('Error during table modifications:', err);
          closeDb();
        });
    });
  });
});

function updateTimeValues() {
  // Get all experiences
  db.all("SELECT id, duration FROM experiences", (err, rows) => {
    if (err) {
      console.error('Error getting experiences:', err.message);
      logger.error('Error getting experiences:', err);
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
        const durationMatch = row.duration.match(/(\d+)\s*min/i);
        if (durationMatch) {
          const durationMinutes = parseInt(durationMatch[1]);
          
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
      
      db.run("UPDATE experiences SET ora_inizio = ?, ora_fine = ? WHERE id = ?", 
        [startTime, endTime, row.id], 
        (err) => {
          if (err) {
            console.error(`Error updating time values for experience ${row.id}:`, err.message);
            logger.error(`Error updating time values for experience ${row.id}:`, err);
          } else {
            updateCount++;
            console.log(`Updated time values for experience ${row.id}: ${startTime} - ${endTime}`);
            
            if (updateCount === rows.length) {
              console.log('All experiences updated with time values');
              logger.info('All experiences updated with time values');
              closeDb();
            }
          }
        }
      );
    });
    
    if (rows.length === 0) {
      console.log('No experiences found to update');
      logger.info('No experiences found to update');
      closeDb();
    }
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