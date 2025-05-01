# Slot Selection Fix Implementation Plan

## Issue Description

When a user doesn't select any slots and proceeds to the confirmation page, the system behaves as if they arrived from the first page and looks for matches in otto.json instead of corsi.json.

## Root Cause Analysis

The issue is in how the `isFromSelectionPage` flag is determined in the ConfirmationPageWrapper component in App.tsx:

```typescript
// Line 25 in App.tsx
const isFromSelectionPage = !!location.state?.activities?.length;
```

This means that the flag is set to true only if there are activities in the location state. When no slots are selected, the activities array is empty, so `isFromSelectionPage` becomes false, causing the ConfirmationPage to use otto.json instead of corsi.json.

## Solution

We need to modify the OpenDayRegistration component to explicitly set `isFromSelectionPage` to true when navigating to the confirmation page, regardless of whether any activities were selected.

### Changes Required

1. Modify the navigation code in the OpenDayRegistration.tsx file:

```typescript
// Current code (around line 539):
navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, {
  state: {
    activities: selectedActivities,
    matchingCourseIds: matchingCourseIds
  }
});

// New code:
navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, {
  state: {
    activities: selectedActivities,
    matchingCourseIds: matchingCourseIds,
    isFromSelectionPage: true // Explicitly set this flag
  }
});
```

2. Modify the ConfirmationPageWrapper component in App.tsx to use this explicit flag:

```typescript
// Current code (around line 25):
const isFromSelectionPage = !!location.state?.activities?.length;

// New code:
const isFromSelectionPage = location.state?.isFromSelectionPage || !!location.state?.activities?.length;
```

This change ensures that `isFromSelectionPage` will be true if it's explicitly set in the state, or if there are activities in the state (for backward compatibility).

## Implementation Steps

1. Switch to Code mode to implement these changes
2. Modify the OpenDayRegistration.tsx file to add the `isFromSelectionPage: true` flag to the navigation state
3. Modify the App.tsx file to update how the `isFromSelectionPage` flag is determined
4. Test the changes by:
   - Selecting no slots and submitting
   - Verifying that the confirmation page uses corsi.json instead of otto.json
   - Selecting some slots and submitting
   - Verifying that everything still works as expected

## Expected Outcome

After these changes, when a user doesn't select any slots and proceeds to the confirmation page, the system will correctly use corsi.json instead of otto.json, maintaining consistent behavior regardless of whether slots are selected.