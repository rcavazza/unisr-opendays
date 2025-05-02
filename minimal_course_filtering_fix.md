# Minimal Course Filtering Fix

## Problem

There's an inconsistency in how courses are filtered between the confirmation page and the email system. This can lead to users seeing different sets of courses in each place.

## Minimal Solution Approach

Instead of creating shared utilities and refactoring both frontend and backend code, we can make a minimal, targeted change to ensure consistency:

### 1. Identify the Key Difference

The key difference is in how `matchingCourseIds` is used:
- In the frontend, if `matchingCourseIds` is empty, all courses are shown
- In the backend, if `matchingCourseIds` is empty, all courses are shown, but if it's provided, only matching courses are shown

### 2. Minimal Backend Fix

We only need to modify the filtering logic in the `/api/update-selected-experiences` endpoint in server.js:

```javascript
// Current code
if (hasMatchingCourseIds) {
    // If we have matchingCourseIds, use them for filtering
    // These IDs represent ALL courses associated with the user
    filterIds = matchingCourseIds;
    logger.info(`Using matchingCourseIds for filtering: ${filterIds.join(', ')}`);
    returnAllCourses = false;
} else {
    // If no matchingCourseIds, return all courses
    logger.info(`No matchingCourseIds provided, returning all courses`);
    returnAllCourses = true;
    filterIds = []; // Not used when returnAllCourses is true
}
```

This logic is already correct and matches the frontend behavior. The issue might be in how the `matchingCourseIds` are being passed or processed elsewhere.

### 3. Verify Data Flow

We should verify that the same `matchingCourseIds` are being used in both places:

1. In the OpenDayRegistration component, check that the correct `matchingCourseIds` are being:
   - Passed to the `/api/update-selected-experiences` endpoint
   - Passed to the confirmation page via navigation state

2. In the server.js file, check that the `matchingCourseIds` are being:
   - Correctly extracted from the request body
   - Correctly passed to the `getMatchingCourses` function

### 4. Add Logging

Add additional logging to track the `matchingCourseIds` at key points:

```javascript
// In server.js, in the /api/update-selected-experiences endpoint
logger.info(`Received matchingCourseIds: ${JSON.stringify(matchingCourseIds)}`);
logger.info(`matchingCourseIds type: ${typeof matchingCourseIds}`);
logger.info(`matchingCourseIds is array: ${Array.isArray(matchingCourseIds)}`);
if (Array.isArray(matchingCourseIds)) {
    logger.info(`matchingCourseIds length: ${matchingCourseIds.length}`);
    if (matchingCourseIds.length > 0) {
        logger.info(`First matchingCourseId: ${matchingCourseIds[0]}`);
        logger.info(`First matchingCourseId type: ${typeof matchingCourseIds[0]}`);
    }
}

// After filtering
logger.info(`Filtered courses: ${JSON.stringify(matchingCourses.map(c => c.id))}`);
```

### 5. Test with Real Data

Test the system with real data to verify that:
1. The same `matchingCourseIds` are being used in both places
2. The filtering logic produces the same results in both places

## Benefits of This Approach

1. **Minimal Risk**: We're not making widespread changes to the codebase
2. **Focused Fix**: We're addressing the specific issue without introducing new patterns
3. **Better Understanding**: The additional logging will help us understand the issue better
4. **No New Dependencies**: We're not introducing new files or dependencies

## Implementation Steps

1. Add logging to track `matchingCourseIds` in both frontend and backend
2. Test with real data to verify the issue
3. If needed, make minimal adjustments to ensure the same filtering logic is applied in both places
4. Test again to verify the fix

This approach minimizes the risk of breaking existing functionality while still addressing the inconsistency between the confirmation page and email.