#!/usr/bin/env node

/**
 * Script to add the 'course' column to the experiences table
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Starting to add course column to experiences table...');
logger.info('Starting to add course column to experiences table');

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

    // Check if the course column already exists
    db.all("PRAGMA table_info(experiences)", (err, rows) => {
      if (err) {
        console.error('Error getting table info:', err.message);
        logger.error('Error getting table info:', err);
        closeDb();
        return;
      }

      const columns = rows || [];
      const hasCourse = columns.some(col => col.name === 'course');

      if (!hasCourse) {
        db.run("ALTER TABLE experiences ADD COLUMN course TEXT", (err) => {
          if (err) {
            console.error('Error adding course column:', err.message);
            logger.error('Error adding course column:', err);
            closeDb();
          } else {
            console.log('Added course column to experiences table');
            logger.info('Added course column to experiences table');
            
            // Update existing records with course values based on course_type
            updateCourseValues();
          }
        });
      } else {
        console.log('Course column already exists');
        logger.info('Course column already exists');
        closeDb();
      }
    });
  });
});

function updateCourseValues() {
  // Get all experiences
  db.all("SELECT id, course_type FROM experiences", (err, rows) => {
    if (err) {
      console.error('Error getting experiences:', err.message);
      logger.error('Error getting experiences:', err);
      closeDb();
      return;
    }

    // Define default course names for each course_type
    const courseTypeMap = {
      'course1': 'Medical Diagnostics',
      'course2': 'Basic Surgery',
      'course3': 'Emergency Medicine'
    };

    // Update each experience with a default course name based on its course_type
    let updateCount = 0;
    rows.forEach(row => {
      const defaultCourse = courseTypeMap[row.course_type] || 'General Medicine';
      
      db.run("UPDATE experiences SET course = ? WHERE id = ?", [defaultCourse, row.id], (err) => {
        if (err) {
          console.error(`Error updating course for experience ${row.id}:`, err.message);
          logger.error(`Error updating course for experience ${row.id}:`, err);
        } else {
          updateCount++;
          console.log(`Updated course for experience ${row.id}`);
          
          if (updateCount === rows.length) {
            console.log('All experiences updated with course values');
            logger.info('All experiences updated with course values');
            closeDb();
          }
        }
      });
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