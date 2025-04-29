/**
 * Script to clear all records from the opend_reservations table
 */
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

// Connect to the database
const db = new sqlite3.Database("fcfs.sqlite", (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the database');
});

// Function to clear the opend_reservations table
async function clearReservations() {
    return new Promise((resolve, reject) => {
        console.log('Clearing all records from opend_reservations table...');
        
        db.run("DELETE FROM opend_reservations", function(err) {
            if (err) {
                console.error('Error clearing reservations:', err.message);
                reject(err);
            } else {
                console.log(`Successfully deleted ${this.changes} reservation records`);
                resolve(this.changes);
            }
        });
    });
}

// Main function
async function main() {
    try {
        // Clear the reservations
        const deletedCount = await clearReservations();
        
        // Log the result
        if (deletedCount > 0) {
            console.log(`Successfully cleared ${deletedCount} reservations from the database`);
        } else {
            console.log('No reservations found to clear');
        }
    } catch (error) {
        console.error('Error in main function:', error);
    } finally {
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

// Run the main function
main();