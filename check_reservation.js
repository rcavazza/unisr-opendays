const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');

db.get("SELECT * FROM reservations WHERE user_id = ?", ['1001'], (err, row) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Reservation found:', row);
    }
    db.close();
});