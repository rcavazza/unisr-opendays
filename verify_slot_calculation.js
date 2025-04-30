/**
 * Script to verify slot availability calculations
 * This script compares the expected available slots based on database values
 * with the actual available slots calculated by the slotCalculationService
 */

const sqlite3 = require('sqlite3').verbose();
const slotCalculationService = require('./slotCalculationService');
const logger = require('./logger');
const fs = require('fs');

// Create a write stream to log output to a file
const logFile = fs.createWriteStream('slot_verification_results.txt');

// Function to log to both console and file
function log(message) {
    console.log(message);
    logFile.write(message + '\n');
}

async function verifySlotCalculation() {
    log('Starting slot calculation verification...');
    const db = new sqlite3.Database('fcfs.sqlite', (err) => {
        if (err) {
            console.error(`Error opening database: ${err.message}`);
            process.exit(1);
        }
        log('Connected to the database');
    });
    
    try {
        // 1. Get experiences from database
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
        
        log(`Total experiences found: ${experiences.length}`);
        log('\nSample of experiences:');
        experiences.slice(0, 10).forEach(exp => {
            log(`  ${exp.experience_id}: max=${exp.max_participants}, current=${exp.current_participants}`);
        });
        
        // 2. Get reservation counts
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
        
        log(`\nTotal reservation groups found: ${reservationCounts.length}`);
        
        if (reservationCounts.length > 0) {
            log('\nSample of reservation counts:');
            reservationCounts.slice(0, 10).forEach(res => {
                log(`  ${res.experience_id}_${res.time_slot_id}: ${res.count}`);
            });
        } else {
            log('No reservations found in the database.');
        }
        
        // 3. Calculate expected available slots based on current_participants
        const expectedAvailableSlots = {};
        experiences.forEach(exp => {
            // Assume up to 5 time slots per experience
            for (let i = 1; i <= 5; i++) {
                const timeSlotId = `${exp.experience_id}-${i}`;
                const key = `${exp.experience_id}_${timeSlotId}`;
                
                // Calculate available slots based on current_participants
                expectedAvailableSlots[key] = Math.max(0, exp.max_participants - exp.current_participants);
                
                // Also calculate for frontend key format
                const baseExperienceId = exp.experience_id.replace(/-\d+$/, '');
                const frontendTimeSlotId = `${baseExperienceId}-${i}`;
                const frontendKey = `${baseExperienceId}_${frontendTimeSlotId}`;
                
                // Only add if it's different from the original key
                if (frontendKey !== key) {
                    expectedAvailableSlots[frontendKey] = Math.max(0, exp.max_participants - exp.current_participants);
                }
            }
        });
        
        // 4. Get actual available slots from slotCalculationService
        const actualAvailableSlots = await slotCalculationService.getAllAvailableSlots(db);
        
        // 5. Compare expected vs actual
        log('\nComparing expected vs actual available slots:');
        
        // Check for keys in expected that are missing in actual
        const missingKeys = Object.keys(expectedAvailableSlots).filter(key => actualAvailableSlots[key] === undefined);
        if (missingKeys.length > 0) {
            log(`\nKeys in expected but missing in actual: ${missingKeys.length}`);
            missingKeys.slice(0, 10).forEach(key => {
                log(`  ${key}: expected=${expectedAvailableSlots[key]}, actual=undefined`);
            });
        }
        
        // Check for keys in actual that are missing in expected
        const extraKeys = Object.keys(actualAvailableSlots).filter(key => expectedAvailableSlots[key] === undefined);
        if (extraKeys.length > 0) {
            log(`\nKeys in actual but missing in expected: ${extraKeys.length}`);
            extraKeys.slice(0, 10).forEach(key => {
                log(`  ${key}: expected=undefined, actual=${actualAvailableSlots[key]}`);
            });
        }
        
        // Check for value mismatches
        const mismatchKeys = Object.keys(expectedAvailableSlots)
            .filter(key => actualAvailableSlots[key] !== undefined && expectedAvailableSlots[key] !== actualAvailableSlots[key]);
        
        if (mismatchKeys.length > 0) {
            log(`\nValue mismatches found: ${mismatchKeys.length}`);
            mismatchKeys.forEach(key => {
                log(`  ${key}: expected=${expectedAvailableSlots[key]}, actual=${actualAvailableSlots[key]}`);
            });
        } else {
            log('\nNo value mismatches found for common keys!');
        }
        
        // 6. Check frontend key format specifically for the three activities mentioned
        log('\nChecking frontend key format for specific activities:');
        
        // First activity: Manichino con ascolto e visione del timpano
        const firstActivityBase = 'imdp-e-medicina-chirurgia-mani';
        log('\nFirst activity (Manichino con ascolto e visione del timpano):');
        for (let i = 1; i <= 4; i++) {
            const frontendKey = `${firstActivityBase}_${firstActivityBase}-${i}`;
            log(`  ${frontendKey}: ${actualAvailableSlots[frontendKey] !== undefined ? actualAvailableSlots[frontendKey] : 'undefined'}`);
        }
        
        // Second activity: Visita guidata ai Laboratori di Simulazione e ai Reparti della Dental Clinic San Raffaele
        const secondActivityBase = 'odontoiatria-visita-guidata-ai';
        log('\nSecond activity (Visita guidata ai Laboratori di Simulazione e ai Reparti della Dental Clinic San Raffaele):');
        for (let i = 1; i <= 1; i++) {
            const frontendKey = `${secondActivityBase}_${secondActivityBase}-${i}`;
            log(`  ${frontendKey}: ${actualAvailableSlots[frontendKey] !== undefined ? actualAvailableSlots[frontendKey] : 'undefined'}`);
        }
        
        // Third activity: Simulazione assistita del parto eutocico
        const thirdActivityBase = 'ostetricia-simulazione-assisti';
        log('\nThird activity (Simulazione assistita del parto eutocico):');
        for (let i = 1; i <= 3; i++) {
            const frontendKey = `${thirdActivityBase}_${thirdActivityBase}-${i}`;
            log(`  ${frontendKey}: ${actualAvailableSlots[frontendKey] !== undefined ? actualAvailableSlots[frontendKey] : 'undefined'}`);
        }
        
        log('\nVerification completed successfully.');
    } catch (error) {
        console.error('Error during verification:', error);
        logFile.write(`Error during verification: ${error}\n`);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(`Error closing database: ${err.message}`);
                logFile.write(`Error closing database: ${err.message}\n`);
            } else {
                log('Database connection closed');
            }
        });
        
        // Close the log file
        logFile.end();
    }
}

// Run the verification
verifySlotCalculation();