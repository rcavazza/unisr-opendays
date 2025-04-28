const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');

console.log('Checking reservations in the database...');

// Query the opend_reservations table
db.all("SELECT * FROM opend_reservations", (err, rows) => {
    if (err) {
        console.error('Error querying database:', err.message);
    } else {
        console.log('Reservations found:');
        console.log(JSON.stringify(rows, null, 2));
    }
    
    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
    });
});