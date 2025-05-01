# Implementation Plan: ConfirmationPage JSON Source Selection

## Overview

Currently, the `ConfirmationPage.tsx` component always tries to fetch course data from `otto.json` first, then falls back to `corsi.json` if `otto.json` is not available. According to the requirement, we need to modify this behavior:

- If the user is arriving from the selection page: Use `corsi.json` for course matching
- Otherwise (direct access): Use `otto.json` for course matching

## Implementation Steps

### 1. Update ConfirmationPageProps Interface

In `front/src/components/ConfirmationPage.tsx`, update the `ConfirmationPageProps` interface to include the `isFromSelectionPage` property:

```typescript
interface ConfirmationPageProps {
  activities: SelectedActivity[];
  contactID?: string; 
  matchingCourseIds?: string[];
  isFromSelectionPage?: boolean; // Add this property
}
```

### 2. Update Component Parameter Destructuring

Update the component parameter destructuring to include the new property:

```typescript
export const ConfirmationPage = ({ 
  activities, 
  contactID, 
  matchingCourseIds = [], 
  isFromSelectionPage = false 
}: ConfirmationPageProps) => {
  // ...
}
```

### 3. Modify Course Fetching Logic

Update the `useEffect` hook that fetches courses to use the appropriate JSON file based on the `isFromSelectionPage` flag:

```typescript
// Fetch matching courses from otto.json or corsi.json based on navigation source
useEffect(() => {
  console.log('ConfirmationPage - Fetch courses effect running');
  console.log('ConfirmationPage - matchingCourseIds in fetch effect:', matchingCourseIds);
  console.log('ConfirmationPage - isFromSelectionPage:', isFromSelectionPage);
  
  if (matchingCourseIds.length > 0) {
    const fetchCourses = async () => {
      try {
        console.log('ConfirmationPage - Fetching courses for IDs:', matchingCourseIds);
        
        // Choose the appropriate JSON file based on navigation source
        const jsonFile = isFromSelectionPage ? '/corsi.json' : '/otto.json';
        console.log(`ConfirmationPage - Fetching from ${jsonFile} based on navigation source`);
        
        let response = await fetch(jsonFile);
        console.log(`ConfirmationPage - ${jsonFile} response status:`, response.status);
        
        if (!response.ok) {
          console.error(`Failed to fetch from ${jsonFile}:`, response.statusText);
          return;
        }
        
        const allCourses: Course[] = await response.json();
        console.log('ConfirmationPage - Fetched courses count:', allCourses.length);
        console.log('ConfirmationPage - First few courses:', allCourses.slice(0, 3));
        
        // Ensure matchingCourseIds are strings for comparison
        const normalizedIds = matchingCourseIds.map(id => String(id));
        console.log('ConfirmationPage - Normalized IDs for comparison:', normalizedIds);
        
        // Filter courses by matching IDs
        const courses = allCourses.filter(course => {
          const courseIdStr = String(course.id);
          const isMatch = normalizedIds.includes(courseIdStr);
          console.log(`ConfirmationPage - Course ${courseIdStr} (${course.name}) match: ${isMatch}`);
          return isMatch;
        });
        
        console.log('ConfirmationPage - Matching courses count:', courses.length);
        console.log('ConfirmationPage - Matching courses:', courses);
        setMatchingCourses(courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    
    fetchCourses();
  }
}, [matchingCourseIds, isFromSelectionPage]); // Add isFromSelectionPage to dependencies
```

### 4. Update ConfirmationPageWrapper in App.tsx

In `front/src/App.tsx`, update the `ConfirmationPageWrapper` component to determine if the user is coming from the selection page and pass this information to the `ConfirmationPage` component:

```typescript
// Helper component to handle the confirmation page with location state or URL parameters
const ConfirmationPageWrapper = () => {
  const location = useLocation();
  const activities = location.state?.activities || [];
  
  console.log('ConfirmationPageWrapper - location:', location);
  console.log('ConfirmationPageWrapper - location.search:', location.search);
  
  // Determine if the user is coming from the selection page
  const isFromSelectionPage = !!location.state?.activities?.length;
  console.log('ConfirmationPageWrapper - isFromSelectionPage:', isFromSelectionPage);
  
  // Extract parameters from URL query parameters
  const urlParams = new URLSearchParams(location.search);
  console.log('ConfirmationPageWrapper - urlParams entries:', Array.from(urlParams.entries()));
  
  const contactID = urlParams.get('contactID') || '';
  console.log('ConfirmationPageWrapper - contactID from URL:', contactID);
  
  // Get matchingCourseIds from either location state or URL query parameters
  let matchingCourseIds = location.state?.matchingCourseIds || [];
  console.log('ConfirmationPageWrapper - initial matchingCourseIds from state:', matchingCourseIds);
  
  // If matchingCourseIds is not in location state, check URL query parameters
  const matchingCourseIdsParam = urlParams.get('matchingCourseIds');
  console.log('ConfirmationPageWrapper - matchingCourseIdsParam from URL:', matchingCourseIdsParam);
  
  // Always prioritize URL parameters over state
  if (matchingCourseIdsParam) {
    // Split the comma-separated list of IDs
    matchingCourseIds = matchingCourseIdsParam.split(',');
    console.log('ConfirmationPageWrapper - matchingCourseIds after split:', matchingCourseIds);
    console.log('ConfirmationPageWrapper - matchingCourseIds length after split:', matchingCourseIds.length);
    console.log('ConfirmationPageWrapper - matchingCourseIds is array after split:', Array.isArray(matchingCourseIds));
  } else if (matchingCourseIds.length > 0) {
    console.log('ConfirmationPageWrapper - using matchingCourseIds from state:', matchingCourseIds);
  } else {
    console.log('ConfirmationPageWrapper - no matchingCourseIds found in URL or state');
  }
  
  return (
    <LanguageProvider>
      <ConfirmationPage
        activities={activities}
        contactID={contactID}
        matchingCourseIds={matchingCourseIds}
        isFromSelectionPage={isFromSelectionPage}
      />
    </LanguageProvider>
  );
};
```

## Testing

After implementing these changes, test the following scenarios:

1. **Navigation from Selection Page**:
   - Complete the selection process in the OpenDayRegistration component
   - Verify that the ConfirmationPage logs show `isFromSelectionPage: true`
   - Confirm that `corsi.json` is being used for course matching

2. **Direct Access to Confirmation Page**:
   - Access the confirmation page directly with a URL like `/{lang}/opendays/confirmation?contactID={id}&matchingCourseIds={ids}`
   - Verify that the ConfirmationPage logs show `isFromSelectionPage: false`
   - Confirm that `otto.json` is being used for course matching

## Next Steps

After creating this implementation plan, we should switch to Code mode to implement these changes, as Architect mode can only edit Markdown files.