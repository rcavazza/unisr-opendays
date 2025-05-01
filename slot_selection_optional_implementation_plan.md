# Slot Selection Optional Implementation Plan

## Overview

Currently, the slot selection page in the `/front` application requires users to select at least one slot before they can proceed. This implementation plan outlines the changes needed to allow users to proceed without selecting any slots, while maintaining all existing functionality including email sending, course information passing, etc.

## Current Behavior

- The submit button is disabled if no slots are selected (`disabled={!hasSelections || loading}`)
- Users must select at least one slot to proceed to the confirmation page
- The system makes reservations for all selected slots
- HubSpot contact is updated with selected experience IDs
- Navigation to confirmation page includes selected activities and matching course IDs

## Desired Behavior

- Users can proceed without selecting any slots
- All other functionality remains the same
- If no slots are selected:
  - No reservations are made
  - HubSpot contact is updated with an empty array of experience IDs
  - Navigation to confirmation page occurs with an empty activities array
  - Course information is still passed along

## Code Analysis

After analyzing the codebase, I've confirmed:

1. The `OpenDayRegistration.tsx` component controls the slot selection UI and submission logic
2. The `ConfirmationPage.tsx` component already handles empty activities arrays correctly with conditional rendering
3. The server-side `/api/update-selected-experiences` endpoint can handle empty arrays of experience IDs
4. The server-side `/api/reserve` endpoint is only called when there are selected slots

## Implementation Details

### 1. Modify the Submit Button in OpenDayRegistration.tsx

Remove the `hasSelections` condition from the submit button's disabled property:

```typescript
// Current code:
disabled={!hasSelections || loading}

// New code:
disabled={loading}
```

### 2. Update the handleSubmit Function in OpenDayRegistration.tsx

The existing `handleSubmit` function already has the structure to handle empty selections, but we'll add explicit logging for this case:

