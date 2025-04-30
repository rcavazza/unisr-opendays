# Plan to Remove UNIQUE Constraint from experiences.experience_id

## Background
The `experiences` table in the SQLite database currently has a UNIQUE constraint on the `experience_id` field. This constraint needs to be removed to allow duplicate values in this field.

## Implementation Approach
SQLite doesn't support directly dropping constraints with an ALTER TABLE statement. Instead, we need to:

1. Create a new table with the same structure but without the UNIQUE constraint
2. Copy all data from the old table to the new one
3. Drop the old table
4. Rename the new table to the original name

## Implementation Script

```javascript
/**
 * Script to remove the UNIQUE constraint from the experiences.experience_id field
 * in the SQLite database.
 *
 * This script:
 * 1. Creates a backup of the database
 * 2. Creates a new table without the constraint
 * 3. Copies all data from the old table
 * 4. Drops the old table
 * 5. Renames the new table to the original name
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// Database file path
const DB_PATH = 'fcfs.sqlite';
const BACKUP_PATH = `fcfs.sqlite.backup.${new Date().toISOString().replace(/[:.]/g, '-')}`;

// Connect to the database
const db = new sqlite3.Database(DB_PATH, (err) => {
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
    
    // 1. Get the table schema to recreate it without the constraint
    const tableInfo = await getTableInfo('experiences');
    console.log(`Retrieved table structure with ${tableInfo.length} columns`);
    
    // 2. Create a new table without the UNIQUE constraint
    await createNewTable(tableInfo);
    console.log('Created new table without the UNIQUE constraint');
    
    // 3. Copy all data from the old table to the new one
    await copyData();
    console.log('Copied all data to the new table');
    
    // 4. Drop the old table
    await runQuery('DROP TABLE experiences');
    console.log('Dropped the original table');
    
    // 5. Rename the new table to the original name
    await runQuery('ALTER TABLE experiences_new RENAME TO experiences');
    console.log('Renamed the new table to experiences');
    
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

// Helper function to get table structure
function getTableInfo(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to create the new table without the UNIQUE constraint
async function createNewTable(tableInfo) {
  // Build the CREATE TABLE statement
  let createTableSQL = 'CREATE TABLE experiences_new (\n';
  
  // Add each column definition
  const columnDefs = tableInfo.map(column => {
    let def = `  ${column.name} ${column.type}`;
    
    // Add NOT NULL constraint if applicable
    if (column.notnull === 1) {
      def += ' NOT NULL';
    }
    
    // Add PRIMARY KEY constraint if applicable
    if (column.pk === 1) {
      def += ' PRIMARY KEY';
    }
    
    // Add DEFAULT value if applicable
    if (column.dflt_value !== null) {
      def += ` DEFAULT ${column.dflt_value}`;
    }
    
    return def;
  });
  
  createTableSQL += columnDefs.join(',\n');
  
  // Add any other constraints (except the UNIQUE constraint on experience_id)
  // We'll need to get the existing indexes
  const indexes = await getIndexes('experiences');
  
  // Add constraints from indexes, excluding the one for experience_id
  const constraints = indexes
    .filter(idx => 
      // Skip the index for the UNIQUE constraint on experience_id
      !(idx.origin === 'u' && idx.name.includes('experience_id'))
    )
    .map(idx => {
      if (idx.origin === 'pk') {
        return `  PRIMARY KEY (${idx.columns.join(', ')})`;
      } else if (idx.origin === 'u') {
        return `  UNIQUE (${idx.columns.join(', ')})`;
      }
      return null;
    })
    .filter(constraint => constraint !== null);
  
  if (constraints.length > 0) {
    createTableSQL += ',\n' + constraints.join(',\n');
  }
  
  createTableSQL += '\n)';
  
  // Execute the CREATE TABLE statement
  await runQuery(createTableSQL);
}

// Helper function to get indexes for a table
function getIndexes(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA index_list(${tableName})`, async (err, indexes) => {
      if (err) {
        reject(err);
      } else {
        try {
          // For each index, get the columns it applies to
          const indexDetails = await Promise.all(
            indexes.map(async (idx) => {
              const columns = await new Promise((resolve, reject) => {
                db.all(`PRAGMA index_info(${idx.name})`, (err, cols) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(cols.map(col => col.name));
                  }
                });
              });
              
              return {
                name: idx.name,
                origin: idx.origin, // 'pk' for primary key, 'u' for unique
                columns
              };
            })
          );
          
          resolve(indexDetails);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

// Helper function to copy data from the old table to the new one
async function copyData() {
  // Get column names
  const columns = await getColumnNames('experiences');
  const columnList = columns.join(', ');
  
  // Copy all data
  return runQuery(`INSERT INTO experiences_new SELECT ${columnList} FROM experiences`);
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
```

## Execution Instructions

1. Save this script as `remove_experience_id_constraint.js` in the project root directory
2. Make sure the server is stopped before running this script
3. Run the script with Node.js:
   ```
   node remove_experience_id_constraint.js
   ```
4. After successful execution, restart the server

The script will automatically create a timestamped backup of the database before making any changes.

## Verification

After running the script, you can verify that the UNIQUE constraint has been removed by:

1. Checking the database schema:
   ```javascript
   const sqlite3 = require('sqlite3').verbose();
   const db = new sqlite3.Database('fcfs.sqlite');
   db.all("PRAGMA index_list(experiences)", (err, rows) => {
     console.log(rows);
     db.close();
   });
   ```

2. Attempting to insert two records with the same experience_id value:
   ```javascript
   const sqlite3 = require('sqlite3').verbose();
   const db = new sqlite3.Database('fcfs.sqlite');
   
   // Insert first record
   db.run("INSERT INTO experiences (experience_id, title) VALUES ('test-id', 'Test 1')", function(err) {
     if (err) {
       console.error('Error inserting first record:', err.message);
     } else {
       console.log('First record inserted successfully');
       
       // Try to insert second record with same experience_id
       db.run("INSERT INTO experiences (experience_id, title) VALUES ('test-id', 'Test 2')", function(err) {
         if (err) {
           console.error('Error inserting second record:', err.message);
         } else {
           console.log('Second record inserted successfully - constraint removed!');
         }
         
         db.close();
       });
     }
   });
   ```

## Rollback Plan

If there are any issues after running this script, you can restore from the database backup that was automatically created:

```bash
# Replace with the actual timestamped backup filename
cp fcfs.sqlite.backup.2025-04-30T16-11-06-000Z fcfs.sqlite
```

You can also manually create additional backups if needed:

```bash
cp fcfs.sqlite fcfs.sqlite.manual.backup
```