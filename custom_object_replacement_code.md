# Custom Object Replacement Implementation Code

This markdown file contains the code needed to implement the custom object replacement functionality. Since we're in Architect mode, we can only edit markdown files. To actually implement this solution, we'll need to switch to Code mode.

## Code to Add to server.js

Add the following code to the `/api/get_experiences` endpoint in server.js, after extracting the custom object IDs (around line 655) and before filtering them (around line 658):

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

## Implementation Instructions

1. Open server.js in Code mode
2. Locate the `/api/get_experiences` endpoint (around line 617)
3. Find the section where custom object IDs are extracted (around line 652)
4. Replace the code from there until the filtering section (around line 658) with the code above
5. Test the implementation with various scenarios as outlined in the implementation plan

## Next Steps

To implement this solution, we need to switch to Code mode, which allows editing JavaScript files.