```typescript
const handleSubmit = async () => {
  console.log('handleSubmit called - this should appear in the console when the submit button is clicked');
  // Set submitting state
  setSubmitting(true);
  setReservationError(null);
  
  try {
    console.log('Starting to make reservations for selected time slots');
    // Make reservations for all selected time slots
    const selectedSlots = Object.entries(selectedTimeSlots);
    
    // Only process reservations if there are selected slots
    if (selectedSlots.length > 0) {
      for (let i = 0; i < selectedSlots.length; i++) {
        const [activityId, timeSlotId] = selectedSlots[i];
        console.log(`Making reservation for activity ${activityId}, time slot ${timeSlotId}`);
        
        // Set replaceAll to true for the first reservation only
        const isFirstReservation = i === 0;
        
        // Trovare l'attività e lo slot selezionato
        const activity = activities.find(a => String(a.id) === String(activityId));
        const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
        
        // Ottenere l'ID della riga
        const dbId = timeSlot?.dbId;
        
        // Verificare che dbId sia presente
        if (!dbId) {
          console.error(`dbId not found for activity ${activityId}, slot ${timeSlotId}`);
          setReservationError(`Failed to make reservation for ${activity?.title || 'activity'}`);
          setSubmitting(false);
          return;
        }
        
        console.log(`Submitting reservation for activity ${activityId}, slot ${timeSlotId}, dbId: ${dbId}`);
        
        // Make the reservation with dbId
        const result = await makeReservation(contactID, activityId, timeSlotId, dbId, isFirstReservation);
        console.log(`Reservation result for ${activityId}:`, result);
        
        if (!result.success) {
          // Check if this is a "no spots available" error
          if (result.errorCode === 'NO_SPOTS_AVAILABLE') {
            const activity = activities.find(a => String(a.id) === String(activityId));
            const activityTitle = activity?.title || 'activity';
            
            setReservationError(t('noSpotsAvailableForActivity', { activity: activityTitle }));
            
            // Refresh the experiences data to get updated availability
            const language = lang || 'en';
            const updatedResponse = await fetchExperiences(contactID, language);
            setActivities(updatedResponse.experiences);
            setMatchingCourseIds(updatedResponse.matchingCourseIds);
            
            // Clear the selection for this activity
            const newSelectedTimeSlots = { ...selectedTimeSlots };
            delete newSelectedTimeSlots[activityId];
            setSelectedTimeSlots(newSelectedTimeSlots);
            
            setSubmitting(false);
            return;
          } else {
            // For other errors
            setReservationError(`Failed to make reservation for ${
              activities.find(a => String(a.id) === String(activityId))?.title || 'activity'
            }`);
            setSubmitting(false);
            return;
          }
        }
      }
      
      console.log('All reservations completed successfully');
    } else {
      console.log('No slots selected, skipping reservation process');
    }
    
    // All reservations successful or no reservations needed
    
    // Extract just the activity IDs from the selected time slots
    const selectedActivityIds = Object.keys(selectedTimeSlots);
    console.log('Selected activity IDs for HubSpot update:', selectedActivityIds);
    console.log('Contact ID for HubSpot update:', contactID);
    
    // Prepare data for confirmation page
    const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
      // Use String comparison to handle both string and number IDs
      const activity = activities.find(a => String(a.id) === String(activityId));
      const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
      return {
        activity: activity?.title,
        course: activity?.course,
        time: timeSlot?.time,
        location: activity?.location,  // Add location
        duration: activity?.duration   // Add duration
      };
    });
    
    // Update the HubSpot contact with the selected experience IDs
    console.log('Now updating HubSpot contact with selected experiences');
    try {
      console.log('Calling updateSelectedExperiences with:', { contactID, selectedActivityIds });
      const result = await updateSelectedExperiences(contactID, selectedActivityIds);
      console.log('Result from updateSelectedExperiences:', result);
      console.log('Successfully updated HubSpot contact with selected experiences');
    } catch (updateError) {
      console.error('Error updating HubSpot contact with selected experiences:', updateError);
      if (updateError instanceof Error) {
        console.error('Error details:', updateError.message);
      }
      // Continue with the flow even if this update fails
    }
    
    // Refresh the experiences data to get updated availability
    const language = lang || 'en';
    const finalResponse = await fetchExperiences(contactID, language);
    
    // Update matching course IDs one last time
    setMatchingCourseIds(finalResponse.matchingCourseIds);
    
    // Navigate to the confirmation page with the selected activities and matching course IDs
    console.log('Navigation to confirmation page with contactID:', contactID);
    console.log('Matching course IDs:', matchingCourseIds);
    navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, {
      state: {
        activities: selectedActivities,
        matchingCourseIds: matchingCourseIds
      }
    });
  } catch (error) {
    console.error('Error making reservations:', error);
    setReservationError('An error occurred while making the reservations');
    setSubmitting(false);
  }
};
```

## Server-Side Compatibility

I've verified that the server-side code can handle requests with no selected slots:

1. The `/api/update-selected-experiences` endpoint (lines 990-1100+) accepts an array of experienceIds and can handle an empty array, which results in an empty string being sent to HubSpot.

2. The `/api/reserve` endpoint (lines 669-800) is only called when there are selected slots, so no changes are needed there.

3. The email sending functionality will still work with an empty activities array.

## Testing Plan

1. Test submitting with no slots selected:
   - Verify the submit button is enabled
   - Verify navigation to the confirmation page works
   - Verify HubSpot is updated with an empty array
   - Verify course information is passed correctly
   - Verify email is sent with correct course information but no activities

2. Test submitting with slots selected:
   - Verify all existing functionality continues to work
   - Verify reservations are made correctly
   - Verify HubSpot is updated with the selected experience IDs
   - Verify navigation to the confirmation page works with the selected activities

## Implementation Notes

- The changes are minimal and focused on the OpenDayRegistration.tsx file
- No changes are needed to the backend API
- The ConfirmationPage.tsx component already handles empty activities arrays correctly with conditional rendering

## Next Steps

1. Switch to Code mode to implement the changes:
   - Locate line 790 in OpenDayRegistration.tsx where the submit button is defined
   - Change `disabled={!hasSelections || loading}` to `disabled={loading}`
   - No other code changes are needed as the handleSubmit function already handles the case when no slots are selected

2. Test the implementation:
   - Verify that the submit button is enabled even when no slots are selected
   - Test submitting with no slots selected and confirm that the confirmation page loads correctly
   - Test submitting with slots selected to ensure existing functionality still works