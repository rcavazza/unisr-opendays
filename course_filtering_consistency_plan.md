# Course Filtering Consistency Implementation Plan

## Problem Statement

Currently, there are inconsistencies in how courses are filtered and displayed between the confirmation page in the frontend (/front) and the email sent to users. This can lead to confusion when users see different sets of courses in the confirmation page versus the email they receive.

## Root Causes

1. **Different Data Sources**: The frontend and backend may use different JSON files (`corsi.json` or `otto.json`) based on different flags.
2. **Different Filtering Logic**: The frontend filters courses client-side, while the backend filters them server-side with potentially different logic.
3. **Different Data Flow**: The way `matchingCourseIds` is passed and processed differs between frontend and backend.
4. **Different Data Transformation**: The courses are transformed differently for display in the frontend versus the email template.

## Implementation Plan

### 1. Standardize Data Source Selection

#### Backend Changes (server.js)

```javascript
// Modify the sendEmailWithQR function to use the same logic as the frontend
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourseIds = [], isFromSelectionPage = false) {
    return new Promise((resolve, reject) => {
        // ...existing code...
        
        // Use the same data source selection logic as the frontend
        const jsonFile = isFromSelectionPage ? 'corsi.json' : 'otto.json';
        logger.info(`Using ${jsonFile} for email courses based on isFromSelectionPage=${isFromSelectionPage}`);
        
        // Load courses from the selected JSON file
        try {
            const coursesPath = path.join(__dirname, jsonFile);
            const coursesData = fs.readFileSync(coursesPath, 'utf8');
            let allCourses = JSON.parse(coursesData);
            
            // Apply filtering logic (see next section)
            // ...
        } catch (error) {
            logger.error(`Error reading courses from ${jsonFile}:`, error);
            // ...
        }
        
        // ...rest of the function...
    });
}
```

#### Frontend Changes (ConfirmationPage.tsx)

No changes needed, as the frontend already has a clear logic for selecting the data source.

### 2. Standardize Filtering Logic

#### Create a Shared Utility Function

Create a new file `courseFilteringUtils.js` in the server root directory:

```javascript
/**
 * Filters courses based on matching course IDs
 * @param {Array} allCourses - All available courses
 * @param {Array} matchingCourseIds - IDs of courses to filter by
 * @param {boolean} returnAllIfEmpty - Whether to return all courses if matchingCourseIds is empty
 * @returns {Array} - Filtered courses
 */
function filterCoursesByIds(allCourses, matchingCourseIds, returnAllIfEmpty = true) {
    // If matchingCourseIds is empty and returnAllIfEmpty is true, return all courses
    if ((!matchingCourseIds || matchingCourseIds.length === 0) && returnAllIfEmpty) {
        return allCourses;
    }
    
    // Ensure matchingCourseIds is an array
    const normalizedIds = Array.isArray(matchingCourseIds) 
        ? matchingCourseIds.map(id => String(id))
        : [];
    
    // Filter courses by matching IDs
    return allCourses.filter(course => {
        const courseIdStr = String(course.id);
        return normalizedIds.includes(courseIdStr);
    });
}

module.exports = {
    filterCoursesByIds
};
```

#### Backend Changes (server.js)

Modify the `getMatchingCourses` function to use the shared utility:

```javascript
const { filterCoursesByIds } = require('./courseFilteringUtils');

// Function to get matching courses from corsi.json
function getMatchingCourses(courseIds, returnAllCourses = false) {
    try {
        logger.info(`Attempting to read corsi.json file...`);
        const coursesPath = path.join(__dirname, 'corsi.json');
        
        const coursesData = fs.readFileSync(coursesPath, 'utf8');
        logger.info(`Successfully read corsi.json file`);
        
        const allCourses = JSON.parse(coursesData);
        logger.info(`Parsed ${allCourses.length} courses from corsi.json`);
        
        // Use the shared utility function for filtering
        const matchingCourses = filterCoursesByIds(allCourses, courseIds, returnAllCourses);
        
        logger.info(`Found ${matchingCourses.length} matching courses`);
        return matchingCourses;
    } catch (error) {
        logger.error('Error reading courses data:', error);
        return [];
    }
}
```

#### Frontend Changes (ConfirmationPage.tsx)

Create a new file `courseFilteringUtils.ts` in the frontend src/utils directory:

