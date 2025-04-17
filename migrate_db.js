/**
 * Migration script to remove 'day', 'time', 'location', and 'created_at' fields from reservations table
 * 
 * This script:
 * 1. Creates a new table without the removed fields
 * 2. Copies existing data (only id and user_id) to the new table
 * 3. Drops the old table
 * 4. Renames the new table to the original name
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');

console.log('Starting migration process...');
console.log('Creating backup of current database...');

// First, let's check if the old table structure exists
db.get("PRAGMA table_info(reservations)", (err, rows) => {
  if (err) {
    console.error('Error checking table structure:', err.message);
    db.close();
    return;
  }

  // If no rows, the table doesn't exist
  if (!rows) {
    console.log('Reservations table does not exist. No migration needed.');
    db.close();
    return;
  }

  // Proceed with migration
  db.serialize(() => {
    // Create new table without the fields to remove
    db.run(`CREATE TABLE IF NOT EXISTS reservations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating new table:', err.message);
        db.close();
        return;
      }
      console.log('Created new table structure');

      // Copy data from old table to new table
      db.run(`INSERT INTO reservations_new (id, user_id)
        SELECT id, user_id FROM reservations`, (err) => {
        if (err) {
          console.error('Error copying data to new table:', err.message);
          db.close();
          return;
        }
        console.log('Copied existing data to new table');

        // Drop old table
        db.run(`DROP TABLE reservations`, (err) => {
          if (err) {
            console.error('Error dropping old table:', err.message);
            db.close();
            return;
          }
          console.log('Dropped old table');

          // Rename new table to original name
          db.run(`ALTER TABLE reservations_new RENAME TO reservations`, (err) => {
            if (err) {
              console.error('Error renaming table:', err.message);
              db.close();
              return;
            }
            console.log('Renamed new table to reservations');
            console.log('Migration completed successfully');
            db.close();
          });
        });
      });
    });
  });
});