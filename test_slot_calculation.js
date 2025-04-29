/**
 * Test script to diagnose slot availability calculation issues
 */
const sqlite3 = require('sqlite3').verbose();
const slotCalculationService = require('./slotCalculationService');
const logger = require('./logger');

async function testSlotCalculation() {
    console.log('Starting slot calculation test...');
    const db = new sqlite3.Database('fcfs.sqlite', (err) => {
        if (err) {
            console.error(`Error opening database: ${err.message}`);
            process.exit(1);
        }
        console.log('Connected to the database');
    });
    
    try {
        // Get all available slots
        console.log('\n1. Testing slotCalculationService.getAllAvailableSlots()...');
        const availableSlots = await slotCalculationService.getAllAvailableSlots(db);
        console.log(`Total slots found: ${Object.keys(availableSlots).length}`);
        
        // Count how many slots have 0 available
        const zeroSlots = Object.entries(availableSlots).filter(([key, value]) => value === 0);
        console.log(`Slots with 0 available: ${zeroSlots.length} out of ${Object.keys(availableSlots).length}`);
        
        // Print some examples of zero slots
        if (zeroSlots.length > 0) {
            console.log('Examples of slots with 0 available:');
            zeroSlots.slice(0, 5).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        }
        
        // Print some examples of non-zero slots
        const nonZeroSlots = Object.entries(availableSlots).filter(([key, value]) => value > 0);
        if (nonZeroSlots.length > 0) {
            console.log('\nExamples of slots with non-zero available:');
            nonZeroSlots.slice(0, 5).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        } else {
            console.log('\nNo slots with non-zero availability found!');
        }
        
        // Get all experiences
        console.log('\n2. Checking experiences in the database...');
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, max_participants, current_participants FROM experiences",
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        console.log(`Total experiences found: ${experiences.length}`);
        
        // Check for experiences with max_participants = 0
        const zeroMaxParticipants = experiences.filter(exp => exp.max_participants === 0);
        console.log(`Experiences with max_participants = 0: ${zeroMaxParticipants.length}`);
        
        console.log('\nSample of experiences:');
        experiences.slice(0, 10).forEach(exp => {
            console.log(`  ${exp.experience_id}: max=${exp.max_participants}, current=${exp.current_participants}`);
        });
        
        // Get reservation counts
        console.log('\n3. Checking reservation counts...');
        const reservationCounts = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations GROUP BY experience_id, time_slot_id",
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        console.log(`Total reservation groups found: ${reservationCounts.length}`);
        
        if (reservationCounts.length > 0) {
            console.log('\nSample of reservation counts:');
            reservationCounts.slice(0, 10).forEach(res => {
                console.log(`  ${res.experience_id}_${res.time_slot_id}: ${res.count}`);
            });
        } else {
            console.log('No reservations found in the database.');
        }
        
        // Test different key formats
        console.log('\n4. Testing different key formats...');
        for (const exp of experiences.slice(0, 5)) {
            const baseExperienceId = exp.experience_id.replace(/-\d+$/, '');
            for (let i = 1; i <= 3; i++) {
                const timeSlotId = `${exp.experience_id}-${i}`;
                
                // Format 1: experienceId_timeSlotId (used in slotCalculationService.js)
                const key1 = `${exp.experience_id}_${timeSlotId}`;
                
                // Format 2: baseExperienceId_timeSlotId (potential format in courseExperienceService.js)
                const key2 = `${baseExperienceId}_${timeSlotId}`;
                
                console.log(`\nExperience: ${exp.experience_id}, TimeSlot: ${timeSlotId}`);
                console.log(`  Format 1: ${key1} = ${availableSlots[key1] !== undefined ? availableSlots[key1] : 'undefined'}`);
                console.log(`  Format 2: ${key2} = ${availableSlots[key2] !== undefined ? availableSlots[key2] : 'undefined'}`);
            }
        }
        
        // Test a specific getAvailableSlots call
        console.log('\n5. Testing specific getAvailableSlots calls...');
        if (experiences.length > 0) {
            const testExp = experiences[0];
            const testTimeSlotId = `${testExp.experience_id}-1`;
            
            console.log(`Testing getAvailableSlots for experience ${testExp.experience_id}, timeSlot ${testTimeSlotId}`);
            const availableSlot = await slotCalculationService.getAvailableSlots(db, testExp.experience_id, testTimeSlotId);
            console.log(`Result: ${availableSlot} available slots`);
            
            // Get the max participants for this experience
            const maxParticipants = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT max_participants FROM experiences WHERE experience_id = ?",
                    [testExp.experience_id],
                    (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row ? row.max_participants : 0);
                        }
                    }
                );
            });
            
            // Get the reservation count for this experience and time slot
            const reservationCount = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT COUNT(*) as count FROM opend_reservations WHERE experience_id = ? AND time_slot_id = ?",
                    [testExp.experience_id, testTimeSlotId],
                    (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row ? row.count : 0);
                        }
                    }
                );
            });
            
            console.log(`Max participants: ${maxParticipants}`);
            console.log(`Reservation count: ${reservationCount}`);
            console.log(`Expected available slots: ${Math.max(0, maxParticipants - reservationCount)}`);
        }
        
        console.log('\nTest completed successfully.');
    } catch (error) {
        console.error('Error testing slot calculation:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(`Error closing database: ${err.message}`);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

// Run the test
testSlotCalculation();