# HubSpot Contact Field Update Diagnosis Plan

We've identified that the front-end is correctly calling the `updateSelectedExperiences` function before navigation, but we're getting a 500 Internal Server Error from the server. Strangely, we're not seeing any logs in the server console related to this endpoint being called.

## Current Status

1. The front-end correctly calls `updateSelectedExperiences` with the contact ID and selected experience IDs
2. The server has an endpoint `/api/update-selected-experiences` that should handle this request
3. The server is returning a 500 Internal Server Error
4. No logs are appearing in the server console related to this endpoint

## What the Endpoint Should Log

The endpoint should log:

1. When it's hit: `Endpoint /api/update-selected-experiences hit`
2. The request body: `Request body: { contactID: '...', experienceIds: [...] }`
3. The HubSpot API request details: `HubSpot update request data: { properties: { open_day__iscrizione_esperienze_10_05_2025: '...' } }`
4. The HubSpot API response: `HubSpot update response: { status: ..., statusText: '...', data: ... }`
5. Any errors that occur: `Error updating HubSpot contact with selected experiences: ...`

## Possible Issues

1. **Silent Error in the Server**: There might be an error in the server code that's preventing the endpoint from being hit or causing it to crash before it can log anything.

2. **HubSpot API Key or Permissions**: The HubSpot API key might be invalid or might not have the necessary permissions to update the contact property.

3. **HubSpot Property Not Existing**: The property `open_day__iscrizione_esperienze_10_05_2025` might not exist in HubSpot or might be misspelled.

4. **Network or Proxy Issues**: There might be network or proxy issues preventing the server from reaching the HubSpot API.

## Next Steps for Diagnosis

1. **Check Server Error Handling**: Ensure that the server has proper error handling and that errors are being logged.

2. **Test HubSpot API Directly**: Use a tool like Postman or curl to test the HubSpot API directly to see if it's working.

3. **Verify HubSpot Property**: Check in the HubSpot admin panel if the property `open_day__iscrizione_esperienze_10_05_2025` exists and is writable.

4. **Check Network Connectivity**: Ensure that the server can reach the HubSpot API by testing connectivity.

5. **Add More Detailed Logging**: Add more detailed logging to the server to help diagnose the issue.

## Potential Solutions

1. **Fix Server Error Handling**: If there's an issue with the server error handling, fix it to ensure that errors are properly logged.

2. **Update HubSpot API Key**: If the API key is invalid or doesn't have the necessary permissions, update it.

3. **Create or Fix HubSpot Property**: If the property doesn't exist or is misspelled, create it or fix the spelling.

4. **Fix Network or Proxy Issues**: If there are network or proxy issues, fix them to ensure that the server can reach the HubSpot API.

5. **Implement Retry Logic**: Add retry logic to the server to handle temporary network or API issues.