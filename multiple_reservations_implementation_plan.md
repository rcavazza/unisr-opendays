# Multiple Reservations Implementation Plan

## Issue

Currently, when a user selects multiple experiences and submits the form:

1. The front-end makes separate API calls to `/api/reserve` for each selected time slot
2. Each call to `/api/reserve` deletes all existing reservations for the contact before saving the new one
3. This means that only the last reservation in the loop will remain, as each new reservation deletes the previous ones

## Solution

We need to create a new API endpoint that can handle multiple reservations in a single request:

### 1. Create a New API Endpoint in `server.js`

Add a new endpoint `/api/reserve-multiple` that accepts an array of time slots:

```javascript
// Endpoint to make multiple reservations
app.post('/api/reserve-multiple', async (req, res) => {
    const { contactID, reservations } = req.body;
    
    if (!contactID || !reservations || !Array.isArray(reservations) || reservations.length === 0) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Check if all slots are available
        for (const { experienceId, timeSlotId } of reservations) {
            const isAvailable = await reservationService.isSlotAvailable(db, experienceId, timeSlotId);
            
            if (!isAvailable) {
                // No spots available, return an error
                logger.warn(`No spots available for experience ${experienceId}, time slot ${timeSlotId}`);
                return res.status(409).json({
                    success: false,
                    error: 'No spots available',
                    errorCode: 'NO_SPOTS_AVAILABLE',
                    experienceId,
                    timeSlotId
                });
            }
        }
        
        // Delete all existing reservations for this contact
        await reservationService.deleteAllReservationsForContact(db, contactID);
        
        // Save all new reservations
        for (const { experienceId, timeSlotId } of reservations) {
            await reservationService.saveReservation(db, contactID, experienceId, timeSlotId);
        }
        
        // Update the remaining slots
        await updateRemainingSlots();
        
        // Return success
        res.json({
            success: true
        });
    } catch (error) {
        logger.error('Error in /api/reserve-multiple:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
```

### 2. Add a New Function to `experienceService.ts`

Add a function to call the new API endpoint:

```typescript
/**
 * Makes multiple reservations for a contact
 * @param contactID The ID of the contact
 * @param reservations Array of experience and time slot IDs
 * @returns Promise with the reservation result
 */
export const makeMultipleReservations = async (
  contactID: string,
  reservations: Array<{ experienceId: string | number, timeSlotId: string }>
): Promise<{ success: boolean, error?: string, errorCode?: string, experienceId?: string | number, timeSlotId?: string }> => {
  try {
    console.log('Making multiple reservations:', { contactID, reservations });
    const response = await fetch(' /api/reserve-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactID,
        reservations
      })
    });
    
    const data = await response.json();
    console.log('Multiple reservations response:', data);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText, data);
      
      // Check if this is a "no spots available" error
      if (response.status === 409 && data.errorCode === 'NO_SPOTS_AVAILABLE') {
        return {
          success: false,
          error: data.error || 'No spots available',
          errorCode: 'NO_SPOTS_AVAILABLE',
          experienceId: data.experienceId,
          timeSlotId: data.timeSlotId
        };
      }
      
      // For other errors
      return {
        success: false,
        error: data.error || 'Failed to make reservations'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error making multiple reservations:', error);
    throw error;
  }
};
```

### 3. Modify the `handleSubmit` Function in `OpenDayRegistration.tsx`

Update the function to use the new `makeMultipleReservations` function:

```typescript
const handleSubmit = async () => {
  console.log('handleSubmit called - this should appear in the console when the submit button is clicked');
  // Set submitting state
  setSubmitting(true);
  setReservationError(null);
  
  try {
    console.log('Starting to make reservations for selected time slots');
    
    // Prepare the reservations array
    const reservationsArray = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => ({
      experienceId: activityId,
      timeSlotId
    }));
    
    if (reservationsArray.length === 0) {
      setReservationError('No time slots selected');
      setSubmitting(false);
      return;
    }
    
    // Make all reservations in a single request
    const result = await makeMultipleReservations(contactID, reservationsArray);
    console.log('Multiple reservations result:', result);
    
    if (!result.success) {
      // Check if this is a "no spots available" error
      if (result.errorCode === 'NO_SPOTS_AVAILABLE') {
        const activity = activities.find(a => String(a.id) === String(result.experienceId));
        const activityTitle = activity?.title || 'activity';
        
        setReservationError(t('noSpotsAvailableForActivity', { activity: activityTitle }));
        
        // Refresh the experiences data to get updated availability
        const language = lang || 'en';
        const updatedData = await fetchExperiences(contactID, language);
        setActivities(updatedData);
        
        // Clear the selection for this activity
        if (result.experienceId) {
          const newSelectedTimeSlots = { ...selectedTimeSlots };
          delete newSelectedTimeSlots[result.experienceId];
          setSelectedTimeSlots(newSelectedTimeSlots);
        }
        
        setSubmitting(false);
        return;
      } else {
        // For other errors
        setReservationError(result.error || 'Failed to make reservations');
        setSubmitting(false);
        return;
      }
    }
    
    console.log('All reservations completed successfully');
    
    // All reservations successful
    
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
        time: timeSlot?.time
      };
    });
    
    // Update the HubSpot contact with the selected experience IDs
    // ... rest of the existing code ...
    
    // Refresh the experiences data to get updated availability
    const language = lang || 'en';
    await fetchExperiences(contactID, language);
    
    // Navigate to the confirmation page with the selected activities
    console.log('Navigation to confirmation page');
    navigate(`/${lang}/front/confirmation`, { state: { activities: selectedActivities } });
  } catch (error) {
    console.error('Error making reservations:', error);
    setReservationError('An error occurred while making the reservations');
    setSubmitting(false);
  }
};
```

## Implementation Steps

1. Add the new `/api/reserve-multiple` endpoint to `server.js`
2. Add the `makeMultipleReservations` function to `experienceService.ts`
3. Modify the `handleSubmit` function in `OpenDayRegistration.tsx` to use the new function
4. Test the changes to ensure they work as expected

## Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (OpenDayRegistration.tsx)
    participant API as API (/api/reserve-multiple)
    participant Service as ReservationService
    participant DB as Database (opend_reservations)
    
    User->>Frontend: Submit form with multiple selected experiences
    Frontend->>API: POST /api/reserve-multiple with contactID and array of reservations
    
    loop For each reservation
        API->>Service: isSlotAvailable(db, experienceId, timeSlotId)
        Service->>DB: Check slot availability
        DB-->>Service: Return availability status
        Service-->>API: Return availability status
    end
    
    alt All slots are available
        API->>Service: deleteAllReservationsForContact(db, contactID)
        Service->>DB: DELETE FROM opend_reservations WHERE contact_id = ?
        DB-->>Service: Deletion result
        Service-->>API: Return deletion result
        
        loop For each reservation
            API->>Service: saveReservation(db, contactID, experienceId, timeSlotId)
            Service->>DB: INSERT INTO opend_reservations
            DB-->>Service: Insertion result
            Service-->>API: Return save result
        end
        
        API->>API: updateRemainingSlots()
        API-->>Frontend: Return success response
    else Some slot is not available
        API-->>Frontend: Return error response with details
    end
    
    Frontend-->>User: Show success or error message