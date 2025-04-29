# HubSpot Field Update Debugging Plan

The HubSpot contact field `open_day__iscrizione_esperienze_10_05_2025` is not being updated when users submit their selected experiences. Let's implement a debugging plan to identify and fix the issue.

## Potential Issues

1. **Property Name**: The property name `open_day__iscrizione_esperienze_10_05_2025` might not exist in HubSpot or might be misspelled.
2. **Authorization**: There might be an issue with the authorization header or API key.
3. **Silent Failure**: The axios request might be failing silently without proper error logging.
4. **Request Format**: The request format might not be correct for the HubSpot API.

## Debugging Steps

1. **Add Detailed Logging**:
   - Log the exact request being sent to HubSpot
   - Log the complete response from HubSpot
   - Add more detailed error logging

2. **Verify Property Existence**:
   - Check if the property `open_day__iscrizione_esperienze_10_05_2025` exists in HubSpot
   - Verify the property is writable

3. **Test API Key**:
   - Verify the API key has the necessary permissions
   - Test the API key with a simple HubSpot API call

4. **Implement Changes**:
   - Update the server.js file with enhanced logging
   - Add proper error handling
   - Add request and response interceptors for axios

## Implementation Details

### Enhanced Logging for the Endpoint

```javascript
// Endpoint to update selected experiences in HubSpot
app.post('/api/update-selected-experiences', async (req, res) => {
    const { contactID, experienceIds } = req.body;
    
    if (!contactID || !experienceIds) {
        logger.error('Missing required fields:', { contactID, experienceIds });
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Format the experience IDs as a comma-separated string
        const experiencesString = Array.isArray(experienceIds) 
            ? experienceIds.join(',') 
            : experienceIds;
        
        logger.info(`Updating HubSpot contact ${contactID} with selected experiences: ${experiencesString}`);
        
        // Log the request details
        const requestData = {
            properties: {
                open_day__iscrizione_esperienze_10_05_2025: experiencesString
            }
        };
        logger.info('HubSpot update request data:', requestData);
        
        // Update the HubSpot contact property
        const response = await axios.patch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}`, 
            requestData
        );
        
        // Log the response
        logger.info('HubSpot update response:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
        });
        
        // Return success
        res.json({
            success: true
        });
    } catch (error) {
        logger.error('Error updating HubSpot contact with selected experiences:', error);
        
        // Log more detailed error information
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            logger.error('HubSpot API error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            logger.error('No response received from HubSpot API:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            logger.error('Error setting up HubSpot API request:', error.message);
        }
        
        res.status(500).json({
            error: 'Internal server error',
            details: error.response ? error.response.data : error.message
        });
    }
});
```

After implementing these changes, we should be able to see more detailed logs that will help us identify the specific issue with the HubSpot field update.