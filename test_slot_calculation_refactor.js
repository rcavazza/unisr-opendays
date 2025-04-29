/**
 * Test script for the refactored slot calculation service
 */
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');
const slotCalculationService = require('./slotCalculationService');

// Connect to the database
const db = new sqlite3.Database("fcfs.sqlite", (err) => {
    if (err) {
        console.error(`Error connecting to database: ${err.message}`);
        process.exit(1);
    }
    console.log('Connected to the database');
});

// Test cases
const testCases = [
    {
        name: 'Test getAvailableSlots with standard ID',
        fn: async () => {
            const experienceId = 'imdp-e-medicina-chirurgia-mani';
            const timeSlotId = 'imdp-e-medicina-chirurgia-mani-1';
            const slots = await slotCalculationService.getAvailableSlots(db, experienceId, timeSlotId);
            console.log(`Available slots for ${experienceId}, ${timeSlotId}: ${slots}`);
            return slots !== undefined;
        }
    },
    {
        name: 'Test getAvailableSlots with numbered ID',
        fn: async () => {
            const experienceId = 'imdp-e-medicina-chirurgia-mani-2';
            const timeSlotId = 'imdp-e-medicina-chirurgia-mani-2-1';
            const slots = await slotCalculationService.getAvailableSlots(db, experienceId, timeSlotId);
            console.log(`Available slots for ${experienceId}, ${timeSlotId}: ${slots}`);
            return slots !== undefined;
        }
    },
    {
        name: 'Test isSlotAvailable',
        fn: async () => {
            const experienceId = 'imdp-e-medicina-chirurgia-mani';
            const timeSlotId = 'imdp-e-medicina-chirurgia-mani-1';
            const isAvailable = await slotCalculationService.isSlotAvailable(db, experienceId, timeSlotId);
            console.log(`Is slot available for ${experienceId}, ${timeSlotId}: ${isAvailable}`);
            return true; // Just checking if it runs without errors
        }
    },
    {
        name: 'Test getAllAvailableSlots',
        fn: async () => {
            const allSlots = await slotCalculationService.getAllAvailableSlots(db);
            console.log(`Total keys in allSlots: ${Object.keys(allSlots).length}`);
            
            // Check a few keys to make sure they exist
            const testKeys = [
                'imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-1',
                'imdp-e-medicina-chirurgia-mani-2_imdp-e-medicina-chirurgia-mani-2-1'
            ];
            
            for (const key of testKeys) {
                if (allSlots[key] !== undefined) {
                    console.log(`Found key ${key} with value ${allSlots[key]}`);
                } else {
                    console.log(`Key ${key} not found!`);
                }
            }
            
            return Object.keys(allSlots).length > 0;
        }
    }
];

// Run all tests
async function runTests() {
    console.log('Starting tests...');
    let passed = 0;
    let failed = 0;
    
    for (const test of testCases) {
        try {
            console.log(`\nRunning test: ${test.name}`);
            const result = await test.fn();
            if (result) {
                console.log(`✅ Test passed: ${test.name}`);
                passed++;
            } else {
                console.log(`❌ Test failed: ${test.name}`);
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test error: ${test.name}`, error);
            failed++;
        }
    }
    
    console.log(`\nTest summary: ${passed} passed, ${failed} failed`);
    
    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error(`Error closing database: ${err.message}`);
        } else {
            console.log('Database connection closed');
        }
    });
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
    db.close();
});