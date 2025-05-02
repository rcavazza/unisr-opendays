# Course Filtering Clarification Plan

## Understanding the Issue

Based on your feedback: "adesso nella mail vedo solo i corsi matchati con delle esperienze invece che vedere tutti quelli che appartengono all'utente" (Now in the email I only see courses matched with experiences instead of seeing all those that belong to the user).

I understand that there's a misunderstanding about what the `matchingCourseIds` represent:

1. **What we implemented**: Filtering courses to only show those that match with the selected experiences.
2. **What is actually needed**: Showing all courses that belong to the user, regardless of whether they match with selected experiences.

## Clarification of Requirements

The `matchingCourseIds` parameter represents all course IDs associated with a user/contact, not just the ones related to the experiences they selected. These IDs are obtained from the custom objects associated with the contact in HubSpot.

When these IDs are passed to the backend, we should use them to filter the courses from `corsi.json` to include only the ones that belong to the user, but we should include ALL of them, not just the ones related to the selected experiences.

## Implementation Plan

### 1. Modify the Server-Side Logic

We need to update the server.js file to ensure that all courses associated with the user (as specified by matchingCourseIds) are included in the email, not just the ones related to the selected experiences.

```javascript
// Current implementation (problematic)
const hasMatchingCourseIds = matchingCourseIds && Array.isArray(matchingCourseIds) && matchingCourseIds.length > 0;
            
// Determine which IDs to use for filtering
let filterIds;
let returnAllCourses = false;

if (hasMatchingCourseIds) {
    // If we have matchingCourseIds, use them for filtering
    filterIds = matchingCourseIds;
    logger.info(`Using matchingCourseIds for filtering: ${filterIds.join(', ')}`);
    returnAllCourses = false;
} else {
    // Otherwise, use courseTypes
    filterIds = courseTypes;
    logger.info(`Using courseTypes for filtering: ${filterIds.join(', ')}`);
    // Only return all courses if courseTypes is also empty
    returnAllCourses = courseTypes.length === 0;
}

// Proposed fix
const hasMatchingCourseIds = matchingCourseIds && Array.isArray(matchingCourseIds) && matchingCourseIds.length > 0;

// Always use matchingCourseIds for filtering if available
let filterIds;
let returnAllCourses = false;

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
```

The key difference is that we're no longer using `courseTypes` as a fallback. If `matchingCourseIds` is not provided, we return all courses. This ensures that all courses associated with the user are included in the email.

### 2. Ensure Correct Data Flow

We need to make sure that the frontend is correctly passing all course IDs associated with the user to the backend, not just the ones related to the selected experiences.

In the OpenDayRegistration component, we should verify that `matchingCourseIds` contains all course IDs associated with the user, as returned by the `fetchExperiences` function.

### 3. Testing

1. Verify that the frontend is correctly passing all course IDs associated with the user to the backend
2. Verify that the backend is using these IDs to filter courses from `corsi.json`
3. Verify that the email contains all courses associated with the user, not just the ones related to the selected experiences

## Next Steps

1. Switch to Code mode to implement these changes
2. Test the implementation to ensure it works as expected
3. Update the documentation to reflect the correct understanding of `matchingCourseIds`