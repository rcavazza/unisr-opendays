#!/usr/bin/env node

/**
 * Script to test the /get_experiences endpoint
 * 
 * This script:
 * 1. Tests the endpoint with a sample contactID
 * 2. Tests with both English and Italian languages
 * 3. Tests with missing contactID
 */

const axios = require('axios');
const logger = require('./logger');

console.log('Testing the /get_experiences endpoint...');
logger.info('Testing the /get_experiences endpoint');

// Sample contactID for testing
const sampleContactID = '12345'; // Replace with a real contactID if available

// Test the endpoint
testEndpoint(sampleContactID)
  .then(() => {
    console.log('\nTests completed successfully!');
    logger.info('Tests completed successfully');
  })
  .catch(error => {
    console.error('Error during testing:', error);
    logger.error('Error during testing:', error);
  });

/**
 * Tests the /get_experiences endpoint
 * @param {string} contactID - The contactID to use for testing
 * @returns {Promise<void>} - A promise that resolves when the tests complete
 */
async function testEndpoint(contactID) {
  try {
    // Test with English language
    console.log('\n=== Test 1: English language ===\n');
    logger.info('Testing endpoint with English language');
    
    const enResponse = await axios.get(`http://localhost:3000/api/get_experiences?contactID=${contactID}&lang=en`);
    console.log('Response (English):', JSON.stringify(enResponse.data, null, 2));
    
    // Test with Italian language
    console.log('\n=== Test 2: Italian language ===\n');
    logger.info('Testing endpoint with Italian language');
    
    const itResponse = await axios.get(`http://localhost:3000/api/get_experiences?contactID=${contactID}&lang=it`);
    console.log('Response (Italian):', JSON.stringify(itResponse.data, null, 2));
    
    // Test with missing contactID
    console.log('\n=== Test 3: Missing contactID ===\n');
    logger.info('Testing endpoint with missing contactID');
    
    try {
      await axios.get('http://localhost:3000/api/get_experiences?lang=en');
    } catch (error) {
      console.log('Error response (as expected):', error.response.data);
    }
    
    console.log('\nEndpoint tests completed');
    logger.info('Endpoint tests completed');
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
    logger.error('Error testing endpoint:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\nNote: If the server is not running, you need to start it before testing the endpoint.');
    console.log('You can start the server with: node server.js');
    
    throw error;
  }
}