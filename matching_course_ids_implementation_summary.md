# Matching Course IDs Implementation Summary

## Overview

This implementation enables passing the filtered list of course IDs (matchingCourseIds) from the frontend to the `/api/update-selected-experiences` endpoint. These IDs are then used to filter courses for the email sent to users.

## Changes Made

### 1. Frontend Service (`front/src/services/experienceService.ts`)

- Updated the `updateSelectedExperiences` function to accept a new `matchingCourseIds` parameter
- Modified the function to include matchingCourseIds in the request body sent to the API
- Updated JSDoc comments to document the new parameter

```typescript
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[],
  matchingCourseIds: string[] = [], // New parameter
  lang: string = 'en'
): Promise<{ success: boolean, error?: string }> => {
  // ...
  const requestBody = {
    contactID,
    experienceIds,
    matchingCourseIds // Include in request body
  };
  // ...
};
```

### 2. Frontend Component (`front/src/components/OpenDayRegistration.tsx`)

- Updated the call to `updateSelectedExperiences` to include the matchingCourseIds parameter
- Added logging for matchingCourseIds

```typescript
console.log('Calling updateSelectedExperiences with:', { contactID, selectedActivityIds, matchingCourseIds, language });
const result = await updateSelectedExperiences(contactID, selectedActivityIds, matchingCourseIds, language);
```

### 3. Backend Endpoint (`server.js`)

- Updated to extract matchingCourseIds from the request body
- Added logging for matchingCourseIds
- Modified the code to use matchingCourseIds for course filtering if provided
- Updated the getMatchingCourses call to filter courses based on matchingCourseIds

```javascript
const { contactID, experienceIds, matchingCourseIds } = req.body;

// Log the received matchingCourseIds if provided
if (matchingCourseIds) {
  logger.info(`Received matchingCourseIds: ${JSON.stringify(matchingCourseIds)}`);
  // ...
}

// Use matchingCourseIds if provided, otherwise get course_types from experiences
let courseTypes = [];
if (matchingCourseIds && Array.isArray(matchingCourseIds) && matchingCourseIds.length > 0) {
  courseTypes = matchingCourseIds;
  logger.info(`Using provided matchingCourseIds for courses: ${courseTypes.join(', ')}`);
} else {
  // Fall back to getting course_types from experiences
  // ...
}

// Get matching courses from corsi.json based on courseTypes
const useAllCourses = !matchingCourseIds || !Array.isArray(matchingCourseIds) || matchingCourseIds.length === 0;
const matchingCourses = getMatchingCourses(courseTypes, useAllCourses);
```

## Testing

A test script has been created to verify the functionality:

```javascript
node test_matching_course_ids.js
```

This script:
1. Sends a request to the `/api/update-selected-experiences` endpoint with matchingCourseIds
2. Logs the response
3. Provides instructions for verifying the results

### Manual Testing

To test the full flow:

1. Start the server:
   ```
   node server.js
   ```

2. Start the frontend development server:
   ```
   cd front
   npm run dev
   ```

3. Navigate to the reservation page with a valid contactID:
   ```
   http://localhost:3000/en/opendays?contactID=123456789
   ```

4. Select some experiences and submit the form
5. Check the server logs for messages about matchingCourseIds
6. Verify that the email contains the correct courses based on the matchingCourseIds

## Verification

To verify that the implementation is working correctly:

1. Check the server logs for "Received matchingCourseIds" messages
2. Verify that the matchingCourseIds are being used to filter courses
3. Check that the email contains the correct courses based on the matchingCourseIds
4. Confirm that the confirmation page displays the correct courses

## Troubleshooting

If you encounter issues:

1. Check the browser console for any errors in the frontend
2. Check the server logs for any errors in the backend
3. Verify that the matchingCourseIds are being correctly passed from the frontend to the backend
4. Ensure that the corsi.json file contains the expected course IDs