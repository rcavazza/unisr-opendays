# Implementation Plan: Custom Object Code Replacement

## Overview
When querying for custom objects associated with a contact in OpenDayRegistration.tsx, if the custom object code is 25417865498, 25417865493, or 25417865392, it should become 25326449768 before being used or saved. After the cycle, any duplicate 25326449768 entries should be removed from the array.

## Technical Flow
1. The frontend component (OpenDayRegistration.tsx) calls `fetchExperiences` from experienceService.ts
2. The experienceService.ts makes a request to the `/api/get_experiences` endpoint
3. The server gets custom objects associated with the contact from HubSpot using `hubspotExperienceService.getAllCustomObjects`
4. The server then uses these custom object IDs to get experiences from the database

## Implementation Details

### 1. Modify the `/api/get_experiences` endpoint in server.js

The best place to implement this change is after extracting the custom object IDs (around line 655) and before filtering them (around line 658). We need to:

1. Replace specific custom object IDs with 25326449768
2. Remove duplicates of 25326449768

```javascript
// Extract IDs from custom objects and log their types
const customObjectIds = customObjects.map(obj => {
    logger.info(`Custom object ID: ${obj.id}, Type: ${typeof obj.id}`);
    return obj.id;
});

// MODIFICATION: Replace specific custom object IDs with 25326449768
const targetIds = ['25417865498', '25417865493', '25417865392'];
const replacementId = '25326449768';

// Convert all IDs to strings for consistent comparison
const processedCustomObjectIds = customObjectIds.map(id => {
    const strId = String(id);
    // If the ID is one of the target IDs, replace it with the replacement ID
    if (targetIds.includes(strId)) {
        logger.info(`Replacing custom object ID ${strId} with ${replacementId}`);
        return replacementId;
    }
    return strId;
});

// Remove duplicates of the replacement ID
const uniqueCustomObjectIds = [];
const replacementIdCount = {};

processedCustomObjectIds.forEach(id => {
    // If it's the replacement ID, check if we've already added it
    if (id === replacementId) {
        if (!replacementIdCount[replacementId]) {
            replacementIdCount[replacementId] = 0;
            uniqueCustomObjectIds.push(id);
        }
        replacementIdCount[replacementId]++;
        logger.info(`Found ${replacementId} (count: ${replacementIdCount[replacementId]})`);
    } else {
        // For other IDs, always add them
        uniqueCustomObjectIds.push(id);
    }
});

logger.info(`Original custom object IDs: ${customObjectIds.join(', ')}`);
logger.info(`Processed custom object IDs: ${processedCustomObjectIds.join(', ')}`);
logger.info(`Unique custom object IDs: ${uniqueCustomObjectIds.join(', ')}`);

// Use uniqueCustomObjectIds instead of customObjectIds for the rest of the function
// Try both string and number comparisons for filtering
const filteredObjectIds = [];
for (const customId of uniqueCustomObjectIds) {
    for (const courseId of courseIds) {
        // Try string comparison
        if (String(customId) === String(courseId)) {
            logger.info(`Match found: ${customId} (${typeof customId}) matches ${courseId} (${typeof courseId})`);
            filteredObjectIds.push(customId);
            break;
        }
        // Try number comparison if both can be converted to numbers
        else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
            logger.info(`Numeric match found: ${customId} (${typeof customId}) matches ${courseId} (${typeof courseId})`);
            filteredObjectIds.push(customId);
            break;
        }
    }
}
```

## Testing Strategy
1. Test with a contact that has one of the target custom object IDs (25417865498, 25417865493, or 25417865392)
2. Verify in the logs that the ID is replaced with 25326449768
3. Test with a contact that has multiple target custom object IDs
4. Verify that duplicates of 25326449768 are removed
5. Test with a contact that has no target custom object IDs
6. Verify that the behavior is unchanged

## Potential Risks
1. Type conversion issues: The custom object IDs might be stored as numbers in some places and strings in others
2. Performance impact: The additional processing is minimal, but should be monitored
3. Downstream effects: Other parts of the system might expect specific IDs

## Implementation Steps
1. Create a backup of the server.js file
2. Implement the changes to the `/api/get_experiences` endpoint
3. Test the changes with various scenarios
4. Deploy the changes to production

## Rollback Plan
If issues are encountered:
1. Restore the backup of the server.js file
2. Restart the server