/**
 * Script to verify that the UNIQUE constraint on experiences.experience_id has been removed
 * 
 * This script:
 * 1. Checks the database schema to see if the UNIQUE constraint exists
 * 2. Attempts to insert two records with the same experience_id value
 * 3. Reports the results
 */

const sqlite3 = require('sqlite3').verbose();

// Database file path
const DB_PATH = 'fcfs.sqlite';

// Connect to the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(`Error connecting to database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to database: ${DB_PATH}`);
});

// Main verification function
async function verifyConstraintRemoval() {
  console.log('Verifying removal of UNIQUE constraint on experiences.experience_id...');
  
  try {
    // Step 1: Check the database schema
    console.log('\n=== Step 1: Checking database schema ===');
    const indexes = await getIndexes('experiences');
    
    // Look for UNIQUE constraint on experience_id
    const experienceIdUniqueConstraint = indexes.find(idx => 
      idx.origin === 'u' && 
      idx.columns.includes('experience_id') && 
      idx.columns.length === 1
    );
    
    if (experienceIdUniqueConstraint) {
      console.log('❌ UNIQUE constraint on experience_id still exists:');
      console.log(experienceIdUniqueConstraint);
    } else {
      console.log('✅ No UNIQUE constraint found on experience_id field');
    }
    
    // Step 2: Attempt to insert duplicate records
    console.log('\n=== Step 2: Testing duplicate inserts ===');
    
    // Generate a unique test ID to avoid conflicts with existing data
    const testId = `test-id-${Date.now()}`;
    
    // Insert first record
    await runQuery(
      "INSERT INTO experiences (experience_id, title, language) VALUES (?, ?, ?)",
      [testId, 'Test Record 1', 'en']
    );
    console.log(`✅ First record inserted with experience_id: ${testId}`);
    
    try {
      // Try to insert second record with same experience_id
      await runQuery(
        "INSERT INTO experiences (experience_id, title, language) VALUES (?, ?, ?)",
        [testId, 'Test Record 2', 'en']
      );
      console.log(`✅ Second record with same experience_id inserted successfully`);
      console.log('✅ This confirms the UNIQUE constraint has been removed!');
    } catch (error) {
      console.log(`❌ Failed to insert second record with same experience_id:`);
      console.log(`   ${error.message}`);
      console.log('❌ This suggests the UNIQUE constraint is still in place');
    }
    
    // Clean up test data
    console.log('\n=== Cleaning up test data ===');
    const result = await runQuery(
      "DELETE FROM experiences WHERE experience_id = ?",
      [testId]
    );
    console.log(`Removed ${result.changes} test records`);
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      } else {
        console.log('\nDatabase connection closed');
      }
    });
  }
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

// Run the verification
verifyConstraintRemoval().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});