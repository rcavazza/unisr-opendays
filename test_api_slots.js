/**
 * Script to test the API slots with the new direct key format
 */
const axios = require('axios');

async function testApiSlots() {
  try {
    console.log('Testing API slots with the new direct key format...');
    
    // Get raw slots from the API
    const response = await axios.get(' /api/get_raw_slots');
    const slots = response.data;
    
    // Count the number of direct keys vs. legacy keys
    const directKeys = Object.keys(slots).filter(key => key.includes(':'));
    const legacyKeys = Object.keys(slots).filter(key => key.includes('_'));
    
    console.log(`Total keys: ${Object.keys(slots).length}`);
    console.log(`Direct keys: ${directKeys.length}`);
    console.log(`Legacy keys: ${legacyKeys.length}`);
    
    // Print some examples of each key type
    if (directKeys.length > 0) {
      console.log('\nDirect key examples:');
      directKeys.slice(0, 5).forEach(key => {
        console.log(`  ${key}: ${slots[key]} available slots`);
      });
    }
    
    if (legacyKeys.length > 0) {
      console.log('\nLegacy key examples:');
      legacyKeys.slice(0, 5).forEach(key => {
        console.log(`  ${key}: ${slots[key]} available slots`);
      });
    }
    
    // Check specific experience
    const experienceId = 'imdp-e-medicina-chirurgia-mani-2';
    console.log(`\nChecking slots for ${experienceId}:`);
    
    // Check direct keys
    for (let i = 1; i <= 5; i++) {
      const directKey = `${experienceId}:${i}`;
      if (slots[directKey] !== undefined) {
        console.log(`  Slot ${i}: ${slots[directKey]} available slots (direct key)`);
      } else {
        console.log(`  Slot ${i}: Not found (direct key)`);
      }
    }
    
    // Check legacy keys
    for (let i = 1; i <= 5; i++) {
      const legacyKey = `${experienceId}_${experienceId}-${i}`;
      if (slots[legacyKey] !== undefined) {
        console.log(`  Slot ${i}: ${slots[legacyKey]} available slots (legacy key)`);
      } else {
        console.log(`  Slot ${i}: Not found (legacy key)`);
      }
    }
    
    console.log('\nAPI test completed successfully!');
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.log('Make sure the server is running on port 3000');
  }
}

// Run the test
testApiSlots();