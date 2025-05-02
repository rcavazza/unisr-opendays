/**
 * This script verifies that the custom object replacement functionality is working correctly
 * It makes a request to the /api/get_experiences endpoint and checks if the target IDs
 * are being replaced with 25326449768 and duplicates are being removed
 */

const http = require('http');
const url = require('url');

// Configuration
const contactID = '279753620686'; // Use the same contact ID from the logs
const language = 'it';
const targetIds = ['25417865498', '25417865493', '25417865392'];
const replacementId = '25326449768';

console.log('Verifying custom object replacement functionality...');
console.log(`Target IDs: ${targetIds.join(', ')}`);
console.log(`Replacement ID: ${replacementId}`);
console.log(`Contact ID: ${contactID}`);
console.log(`Language: ${language}`);

// Make a request to the /api/get_experiences endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/get_experiences?contactID=${contactID}&lang=${language}`,
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      // Check if matchingCourseIds contains the replacement ID
      const matchingCourseIds = response.matchingCourseIds || [];
      console.log(`Matching Course IDs: ${matchingCourseIds.join(', ')}`);
      
      // Check if any of the target IDs are still present
      const hasTargetIds = targetIds.some(id => matchingCourseIds.includes(id));
      
      // Check if the replacement ID is present
      const hasReplacementId = matchingCourseIds.includes(replacementId);
      
      // Check if there are duplicates of the replacement ID
      const replacementIdCount = matchingCourseIds.filter(id => id === replacementId).length;
      
      console.log(`Has target IDs: ${hasTargetIds}`);
      console.log(`Has replacement ID: ${hasReplacementId}`);
      console.log(`Replacement ID count: ${replacementIdCount}`);
      
      // Check if the experiences array contains any experiences with the replacement ID
      const experiences = response.experiences || [];
      console.log(`Number of experiences: ${experiences.length}`);
      
      // Log the experiences for debugging
      experiences.forEach((exp, index) => {
        console.log(`Experience ${index + 1}: ID=${exp.id}, Title=${exp.title}`);
      });
      
      // Determine if the test passed
      if (!hasTargetIds && hasReplacementId && replacementIdCount === 1) {
        console.log('✅ Test PASSED: Custom object replacement is working correctly');
        console.log('  - Target IDs have been replaced');
        console.log('  - Replacement ID is present in the response');
        console.log('  - No duplicates of the replacement ID');
      } else {
        console.log('❌ Test FAILED: Custom object replacement is not working correctly');
        
        if (hasTargetIds) {
          console.log('  - Target IDs are still present in the response');
        }
        
        if (!hasReplacementId) {
          console.log('  - Replacement ID is not present in the response');
        }
        
        if (replacementIdCount > 1) {
          console.log('  - Duplicates of the replacement ID were not removed');
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request:', error);
});

req.end();