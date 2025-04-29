/**
 * Test script for the direct database keys implementation
 */
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');
const slotCalculationService = require('./slotCalculationService');
const utils = require('./slotCalculationUtils');

// Connect to the database
const db = new sqlite3.Database("fcfs.sqlite", (err) => {
    if (err) {
        console.error(`Error connecting to database: ${err.message}`);
        process.exit(1);
    }
    console.log('Connected to the database');
});

// Test cases
async function runTests() {
    try {
        console.log('\n=== Testing Direct Database Keys Implementation ===\n');
        
        // Test 1: Get all available slots
        console.log('Test 1: Get all available slots');
        const allSlots = await slotCalculationService.getAllAvailableSlots(db);
        
        // Count the number of direct keys vs. legacy keys
        const directKeys = Object.keys(allSlots).filter(key => key.includes(':'));
        const legacyKeys = Object.keys(allSlots).filter(key => key.includes('_'));
        
        console.log(`Total keys: ${Object.keys(allSlots).length}`);
        console.log(`Direct keys: ${directKeys.length}`);
        console.log(`Legacy keys: ${legacyKeys.length}`);
        
        // Print some examples of each key type
        if (directKeys.length > 0) {
            console.log('\nDirect key examples:');
            directKeys.slice(0, 5).forEach(key => {
                console.log(`  ${key}: ${allSlots[key]} available slots`);
            });
        }
        
        if (legacyKeys.length > 0) {
            console.log('\nLegacy key examples:');
            legacyKeys.slice(0, 5).forEach(key => {
                console.log(`  ${key}: ${allSlots[key]} available slots`);
            });
        }
        
        // Test 2: Check specific experience
        console.log('\nTest 2: Check specific experience');
        const experienceId = 'imdp-e-medicina-chirurgia-mani-2';
        
        // Check availability for each time slot using both key formats
        for (let i = 1; i <= 5; i++) {
            const timeSlotId = `${experienceId}-${i}`;
            const directKey = utils.createDirectKey(experienceId, i);
            const legacyKey = utils.formatSlotKey(experienceId, timeSlotId);
            
            console.log(`\nTime slot ${i}:`);
            console.log(`  Direct key: ${directKey}`);
            console.log(`  Legacy key: ${legacyKey}`);
            
            // Check if the keys exist in the results
            if (allSlots[directKey] !== undefined) {
                console.log(`  Direct key availability: ${allSlots[directKey]}`);
            } else {
                console.log(`  Direct key not found in results`);
            }
            
            if (allSlots[legacyKey] !== undefined) {
                console.log(`  Legacy key availability: ${allSlots[legacyKey]}`);
            } else {
                console.log(`  Legacy key not found in results`);
            }
            
            // Also check using the getAvailableSlots function
            const availableSlots = await slotCalculationService.getAvailableSlots(db, experienceId, timeSlotId);
            console.log(`  getAvailableSlots result: ${availableSlots}`);
        }
        
        // Test 3: Test utility functions
        console.log('\nTest 3: Test utility functions');
        
        // Test extractSlotNumber
        const testTimeSlotId = 'imdp-e-medicina-chirurgia-mani-2-3';
        const slotNumber = utils.extractSlotNumber(testTimeSlotId);
        console.log(`extractSlotNumber('${testTimeSlotId}'): ${slotNumber}`);
        
        // Test createDirectKey
        const testExperienceId = 'imdp-e-medicina-chirurgia-mani-2';
        const directKey = utils.createDirectKey(testExperienceId, slotNumber);
        console.log(`createDirectKey('${testExperienceId}', ${slotNumber}): ${directKey}`);
        
        // Test parseDirectKey
        const parsedKey = utils.parseDirectKey(directKey);
        console.log(`parseDirectKey('${directKey}'): `, parsedKey);
        
        console.log('\n=== Tests completed ===\n');
    } catch (error) {
        console.error('Error running tests:', error);
    } finally {
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error(`Error closing database: ${err.message}`);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

// Run the tests
runTests();