/**
 * Script to check available slots for a specific experience ID
 * in both the database and what the frontend would see
 */
const sqlite3 = require('sqlite3').verbose();
const slotCalculationService = require('./slotCalculationService');
const axios = require('axios');

// Experience ID to check
const experienceId = 'imdp-e-medicina-chirurgia-mani-2';

// Connect to the database
const db = new sqlite3.Database("fcfs.sqlite", async (err) => {
    if (err) {
        console.error(`Error connecting to database: ${err.message}`);
        process.exit(1);
    }
    console.log('Connected to the database');
    
    try {
        // 1. Check max_participants in the database
        const maxParticipants = await new Promise((resolve, reject) => {
            db.get(
                "SELECT experience_id, max_participants FROM experiences WHERE experience_id = ?",
                [experienceId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (!row) {
                        // Try with base ID
                        const baseId = experienceId.replace(/-\d+$/, '');
                        db.get(
                            "SELECT experience_id, max_participants FROM experiences WHERE experience_id LIKE ?",
                            [`${baseId}%`],
                            (err, row) => {
                                if (err) {
                                    reject(err);
                                } else if (!row) {
                                    resolve({ experience_id: baseId, max_participants: 0 });
                                } else {
                                    resolve(row);
                                }
                            }
                        );
                    } else {
                        resolve(row);
                    }
                }
            );
        });
        
        console.log(`\nDatabase Information for ${experienceId}:`);
        console.log(`Max Participants: ${maxParticipants.max_participants}`);
        console.log(`Experience ID in DB: ${maxParticipants.experience_id}`);
        
        // 2. Check reservations in the database
        const baseExperienceId = experienceId.replace(/-\d+$/, '');
        
        // Check for reservations with the exact ID
        const exactReservations = await new Promise((resolve, reject) => {
            db.all(
                "SELECT * FROM opend_reservations WHERE experience_id = ?",
                [experienceId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        console.log(`\nReservations with exact ID (${experienceId}): ${exactReservations.length}`);
        exactReservations.forEach((res, i) => {
            console.log(`  ${i+1}. Time Slot: ${res.time_slot_id}, Contact: ${res.contact_id}`);
        });
        
        // Check for reservations with the base ID
        const baseReservations = await new Promise((resolve, reject) => {
            db.all(
                "SELECT * FROM opend_reservations WHERE experience_id = ?",
                [baseExperienceId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        console.log(`\nReservations with base ID (${baseExperienceId}): ${baseReservations.length}`);
        baseReservations.forEach((res, i) => {
            console.log(`  ${i+1}. Time Slot: ${res.time_slot_id}, Contact: ${res.contact_id}`);
        });
        
        // 3. Check available slots using the service
        console.log("\nAvailable Slots from slotCalculationService:");
        
        // For each time slot (assuming 5 time slots)
        for (let i = 1; i <= 5; i++) {
            const timeSlotId = `${experienceId}-${i}`;
            const availableSlots = await slotCalculationService.getAvailableSlots(db, experienceId, timeSlotId);
            console.log(`Time Slot ${i} (${timeSlotId}): ${availableSlots} available slots`);
        }
        
        // 4. Check what the frontend would see
        console.log("\nChecking what the frontend would see...");
        try {
            const response = await axios.get('http://localhost:3000/api/get_raw_slots');
            const slots = response.data;
            
            console.log("\nSlots visible to frontend:");
            
            // Check for keys that contain the experience ID
            const relevantKeys = Object.keys(slots).filter(key => 
                key.includes(experienceId) || key.includes(baseExperienceId)
            );
            
            if (relevantKeys.length === 0) {
                console.log(`No slots found for ${experienceId} or ${baseExperienceId}`);
            } else {
                relevantKeys.forEach(key => {
                    console.log(`  ${key}: ${slots[key]} available slots`);
                });
            }
        } catch (error) {
            console.error("Error fetching slots from API:", error.message);
            console.log("Make sure the server is running on port 3000");
        }
        
        // Close the database connection
        db.close(() => {
            console.log('\nDatabase connection closed');
        });
        
    } catch (error) {
        console.error("Error:", error);
        db.close();
    }
});