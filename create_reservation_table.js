const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');
const logger = require('./logger');

console.log('Creating opend_reservations table...');
logger.info('Creating opend_reservations table');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS opend_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        experience_id TEXT NOT NULL,
        time_slot_id TEXT NOT NULL,
        qr_code_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating opend_reservations table:', err.message);
            logger.error('Error creating opend_reservations table:', err);
        } else {
            console.log('opend_reservations table created successfully');
            logger.info('opend_reservations table created successfully');
        }
    });
});

setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            logger.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
            logger.info('Database connection closed');
        }
    });
}, 1000);