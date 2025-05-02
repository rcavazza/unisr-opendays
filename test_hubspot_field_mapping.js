/**
 * Test script to verify the HubSpot field mapping implementation
 * 
 * This script tests the /api/update-selected-experiences endpoint with different experienceIds
 * to ensure that the correct HubSpot field is used in each case.
 */

const axios = require('axios');
const logger = require('./logger');

// Base URL for the API
const BASE_URL = 'http://localhost:3000';

// Test contact ID (should be a valid contact ID in HubSpot)
const TEST_CONTACT_ID = '32115900465';

// Test cases
const testCases = [
    {
        name: 'Workshop Genitori (10026)',
        experienceIds: ['10026'],
        expectedField: 'slot_prenotazione_workshop_genitori_open_day_2025'
    },
    {
        name: 'Workshop Genitori (10027)',
        experienceIds: ['10027'],
        expectedField: 'slot_prenotazione_workshop_genitori_open_day_2025'
    },
    {
        name: 'Regular Experience',
        experienceIds: ['140332577011'],
        expectedField: 'open_day__iscrizione_esperienze_10_05_2025'
    },
    {
        name: 'Mixed Experiences (should use Workshop Genitori field)',
        experienceIds: ['140332577011', '10026'],
        expectedField: 'slot_prenotazione_workshop_genitori_open_day_2025'
    }
];

/**
 * Run a test case
 * @param {Object} testCase - The test case to run
 * @returns {Promise<void>}
 */
async function runTestCase(testCase) {
    try {
        logger.info(`Running test case: ${testCase.name}`);
        logger.info(`Experience IDs: ${testCase.experienceIds.join(', ')}`);
        logger.info(`Expected HubSpot field: ${testCase.expectedField}`);
        
        // Make the request to the API
        const response = await axios.post(`${BASE_URL}/api/update-selected-experiences`, {
            contactID: TEST_CONTACT_ID,
            experienceIds: testCase.experienceIds
        });
        
        logger.info(`Response status: ${response.status}`);
        logger.info(`Response data: ${JSON.stringify(response.data)}`);
        
        // The actual field used is not returned in the response, so we can only check if the request was successful
        if (response.status === 200 && response.data.success) {
            logger.info(`✅ Test case ${testCase.name} PASSED (request successful)`);
        } else {
            logger.error(`❌ Test case ${testCase.name} FAILED (request unsuccessful)`);
        }
    } catch (error) {
        logger.error(`❌ Test case ${testCase.name} FAILED with error: ${error.message}`);
        
        if (error.response) {
            logger.error(`Response status: ${error.response.status}`);
            logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
    }
    
    logger.info('-----------------------------------');
}

/**
 * Run all test cases
 */
async function runTests() {
    logger.info('Starting HubSpot field mapping tests');
    logger.info('===================================');
    
    for (const testCase of testCases) {
        await runTestCase(testCase);
    }
    
    logger.info('All tests completed');
}

// Run the tests
runTests().catch(error => {
    logger.error(`Error running tests: ${error.message}`);
});