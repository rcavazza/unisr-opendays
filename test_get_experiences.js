/**
 * Test script to verify the /api/get_experiences endpoint is working correctly
 */
const axios = require('axios');
const logger = require('./logger');

// Test contact ID - replace with a valid contact ID from your system
const testContactId = '272110673143'; // Replace with a valid contact ID
const language = 'it'; // or 'en' for English

logger.info(`Testing /api/get_experiences endpoint with contactID: ${testContactId}, language: ${language}`);

// Make the API request
axios.get(`http://localhost:3000/api/get_experiences?contactID=${testContactId}&lang=${language}`)
  .then(response => {
    logger.info(`Response status: ${response.status}`);
    
    if (response.data && Array.isArray(response.data)) {
      logger.info(`Success! Received ${response.data.length} experiences`);
      
      // Log the first few experiences for verification
      if (response.data.length > 0) {
        logger.info('First 3 experiences:');
        response.data.slice(0, 3).forEach((exp, index) => {
          logger.info(`Experience ${index + 1}: ID=${exp.id}, Title=${exp.title}`);
          if (exp.timeSlots && exp.timeSlots.length > 0) {
            logger.info(`  Time slots: ${exp.timeSlots.length}`);
            exp.timeSlots.forEach((slot, slotIndex) => {
              logger.info(`  - Slot ${slotIndex + 1}: ID=${slot.id}, Time=${slot.time}, Available=${slot.available}`);
            });
          }
        });
      }
    } else {
      logger.warn('Received empty or invalid response');
      logger.info('Response data:', response.data);
    }
  })
  .catch(error => {
    logger.error('Error testing endpoint:');
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error('Response data:', error.response.data);
    } else {
      logger.error(error.message);
    }
  });