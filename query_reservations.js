const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// Query reservations
db.all("SELECT * FROM opend_reservations", (err, rows) => {
  if (err) {
    console.error(`Error querying database: ${err.message}`);
    process.exit(1);
  }
  
  console.log(`Found ${rows.length} reservations:`);
  rows.forEach((row, i) => {
    console.log(`Reservation ${i+1}:`, row);
  });
  
  // Close the database
  db.close((err) => {
    if (err) {
      console.error(`Error closing database: ${err.message}`);
    } else {
      console.log('Database connection closed');
    }
  });
});