# HubSpot Update Fix Plan

## Issue Identified

When a form is submitted from the selection screen in the `/front` directory, the selected experience IDs are sent to HubSpot. However, there are two issues with this process:

1. **Incorrect Separator**: The experience IDs are currently joined with commas (`,`) instead of semicolons (`;`) before being sent to HubSpot.
2. **Potential Single ID Issue**: There's a concern that only a single ID is being passed to HubSpot even when multiple experiences are selected.

## Code Analysis

### Frontend Flow

1. In `OpenDayRegistration.tsx`, when a user selects experiences:
   - Each selection is stored in the `selectedTimeSlots` object
   - When submitting, `Object.keys(selectedTimeSlots)` is used to extract the activity IDs
   - These IDs are passed to `updateSelectedExperiences` as an array

2. In `experienceService.ts`, the `updateSelectedExperiences` function:
   - Takes the array of experience IDs
   - Sends them to the `/api/update-selected-experiences` endpoint

### Backend Processing

In `submit_email_route.js`, the experience IDs are processed:

```javascript
// Format the experience IDs as a comma-separated string
const experiencesString = Array.isArray(experienceIds)
    ? experienceIds.join(',')
    : experienceIds;
```

This is where the issue is - the IDs are being joined with commas instead of semicolons.

## Required Changes

1. Modify `submit_email_route.js` to use semicolons as separators:

```javascript
// Format the experience IDs as a semicolon-separated string
const experiencesString = Array.isArray(experienceIds)
    ? experienceIds.join(';')
    : experienceIds;
```

2. Add additional logging to verify that multiple IDs are being received and processed correctly:

```javascript
// Log the received experienceIds to verify format
logger.info(`Received experienceIds: ${JSON.stringify(experienceIds)}`);
logger.info(`experienceIds is array: ${Array.isArray(experienceIds)}`);
if (Array.isArray(experienceIds)) {
    logger.info(`Number of experienceIds: ${experienceIds.length}`);
}
```

## Implementation Plan

1. Switch to Code mode to make the changes to `submit_email_route.js`
2. Test the changes by submitting a form with multiple selected experiences
3. Verify in the logs that multiple IDs are being received and correctly formatted with semicolons
4. Confirm that the HubSpot contact property is updated with the semicolon-separated list of IDs

## Expected Outcome

After these changes, when a user selects multiple experiences:
1. The frontend will correctly send an array of experience IDs to the backend
2. The backend will join these IDs with semicolons
3. HubSpot will receive the property value as a semicolon-separated list of IDs