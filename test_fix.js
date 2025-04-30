/**
 * Test script to verify the slot calculation fix
 */
const sqlite3 = require('sqlite3').verbose();
const slotCalculationService = require('./slotCalculationService');
const logger = require('./logger');

async function testFix() {
    console.log('Starting test for slot calculation fix...');
    const db = new sqlite3.Database('fcfs.sqlite', (err) => {
        if (err) {
            console.error(`Error opening database: ${err.message}`);
            process.exit(1);
        }
        console.log('Connected to the database');
    });
    
    try {
        // 1. Get the experience details for imdp-e-medicina-chirurgia-mani-2
        console.log('\nChecking experience details for imdp-e-medicina-chirurgia-mani-2...');
        const experience = await new Promise((resolve, reject) => {
            db.get(
                "SELECT experience_id, max_participants, current_participants FROM experiences WHERE experience_id = ?",
                ['imdp-e-medicina-chirurgia-mani-2'],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
        
        if (!experience) {
            console.log('Experience imdp-e-medicina-chirurgia-mani-2 not found in the database');
            return;
        }
        
        console.log(`Experience details: ${JSON.stringify(experience)}`);
        console.log(`Max participants: ${experience.max_participants}`);
        console.log(`Current participants: ${experience.current_participants}`);
        
        // 2. Get reservation counts for this experience (checking both key formats)
        console.log('\nChecking reservation counts...');
        
        // Check for reservations with the exact experience ID
        const exactReservations = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations WHERE experience_id = ? GROUP BY experience_id, time_slot_id",
                ['imdp-e-medicina-chirurgia-mani-2'],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        console.log(`Found ${exactReservations.length} reservation groups with exact experience ID`);
        exactReservations.forEach(res => {
            console.log(`  ${res.experience_id}_${res.time_slot_id}: ${res.count} reservations`);
        });
        
        // Check for reservations with the base experience ID
        const baseExperienceId = 'imdp-e-medicina-chirurgia-mani';
        const baseReservations = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations WHERE experience_id = ? GROUP BY experience_id, time_slot_id",
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
        
        console.log(`Found ${baseReservations.length} reservation groups with base experience ID`);
        baseReservations.forEach(res => {
            console.log(`  ${res.experience_id}_${res.time_slot_id}: ${res.count} reservations`);
        });
        
        // Combine both sets of reservations
        const reservations = [...exactReservations, ...baseReservations];
        
        // 3. Calculate expected available slots based on current_participants
        console.log('\nCalculating expected available slots based on current_participants...');
        const expectedAvailableSlots = {};
        for (let i = 1; i <= 5; i++) {
            const timeSlotId = `imdp-e-medicina-chirurgia-mani-2-${i}`;
            const available = Math.max(0, experience.max_participants - experience.current_participants);
            
            expectedAvailableSlots[`imdp-e-medicina-chirurgia-mani-2_${timeSlotId}`] = available;
            console.log(`  Expected available slots for ${timeSlotId}: ${available} (max: ${experience.max_participants}, current: ${experience.current_participants})`);
        }
        
        // 4. Get actual available slots using the fixed service
        console.log('\nGetting actual available slots with the fixed service...');
        const actualAvailableSlots = await slotCalculationService.getAllAvailableSlots(db);
        
        // 5. Compare expected vs actual for this experience
        console.log('\nComparing expected vs actual available slots for imdp-e-medicina-chirurgia-mani-2:');
        let allCorrect = true;
        
        // Compare expected vs actual for this experience
        for (let i = 1; i <= 5; i++) {
            const timeSlotId = `imdp-e-medicina-chirurgia-mani-2-${i}`;
            
            // Use the current_participants field for expected available slots
            const key = `imdp-e-medicina-chirurgia-mani-2_${timeSlotId}`;
            expectedAvailableSlots[key] = Math.max(0, experience.max_participants - experience.current_participants);
            
            // Compare with actual
            const actual = actualAvailableSlots[key];
            console.log(`  ${timeSlotId}: Expected=${expectedAvailableSlots[key]}, Actual=${actual}, ${expectedAvailableSlots[key] === actual ? 'CORRECT' : 'INCORRECT'}`);
            
            if (expectedAvailableSlots[key] !== actual) {
                allCorrect = false;
            }
        }
        
        // 6. Check frontend key format as well
        console.log('\nChecking frontend key format:');
        // Use the same baseExperienceId as defined earlier
        
        for (let i = 1; i <= 5; i++) {
            const frontendTimeSlotId = `${baseExperienceId}-${i}`;
            const frontendKey = `${baseExperienceId}_${frontendTimeSlotId}`;
            const actual = actualAvailableSlots[frontendKey];
            
            console.log(`  ${frontendKey}: Actual=${actual}`);
        }
        
        // 7. Final result
        if (allCorrect) {
            console.log('\n✅ TEST PASSED: All slot calculations are correct for imdp-e-medicina-chirurgia-mani-2');
        } else {
            console.log('\n❌ TEST FAILED: Some slot calculations are incorrect for imdp-e-medicina-chirurgia-mani-2');
        }
        
    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(`Error closing database: ${err.message}`);
            } else {
                console.log('\nDatabase connection closed');
            }
        });
    }
}

// Run the test
testFix();