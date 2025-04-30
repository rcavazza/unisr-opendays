/**
 * Simple script to remove the UNIQUE constraint from the experiences.experience_id field
 * in the SQLite database.
 * 
 * This script uses a very direct approach:
 * 1. Creates a backup of the database
 * 2. Renames the existing table to a temporary name
 * 3. Creates a new table with the same structure but without the constraint
 * 4. Copies all data from the temporary table
 * 5. Drops the temporary table
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Database file path
const DB_PATH = 'fcfs.sqlite';
const BACKUP_PATH = `fcfs.sqlite.backup.${new Date().toISOString().replace(/[:.]/g, '-')}`;

// Connect to the database
let db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(`Error connecting to database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to database: ${DB_PATH}`);
});

// Main function to execute the migration
async function removeUniqueConstraint() {
  console.log('Starting migration to remove UNIQUE constraint from experiences.experience_id...');
  
  try {
    // Create a backup of the database
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`Database backup created at: ${BACKUP_PATH}`);
    
    // Begin transaction
    await runQuery('BEGIN TRANSACTION');
    
    // Step 1: Rename the existing table to a temporary name
    await runQuery('ALTER TABLE experiences RENAME TO experiences_old');
    console.log('Renamed existing table to experiences_old');
    
    // Step 2: Create a new table with the same structure but without the UNIQUE constraint
    await runQuery(`
      CREATE TABLE experiences (
        id INTEGER PRIMARY KEY,
        experience_id TEXT,
        title TEXT,
        date TEXT,
        location TEXT,
        course_type TEXT,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        language TEXT DEFAULT 'it',
        desc TEXT,
        duration TEXT,
        course TEXT,
        ora_inizio TEXT,
        ora_fine TEXT
      )
    `);
    console.log('Created new table without the UNIQUE constraint');
    
    // Step 3: Copy all data from the old table to the new one
    await runQuery('INSERT INTO experiences SELECT * FROM experiences_old');
    console.log('Copied all data from old table to new table');
    
    // Step 4: Drop the old table
    await runQuery('DROP TABLE experiences_old');
    console.log('Dropped the old table');
    
    // Commit transaction
    await runQuery('COMMIT');
    console.log('Transaction committed successfully');
    
    console.log('Migration completed successfully!');
    console.log('The UNIQUE constraint on experiences.experience_id has been removed.');
  } catch (error) {
    // Rollback transaction on error
    try {
      await runQuery('ROLLBACK');
      console.error('Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError.message);
    }
    
    console.error('Error during migration:', error.message);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Helper function to run a query
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

// Run the migration
removeUniqueConstraint().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});