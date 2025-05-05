# Modified Implementation Plan for Custom Object Replacement

## Current Implementation
Currently, our implementation:
1. Extracts custom object IDs from the contact
2. Replaces specific IDs (25417865498, 25417865493, 25417865392) with 25326449768
3. Removes duplicates of 25326449768
4. Uses these modified IDs to filter course IDs and query the database for experiences
5. Returns both the experiences and the modified IDs to the frontend

## New Requirement
The user wants to:
- Keep the original custom object IDs in the `matchingCourseIds` array that is returned to the frontend
- Only replace the IDs when querying the database for experiences

## Implementation Plan

### 1. Maintain Two Separate Lists
- Keep the original `customObjectIds` array unchanged
- Create a new array `queryObjectIds` that contains the modified IDs (with replacements and duplicates removed)

### 2. Modify the Code Flow
- Filter the original `customObjectIds` to create `originalFilteredObjectIds` for the response
- Create a modified version `queryObjectIds` with replacements and deduplication
- Filter `queryObjectIds` to create `queryFilteredObjectIds` for the database query
- Use `queryFilteredObjectIds` to query the database for experiences
- Return the experiences and `originalFilteredObjectIds` in the response

### 3. Code Changes

```javascript
// Extract IDs from custom objects and log their types
const customObjectIds = customObjects.map(obj => {
    logger.info(`Custom object ID: ${obj.id}, Type: ${typeof obj.id}`);
    return obj.id;
});

// Filter the original IDs for the response
const originalFilteredObjectIds = [];
for (const customId of customObjectIds) {
    for (const courseId of courseIds) {
        // Try string comparison
        if (String(customId) === String(courseId)) {
            logger.info(`Original match found: ${customId} matches ${courseId}`);
            originalFilteredObjectIds.push(customId);
            break;
        }
        // Try number comparison if both can be converted to numbers
        else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
            logger.info(`Original numeric match found: ${customId} matches ${courseId}`);
            originalFilteredObjectIds.push(customId);
            break;
        }
    }
}

// Create modified IDs for the database query
const targetIds = ['25417865498', '25417865493', '25417865392'];
const replacementId = '25326449768';

// Convert all IDs to strings for consistent comparison
const processedCustomObjectIds = customObjectIds.map(id => {
    const strId = String(id);
    // If the ID is one of the target IDs, replace it with the replacement ID
    if (targetIds.includes(strId)) {
        logger.info(`Replacing custom object ID ${strId} with ${replacementId} for database query`);
        return replacementId;
    }
    return strId;
});

// Remove duplicates of the replacement ID
const queryObjectIds = [];
const replacementIdCount = {};

processedCustomObjectIds.forEach(id => {
    // If it's the replacement ID, check if we've already added it
    if (id === replacementId) {
        if (!replacementIdCount[replacementId]) {
            replacementIdCount[replacementId] = 0;
            queryObjectIds.push(id);
        }
        replacementIdCount[replacementId]++;
        logger.info(`Found ${replacementId} for query (count: ${replacementIdCount[replacementId]})`);
    } else {
        // For other IDs, always add them
        queryObjectIds.push(id);
    }
});

logger.info(`Original custom object IDs: ${customObjectIds.join(', ')}`);
logger.info(`Query object IDs: ${queryObjectIds.join(', ')}`);

// Filter the query IDs for the database query
const queryFilteredObjectIds = [];
for (const customId of queryObjectIds) {
    for (const courseId of courseIds) {
        // Try string comparison
        if (String(customId) === String(courseId)) {
            logger.info(`Query match found: ${customId} matches ${courseId}`);
            queryFilteredObjectIds.push(customId);
            break;
        }
        // Try number comparison if both can be converted to numbers
        else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
            logger.info(`Query numeric match found: ${customId} matches ${courseId}`);
            queryFilteredObjectIds.push(customId);
            break;
        }
    }
}

// If no matching custom objects found, return an empty response
if (queryFilteredObjectIds.length === 0) {
    logger.info(`No matching custom objects found for contact ID: ${contactID}`);
    return res.json({
        experiences: [],
        matchingCourseIds: []
    });
}

// Get experiences from the database based on the filtered query IDs, language, and contactID
const experiences = await courseExperienceService.getExperiencesByCustomObjectIds(db, queryFilteredObjectIds, language, contactID);

// Return the experiences and original matching course IDs as JSON
res.json({
    experiences: experiences,
    matchingCourseIds: originalFilteredObjectIds
});
```

### 4. Testing Strategy
1. Test with a contact that has one of the target custom object IDs (25417865498, 25417865493, or 25417865392)
2. Verify in the logs that the ID is replaced with 25326449768 for the database query
3. Verify that the original ID is returned in the matchingCourseIds array
4. Test with a contact that has multiple target custom object IDs
5. Verify that duplicates of 25326449768 are removed for the database query
6. Verify that all original IDs are returned in the matchingCourseIds array