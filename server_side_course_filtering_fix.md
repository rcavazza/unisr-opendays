# Server-Side Course Filtering Fix

## Problem

The email sent to users shows a different set of courses than what appears on the confirmation page. This inconsistency can be confusing for users.

## Root Cause

The server-side filtering logic in the `/api/update-selected-experiences` endpoint may not be handling the `matchingCourseIds` in the same way as the frontend confirmation page.

## Minimal Server-Side Fix

We'll focus only on ensuring the server-side filtering logic matches the frontend behavior, without making invasive changes to the codebase.

### Current Server-Side Logic

```javascript
// In server.js, in the /api/update-selected-experiences endpoint
if (hasMatchingCourseIds) {
    // If we have matchingCourseIds, use them for filtering
    filterIds = matchingCourseIds;
    logger.info(`Using matchingCourseIds for filtering: ${filterIds.join(', ')}`);
    returnAllCourses = false;
} else {
    // If no matchingCourseIds, return all courses
    logger.info(`No matchingCourseIds provided, returning all courses`);
    returnAllCourses = true;
    filterIds = []; // Not used when returnAllCourses is true
}

logger.info(`Calling getMatchingCourses with returnAllCourses=${returnAllCourses}`);
const matchingCourses = getMatchingCourses(filterIds, returnAllCourses);
```

### Current Frontend Logic

```typescript
// In ConfirmationPage.tsx
// If no matchingCourseIds, show all courses
if (matchingCourseIds.length === 0) {
    setMatchingCourses(allCourses);
    return;
}

// Filter courses by matching IDs
const courses = allCourses.filter(course => {
    const courseIdStr = String(course.id);
    return normalizedIds.includes(courseIdStr);
});
```

### Proposed Fix

The current server-side logic already seems to match the frontend behavior:
- If `matchingCourseIds` is empty, return all courses
- If `matchingCourseIds` is provided, filter courses by these IDs

The issue might be in how the `matchingCourseIds` are being processed or normalized. Let's add some additional validation and normalization to ensure consistency:

```javascript
// In server.js, in the /api/update-selected-experiences endpoint
// Ensure matchingCourseIds is properly normalized
let normalizedMatchingCourseIds = [];
if (matchingCourseIds && Array.isArray(matchingCourseIds)) {
    // Convert all IDs to strings for consistent comparison
    normalizedMatchingCourseIds = matchingCourseIds.map(id => String(id));
    logger.info(`Normalized matchingCourseIds: ${normalizedMatchingCourseIds.join(', ')}`);
}

const hasMatchingCourseIds = normalizedMatchingCourseIds.length > 0;

// Rest of the logic remains the same
if (hasMatchingCourseIds) {
    filterIds = normalizedMatchingCourseIds;
    logger.info(`Using matchingCourseIds for filtering: ${filterIds.join(', ')}`);
    returnAllCourses = false;
} else {
    logger.info(`No matchingCourseIds provided, returning all courses`);
    returnAllCourses = true;
    filterIds = [];
}
```

### Modify getMatchingCourses Function

We should also ensure the `getMatchingCourses` function is handling string comparisons correctly:

```javascript
// Function to get matching courses from corsi.json
function getMatchingCourses(courseIds, returnAllCourses = false) {
    try {
        // ... existing code to read corsi.json ...
        
        // If returnAllCourses is true, return all courses
        if (returnAllCourses) {
            logger.info(`Returning all ${allCourses.length} courses from corsi.json without filtering`);
            return allCourses;
        }
        
        logger.info(`Looking for courses with IDs: ${courseIds.join(', ')}`);
        
        // Convert all courseIds to strings for consistent comparison
        const normalizedCourseIds = courseIds.map(id => String(id));
        
        // Filter courses by matching IDs
        const matchingCourses = allCourses.filter(course => {
            const courseIdStr = String(course.id);
            return normalizedCourseIds.includes(courseIdStr);
        });
        
        logger.info(`Found ${matchingCourses.length} matching courses`);
        logger.info(`Matching course IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
        
        return matchingCourses;
    } catch (error) {
        logger.error('Error reading courses data:', error);
        return [];
    }
}
```

## Implementation Steps

1. Add the normalization code to the `/api/update-selected-experiences` endpoint
2. Modify the `getMatchingCourses` function to ensure consistent string comparison
3. Add detailed logging to track the filtering process
4. Test with real data to verify the fix

## Testing

1. Run the application and navigate through the full flow
2. Check the server logs to verify that:
   - The `matchingCourseIds` are being properly normalized
   - The filtering logic is working as expected
   - The same courses are being included in the email as on the confirmation page
3. Verify that the email shows the same courses as the confirmation page

This minimal server-side fix ensures consistency without making invasive changes to the codebase.