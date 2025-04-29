/**
 * Script to check the formats of experience_id and time_slot_id in the opend_reservations table
 */

const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database("fcfs.sqlite", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
    console.log("Connected to the database");
});

// Query to get all reservations
db.all("SELECT * FROM opend_reservations LIMIT 10", (err, rows) => {
    if (err) {
        console.error("Error querying reservations:", err.message);
        db.close();
        process.exit(1);
    }

    console.log("=== RESERVATIONS IN DATABASE ===");
    console.log(`Found ${rows.length} reservations`);
    
    if (rows.length > 0) {
        console.log("Sample reservation:");
        console.log(rows[0]);
        
        // Log all reservations
        rows.forEach((row, index) => {
            console.log(`\nReservation ${index + 1}:`);
            console.log(`- contact_id: ${row.contact_id}`);
            console.log(`- experience_id: ${row.experience_id}`);
            console.log(`- time_slot_id: ${row.time_slot_id}`);
            
            // Create the key as we do in the code
            const key = `${row.experience_id}_${row.time_slot_id}`;
            console.log(`- Key format in code would be: ${key}`);
        });
    } else {
        console.log("No reservations found");
    }
    
    // Now query the experiences table to see the format of experience_id
    db.all("SELECT experience_id FROM experiences LIMIT 10", (err, expRows) => {
        if (err) {
            console.error("Error querying experiences:", err.message);
            db.close();
            process.exit(1);
        }
        
        console.log("\n=== EXPERIENCE IDs IN DATABASE ===");
        console.log(`Found ${expRows.length} experiences`);
        
        if (expRows.length > 0) {
            expRows.forEach((row, index) => {
                console.log(`Experience ${index + 1}: ${row.experience_id}`);
            });
        } else {
            console.log("No experiences found");
        }
        
        // Close the database connection
        db.close();
    });
});