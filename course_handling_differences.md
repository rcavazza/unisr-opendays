# Differences in Course Handling: Confirmation Page vs. Email

This document outlines the key differences in how courses are handled between the confirmation page in the frontend (/front) and the email system.

## 1. Data Source Selection

**Confirmation Page (Frontend):**
- Uses either `corsi.json` or `otto.json` based on the `isFromSelectionPage` flag
- Decision is made client-side in the React component
```typescript
// Choose the appropriate JSON file based on navigation source
const jsonFile = isFromSelectionPage ? '/corsi.json' : '/otto.json';
```

**Email (Server-side):**
- Uses either `otto.json` or `corsi.json` based on the `useOttoJson` flag
- Decision is made server-side in the `sendEmailWithQR` function
```javascript
if (useOttoJson === true) {
    // If useOttoJson is true (not coming from submit), load all courses from otto.json
    // ...
} else {
    // If useOttoJson is false (coming from submit), load all courses from corsi.json
    // ...
}
```

## 2. Filtering Logic

**Confirmation Page (Frontend):**
- Filtering is done client-side in the React component
- If `matchingCourseIds` is empty, it shows all courses
- If `matchingCourseIds` is not empty, it filters courses by matching IDs
```typescript
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

**Email (Server-side):**
- Filtering is done server-side by the `getMatchingCourses` function
- In the `/api/update-selected-experiences` endpoint:
  - If `matchingCourseIds` is provided, it uses them for filtering
  - If `matchingCourseIds` is not provided, it returns all courses
```javascript
if (hasMatchingCourseIds) {
    // If we have matchingCourseIds, use them for filtering
    filterIds = matchingCourseIds;
    returnAllCourses = false;
} else {
    // If no matchingCourseIds, return all courses
    returnAllCourses = true;
    filterIds = []; // Not used when returnAllCourses is true
}
```

## 3. Data Flow

**Confirmation Page (Frontend):**
- Receives `matchingCourseIds` as a prop from the parent component
- Logs and processes these IDs directly in the component
- Fetches and filters courses in a useEffect hook

**Email (Server-side):**
- Receives `matchingCourseIds` from the request body in the API endpoint
- Passes them to the `getMatchingCourses` function
- The filtered courses are then passed to the `sendEmailWithQR` function

## 4. Data Transformation

**Confirmation Page (Frontend):**
- Displays courses directly as received from the JSON file
- Minimal transformation, mainly for display purposes

**Email (Server-side):**
- Transforms courses into a specific format for the email template
```javascript
courses: matchingCourses.map(course => ({
    title: course.name || course.title,
    date: "May 10, 2025", // Fixed date for Open Day
    location: course.location || "Main Campus",
    time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
}))
```

## Recommendation for Consistency

To ensure consistent behavior between the confirmation page and the email, consider:

1. Standardizing the data source selection logic between frontend and backend
2. Using the same filtering approach in both places
3. Ensuring that the same set of course IDs is used for filtering in both contexts
4. Implementing a shared utility function for course filtering that can be used by both frontend and backend

This will help ensure that users see the same courses in the confirmation page and in the email they receive.