# Email Courses Fix Implementation Plan - Revised

## Issue Description

When a user doesn't select any slots and proceeds to the confirmation page, the email sent by `sendEmailWithQR` doesn't have courses in it, even though there should be courses.

## Root Cause Analysis

1. In the frontend (OpenDayRegistration.tsx), we're already fetching the matching course IDs from the API:
   ```typescript
   const response = await fetchExperiences(contactID, language);
   // Extract experiences and matching course IDs
   const { experiences, matchingCourseIds } = response;
   // Store matching course IDs
   setMatchingCourseIds(matchingCourseIds);
   ```

2. When navigating to the confirmation page, we're passing these matchingCourseIds in the state:
   ```typescript
   navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, {
     state: {
       activities: selectedActivities,
       matchingCourseIds: matchingCourseIds,
       isFromSelectionPage: true
     }
   });
   ```

3. However, when calling the `/api/update-selected-experiences` endpoint, we're only sending the selected experience IDs, not the matching course IDs:
   ```typescript
   const result = await updateSelectedExperiences(contactID, selectedActivityIds);
   ```

4. In the backend, the `/api/update-selected-experiences` endpoint tries to get course types from the database based on the selected experience IDs, which will be empty when no slots are selected.

## Solution

Modify the frontend to pass the matching course IDs to the backend when updating selected experiences, and modify the backend to use these IDs when no experiences are selected.

### Changes Required

1. Modify the experienceService.ts file to include matchingCourseIds in the updateSelectedExperiences function:

```typescript
// Current code:
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[]
): Promise<{ success: boolean, error?: string }> => {
  // ...
};

// New code:
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[],
  matchingCourseIds?: (string | number)[] // Add optional parameter
): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log('Updating selected experiences:', { contactID, experienceIds, matchingCourseIds });
    
    // Log the request details
    const requestBody = {
      contactID,
      experienceIds,
      matchingCourseIds // Include in request body
    };
    console.log('Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(' /api/update-selected-experiences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Rest of the function remains the same
    // ...
  } catch (error) {
    // ...
  }
};
```

2. Modify the OpenDayRegistration.tsx file to pass matchingCourseIds to updateSelectedExperiences:

```typescript
// Current code:
const result = await updateSelectedExperiences(contactID, selectedActivityIds);

// New code:
const result = await updateSelectedExperiences(contactID, selectedActivityIds, matchingCourseIds);
```

3. Modify the server.js file to use the matchingCourseIds when no experiences are selected:

```javascript
// Current code:
app.post('/api/update-selected-experiences', async (req, res) => {
  // ...
  const { contactID, experienceIds } = req.body;
  // ...
  // Get course_types from experiences
  const courseTypes = await new Promise((resolve, reject) => {
    // ...
  });
  // ...
});

// New code:
app.post('/api/update-selected-experiences', async (req, res) => {
  // ...
  const { contactID, experienceIds, matchingCourseIds } = req.body;
  // ...
  let courseTypes = [];
  
  // If no experiences selected but matchingCourseIds provided, use those
  if (expIds.length === 0 && matchingCourseIds && matchingCourseIds.length > 0) {
    logger.info(`No experiences selected, using provided matchingCourseIds: ${matchingCourseIds.join(', ')}`);
    courseTypes = matchingCourseIds.map(id => String(id));
  } else {
    // Get course_types from experiences as before
    logger.info(`Getting course_types for experiences with IDs: ${expIds.join(', ')}`);
    courseTypes = await new Promise((resolve, reject) => {
      // ...
    });
  }
  // ...
});
```

## Implementation Steps

1. Switch to Code mode to implement these changes
2. Modify the experienceService.ts file to include matchingCourseIds parameter
3. Modify the OpenDayRegistration.tsx file to pass matchingCourseIds
4. Modify the server.js file to use matchingCourseIds when no experiences are selected
5. Test the changes by:
   - Selecting no slots and submitting
   - Verifying that the email contains courses
   - Selecting some slots and submitting
   - Verifying that everything still works as expected

## Expected Outcome

After these changes, when a user doesn't select any slots and proceeds to the confirmation page, the email sent by `sendEmailWithQR` will contain courses based on the matching course IDs that were already fetched in the frontend, maintaining consistent behavior regardless of whether slots are selected.