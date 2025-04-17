const sqlite3 = require('sqlite3').verbose();

// Open database connection
const db = new sqlite3.Database('fcfs.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database');
});

// Delete all registrations
db.run('DELETE FROM reservation', (err) => {
    if (err) {
        console.error('Error clearing registrations:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('All registrations cleared successfully');
    
    // Close database connection
    db.close(() => {
        console.log('Database connection closed');
    });
});
