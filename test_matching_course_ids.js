/**
 * Test script to verify the course filtering in the /api/update-selected-experiences endpoint
 * 
 * This script tests different scenarios for matchingCourseIds to ensure consistent filtering
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Change if your server runs on a different port
const TEST_CONTACT_ID = '90171178523'; // Replace with a valid contact ID for testing
const TEST_EXPERIENCE_IDS = ['140329700591', '140329700596']; // Replace with valid experience IDs

// Test cases for matchingCourseIds
const TEST_CASES = [
  {
    name: 'String IDs',
    matchingCourseIds: ['25415255368', '25415255380']
  },
  {
    name: 'Number IDs',
    matchingCourseIds: [25415255368, 25415255380]
  },
  {
    name: 'Mixed IDs',
    matchingCourseIds: ['25415255368', 25415255380]
  },
  {
    name: 'Empty array',
    matchingCourseIds: []
  },
  {
    name: 'Null',
    matchingCourseIds: null
  },
  {
    name: 'Single ID as string',
    matchingCourseIds: '25415255368'
  }
];

async function runTest(testCase) {
  try {
    console.log(`\n=== Testing ${testCase.name} ===`);
    console.log('Request data:', {
      contactID: TEST_CONTACT_ID,
      experienceIds: TEST_EXPERIENCE_IDS,
      matchingCourseIds: testCase.matchingCourseIds
    });

    // Make the request to the API
    const response = await axios.post(`${BASE_URL}/api/update-selected-experiences`, {
      contactID: TEST_CONTACT_ID,
      experienceIds: TEST_EXPERIENCE_IDS,
      matchingCourseIds: testCase.matchingCourseIds
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Test passed: API endpoint successfully processed ${testCase.name}`);
    } else {
      console.log(`❌ Test failed: API endpoint returned an error or unexpected response`);
    }
  } catch (error) {
    console.error(`Error during test for ${testCase.name}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function runAllTests() {
  console.log('Starting course filtering tests...');
  
  for (const testCase of TEST_CASES) {
    await runTest(testCase);
  }
  
  console.log('\nAll tests completed.');
  console.log('\nTo verify the test results:');
  console.log('1. Check the server logs for "Normalized matchingCourseIds" messages');
  console.log('2. Verify that string comparison is working correctly');
  console.log('3. Verify that all courses are returned when matchingCourseIds is empty or null');
}

// Run all tests
runAllTests();