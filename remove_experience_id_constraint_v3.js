/**
 * Script to remove the UNIQUE constraint from the experiences.experience_id field
 * in the SQLite database (Version 3).
 * 
 * This script uses a more direct approach to remove the UNIQUE constraint by:
 * 1. Creating a backup of the database
 * 2. Getting the complete CREATE TABLE statement for the experiences table
 * 3. Modifying the statement to remove the UNIQUE constraint on experience_id
 * 4. Creating a temporary table without the constraint
 * 5. Copying all data from the original table
 * 6. Dropping the original table
 * 7. Creating a new table with the same name but without the constraint
 * 8. Copying data from the temporary table
 * 9. Dropping the temporary table
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

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
    await createBackup();
    console.log(`Database backup created at: ${BACKUP_PATH}`);
    
    // Begin transaction
    await runQuery('BEGIN TRANSACTION');
    
    // Get the complete CREATE TABLE statement for the experiences table
    const createTableSQL = await getTableCreateSQL('experiences');
    console.log('Retrieved original CREATE TABLE statement');
    console.log(createTableSQL);
    
    // Modify the CREATE TABLE statement to remove the UNIQUE constraint on experience_id
    let modifiedCreateTableSQL = createTableSQL
      // Remove UNIQUE constraint if it's defined inline with the column
      .replace(/experience_id\s+\w+\s+UNIQUE/i, 'experience_id TEXT')
      // Remove UNIQUE constraint if it's defined as a table constraint
      .replace(/,\s*UNIQUE\s*\(\s*experience_id\s*\)/i, '');
    
    console.log('Modified CREATE TABLE statement to remove UNIQUE constraint');
    console.log(modifiedCreateTableSQL);
    
    // Create a temporary table without the UNIQUE constraint
    const tempTableSQL = modifiedCreateTableSQL.replace('CREATE TABLE experiences', 'CREATE TABLE experiences_temp');
    await runQuery('DROP TABLE IF EXISTS experiences_temp');
    await runQuery(tempTableSQL);
    console.log('Created temporary table without the UNIQUE constraint');
    
    // Copy all data from the original table to the temporary table
    const columns = await getColumnNames('experiences');
    const columnList = columns.join(', ');
    await runQuery(`INSERT INTO experiences_temp SELECT ${columnList} FROM experiences`);
    console.log('Copied all data to the temporary table');
    
    // Drop the original table
    await runQuery('DROP TABLE experiences');
    console.log('Dropped the original table');
    
    // Create a new table with the same name but without the constraint
    const newTableSQL = modifiedCreateTableSQL;
    await runQuery(newTableSQL);
    console.log('Created new table without the UNIQUE constraint');
    
    // Copy data from the temporary table to the new table
    await runQuery(`INSERT INTO experiences SELECT ${columnList} FROM experiences_temp`);
    console.log('Copied all data from temporary table to the new table');
    
    // Drop the temporary table
    await runQuery('DROP TABLE experiences_temp');
    console.log('Dropped the temporary table');
    
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

// Helper function to create a database backup
function createBackup() {
  return new Promise((resolve, reject) => {
    // Close the database connection temporarily to ensure a clean backup
    db.close((err) => {
      if (err) {
        console.error(`Error closing database for backup: ${err.message}`);
        reject(err);
        return;
      }
      
      // Copy the database file
      try {
        fs.copyFileSync(DB_PATH, BACKUP_PATH);
        console.log(`Database backup created: ${BACKUP_PATH}`);
        
        // Reopen the database connection
        db = new sqlite3.Database(DB_PATH, (err) => {
          if (err) {
            console.error(`Error reopening database after backup: ${err.message}`);
            reject(err);
          } else {
            console.log('Database connection reopened after backup');
            resolve();
          }
        });
      } catch (error) {
        console.error(`Error creating database backup: ${error.message}`);
        
        // Reopen the database connection even if backup failed
        db = new sqlite3.Database(DB_PATH, (err) => {
          if (err) {
            console.error(`Error reopening database after failed backup: ${err.message}`);
            reject(err);
          } else {
            console.log('Database connection reopened after failed backup attempt');
            reject(error);
          }
        });
      }
    });
  });
}

// Helper function to get the complete CREATE TABLE statement for a table
function getTableCreateSQL(tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        reject(new Error(`Table ${tableName} not found`));
      } else {
        resolve(row.sql);
      }
    });
  });
}

// Helper function to get column names
function getColumnNames(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => row.name));
      }
    });
  });
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