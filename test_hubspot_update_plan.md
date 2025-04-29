# HubSpot Update Test Script Plan

## Purpose
Create a standalone script that tests updating the HubSpot contact property `open_day__iscrizione_esperienze_10_05_2025` with a random string to verify if the HubSpot API integration works correctly in isolation.

## Implementation Details

The script should:

1. Use axios to make a direct API call to HubSpot
2. Update a specific contact ID with a random string in the `open_day__iscrizione_esperienze_10_05_2025` property
3. Log the request and response details
4. Handle any errors that occur

## Code Structure

```javascript
/**
 * Test script to update a HubSpot contact property with a random string
 * 
 * Usage: node test_hubspot_update.js <contactID>
 */

// Import required modules
const axios = require('axios');
require('dotenv').config();

// Get contact ID from command line arguments or use a default
const contactID = process.argv[2] || '272110673143'; // Default contact ID

// Generate a random string
const randomString = Math.random().toString(36).substring(2, 15);

// Set up axios with HubSpot API key
const apiKey = process.env.HUBSPOT_APIKEY_PROD || process.env.HUBSPOT_APIKEY_SAND;
axios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;

// Log the API key prefix (for security)
console.log(`Using API key with prefix: ${apiKey.substring(0, 10)}...`);

// Create the request data
const requestData = {
    properties: {
        open_day__iscrizione_esperienze_10_05_2025: randomString
    }
};

console.log(`Updating contact ${contactID} with random string: ${randomString}`);
console.log('Request data:', JSON.stringify(requestData, null, 2));

// Make the API call
axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactID}`, requestData)
    .then(response => {
        console.log('HubSpot update successful!');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
    })
    .catch(error => {
        console.error('Error updating HubSpot contact:');
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            
            // Check for specific error types
            if (error.response.data && error.response.data.message) {
                console.error('Error message:', error.response.data.message);
                
                // Check if it's a property not found error
                if (error.response.data.message.includes('property') && error.response.data.message.includes('not found')) {
                    console.error('This appears to be a property not found error. The property might not exist in HubSpot.');
                }
                
                // Check if it's an authentication error
                if (error.response.status === 401) {
                    console.error('This appears to be an authentication error. The API key might be invalid or expired.');
                }
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from HubSpot API:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up HubSpot API request:', error.message);
        }
    });
```

## Usage

Run the script with a contact ID:

```
node test_hubspot_update.js 272110673143
```

Or run it without a contact ID to use the default:

```
node test_hubspot_update.js
```

## Expected Output

If successful:
```
Using API key with prefix: pat-eu1-123...
Updating contact 272110673143 with random string: a1b2c3d4e5
Request data: {
  "properties": {
    "open_day__iscrizione_esperienze_10_05_2025": "a1b2c3d4e5"
  }
}
HubSpot update successful!
Response status: 200
Response data: {
  "id": "272110673143",
  "properties": {
    "open_day__iscrizione_esperienze_10_05_2025": "a1b2c3d4e5",
    "hs_lastmodifieddate": "2025-04-29T03:40:00.000Z"
  },
  "createdAt": "2025-03-15T10:30:00.000Z",
  "updatedAt": "2025-04-29T03:40:00.000Z",
  "archived": false
}
```

If there's an error, it will show detailed error information to help diagnose the issue.