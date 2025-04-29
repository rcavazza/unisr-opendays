#!/usr/bin/env node

/**
 * Script to set up and test the /get_experiences endpoint
 * 
 * This script:
 * 1. Modifies the experiences table to add language and description fields
 * 2. Creates sample data in both languages
 * 3. Tests the endpoint with a sample contactID
 */

const { spawn } = require('child_process');
const axios = require('axios');
const logger = require('./logger');

console.log('Setting up the /get_experiences endpoint...');
logger.info('Setting up the /get_experiences endpoint');

// Step 1: Run the script to modify the experiences table
console.log('\n=== Step 1: Modifying the experiences table ===\n');
runScript('add_experience_fields.js')
  .then(() => {
    console.log('\n=== Step 2: Testing the endpoint ===\n');
    // Test the endpoint with a sample contactID
    return testEndpoint();
  })
  .then(() => {
    console.log('\nSetup completed successfully!');
    logger.info('Setup completed successfully');
  })
  .catch(error => {
    console.error('Error during setup:', error);
    logger.error('Error during setup:', error);
  });

/**
 * Runs a Node.js script
 * @param {string} scriptName - The name of the script to run
 * @returns {Promise<void>} - A promise that resolves when the script completes
 */
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${scriptName}...`);
    logger.info(`Running ${scriptName}`);
    
    const child = spawn('node', [scriptName], { stdio: 'inherit' });
    
    child.on('close', code => {
      if (code === 0) {
        console.log(`${scriptName} completed successfully`);
        logger.info(`${scriptName} completed successfully`);
        resolve();
      } else {
        const error = new Error(`${scriptName} exited with code ${code}`);
        console.error(error.message);
        logger.error(error.message);
        reject(error);
      }
    });
    
    child.on('error', error => {
      console.error(`Error running ${scriptName}:`, error);
      logger.error(`Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

/**
 * Tests the /get_experiences endpoint
 * @returns {Promise<void>} - A promise that resolves when the test completes
 */
async function testEndpoint() {
  try {
    // Test with English language
    console.log('Testing endpoint with English language...');
    logger.info('Testing endpoint with English language');
    
    const enResponse = await axios.get(' /api/get_experiences?contactID=12345&lang=en');
    console.log('Response (English):', JSON.stringify(enResponse.data, null, 2));
    
    // Test with Italian language
    console.log('\nTesting endpoint with Italian language...');
    logger.info('Testing endpoint with Italian language');
    
    const itResponse = await axios.get(' /api/get_experiences?contactID=12345&lang=it');
    console.log('Response (Italian):', JSON.stringify(itResponse.data, null, 2));
    
    // Test with missing contactID
    console.log('\nTesting endpoint with missing contactID...');
    logger.info('Testing endpoint with missing contactID');
    
    try {
      await axios.get(' /api/get_experiences?lang=en');
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
  }
}