```typescript
/**
 * Filters courses based on matching course IDs
 * @param allCourses - All available courses
 * @param matchingCourseIds - IDs of courses to filter by
 * @param returnAllIfEmpty - Whether to return all courses if matchingCourseIds is empty
 * @returns Filtered courses
 */
export function filterCoursesByIds<T extends { id: string | number }>(
    allCourses: T[],
    matchingCourseIds: (string | number)[],
    returnAllIfEmpty = true
): T[] {
    // If matchingCourseIds is empty and returnAllIfEmpty is true, return all courses
    if ((!matchingCourseIds || matchingCourseIds.length === 0) && returnAllIfEmpty) {
        return allCourses;
    }
    
    // Ensure matchingCourseIds is an array and convert all IDs to strings
    const normalizedIds = matchingCourseIds.map(id => String(id));
    
    // Filter courses by matching IDs
    return allCourses.filter(course => {
        const courseIdStr = String(course.id);
        return normalizedIds.includes(courseIdStr);
    });
}
```

Modify the ConfirmationPage.tsx component to use this utility:

```typescript
import { filterCoursesByIds } from '../utils/courseFilteringUtils';

// In the useEffect for fetching courses
useEffect(() => {
    const fetchCourses = async () => {
        try {
            // Choose the appropriate JSON file based on navigation source
            const jsonFile = isFromSelectionPage ? '/corsi.json' : '/otto.json';
            
            let response = await fetch(jsonFile);
            
            if (!response.ok) {
                console.error(`Failed to fetch from ${jsonFile}:`, response.statusText);
                return;
            }
            
            const allCourses: Course[] = await response.json();
            
            // Use the shared utility function for filtering
            const courses = filterCoursesByIds(allCourses, matchingCourseIds);
            
            setMatchingCourses(courses);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };
    
    fetchCourses();
}, [matchingCourseIds, isFromSelectionPage]);
```

### 3. Ensure Consistent Data Flow

#### Backend Changes (server.js)

Modify the `/api/update-selected-experiences` endpoint to pass the `isFromSelectionPage` flag to the `sendEmailWithQR` function:

```javascript
// In the /api/update-selected-experiences endpoint
try {
    // ...existing code...
    
    // Determine if the request is coming from the selection page
    const isFromSelectionPage = req.query.fromSelection === 'true';
    logger.info(`Request is from selection page: ${isFromSelectionPage}`);
    
    // ...existing code...
    
    // Pass isFromSelectionPage to sendEmailWithQR
    await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, isFromSelectionPage);
    
    // ...rest of the function...
} catch (error) {
    // ...error handling...
}
```

#### Frontend Changes (OpenDayRegistration.tsx)

Modify the navigation to the confirmation page to include the `fromSelection` query parameter:

```typescript
// In the handleSubmit function
navigate(`/${lang}/opendays/confirmation?contactID=${contactID}&fromSelection=true`, {
    state: {
        activities: selectedActivities,
        matchingCourseIds: matchingCourseIds
    }
});
```

### 4. Standardize Data Transformation

#### Create a Shared Course Transformation Function

Add a function to `courseFilteringUtils.js` for the backend:

```javascript
/**
 * Transforms course data for display in email or UI
 * @param {Object} course - The course to transform
 * @returns {Object} - Transformed course data
 */
function transformCourseForDisplay(course) {
    return {
        id: course.id,
        title: course.name || course.title,
        date: "May 10, 2025", // Fixed date for Open Day
        location: course.location || "Main Campus",
        time: course.orario_inizio 
            ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` 
            : ''
    };
}

module.exports = {
    filterCoursesByIds,
    transformCourseForDisplay
};
```

Add a similar function to `courseFilteringUtils.ts` for the frontend:

```typescript
/**
 * Transforms course data for display in email or UI
 * @param course - The course to transform
 * @returns Transformed course data
 */
export function transformCourseForDisplay(course: any) {
    return {
        id: course.id,
        title: course.name || course.title,
        date: "May 10, 2025", // Fixed date for Open Day
        location: course.location || "Main Campus",
        time: course.orario_inizio 
            ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` 
            : ''
    };
}
```

Use these functions in both the frontend and backend to ensure consistent transformation.

## Testing Plan

1. **Unit Tests**:
   - Test the `filterCoursesByIds` function with various inputs
   - Test the `transformCourseForDisplay` function with various inputs

2. **Integration Tests**:
   - Test the frontend confirmation page with different sets of `matchingCourseIds`
   - Test the email generation with the same sets of `matchingCourseIds`
   - Compare the results to ensure consistency

3. **End-to-End Tests**:
   - Complete the full flow from selection to confirmation to email
   - Verify that the same courses appear in both the confirmation page and the email

## Implementation Steps

1. Create the shared utility files (`courseFilteringUtils.js` and `courseFilteringUtils.ts`)
2. Modify the backend code to use the shared utilities
3. Modify the frontend code to use the shared utilities
4. Update the data flow to ensure consistent parameters
5. Test the implementation thoroughly
6. Deploy the changes

## Conclusion

By implementing these changes, we will ensure that the same courses are displayed in both the confirmation page and the email, providing a consistent experience for users. The shared utility functions will make the code more maintainable and reduce the risk of divergent implementations in the future.