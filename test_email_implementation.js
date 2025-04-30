/**
 * This script tests the email sending functionality for the form submission in the "/front" page
 * It simulates a form submission and checks if the email is sent correctly
 */

const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Main function
async function main() {
    try {
        console.log('=== Email Implementation Test ===');
        console.log('This script will test the email sending functionality for the form submission in the "/front" page');
        console.log('It will simulate a form submission and check if the email is sent correctly');
        console.log('');
        
        // Get contactID from user
        const contactID = await prompt('Enter a valid contactID: ');
        if (!contactID) {
            console.error('Error: contactID is required');
            process.exit(1);
        }
        
        // Get language from user
        const language = await prompt('Enter language (en/it) [default: en]: ') || 'en';
        if (language !== 'en' && language !== 'it') {
            console.error('Error: language must be "en" or "it"');
            process.exit(1);
        }
        
        // Get experience IDs from user
        const experienceIdsInput = await prompt('Enter experience IDs (comma-separated): ');
        if (!experienceIdsInput) {
            console.error('Error: experience IDs are required');
            process.exit(1);
        }
        
        const experienceIds = experienceIdsInput.split(',').map(id => id.trim());
        
        console.log('');
        console.log('Test configuration:');
        console.log(`- contactID: ${contactID}`);
        console.log(`- language: ${language}`);
        console.log(`- experienceIds: ${experienceIds.join(', ')}`);
        console.log('');
        
        // Confirm test execution
        const confirm = await prompt('Do you want to proceed with the test? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('Test cancelled');
            process.exit(0);
        }
        
        console.log('');
        console.log('Executing test...');
        
        // Make the request to the API
        const response = await axios.post('http://localhost:3000/api/update-selected-experiences', {
            contactID,
            experienceIds
        }, {
            params: {
                lang: language
            }
        });
        
        console.log('');
        console.log('API response:');
        console.log(response.data);
        
        if (response.data.success) {
            console.log('');
            console.log('Test completed successfully!');
            console.log('The API request was successful, which means:');
            console.log('1. The HubSpot contact was updated with the selected experiences');
            console.log('2. The email sending process was initiated');
            console.log('');
            console.log('Note: This test only confirms that the API request was successful.');
            console.log('To verify that the email was actually sent and received, check:');
            console.log('1. The server logs for email sending confirmation');
            console.log('2. The recipient\'s inbox for the confirmation email');
            console.log('');
            console.log('If SENDMAIL is set to 0 in the environment variables, the email will not be sent.');
        } else {
            console.log('');
            console.error('Test failed!');
            console.error('The API request was not successful.');
            console.error('Error details:', response.data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error executing test:', error.message);
        
        if (error.response) {
            console.error('API response error:');
            console.error('- Status:', error.response.status);
            console.error('- Status Text:', error.response.statusText);
            console.error('- Data:', error.response.data);
        }
    } finally {
        rl.close();
    }
}

// Execute the main function
main();