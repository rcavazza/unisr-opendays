# Loading Indicator Implementation Plan

## Issue Identified

When a user clicks "Submit Registration", they see the previous page for a while before seeing the final response page. This happens because the `handleSubmit` function in the OpenDayRegistration component is performing several asynchronous operations before navigating to the confirmation page:

1. It sets the loading state to true
2. It makes a separate API call for each selected time slot to reserve it
3. It refreshes the experiences data to get updated availability
4. Only then does it navigate to the confirmation page

During this time, there's no visual feedback to the user that the submission is being processed, which can make the application feel unresponsive.

## Solution

We need to add a loading indicator that appears when the user clicks "Submit Registration" and remains visible until the navigation to the confirmation page occurs. This will provide visual feedback to the user that their request is being processed.

### Implementation Steps

1. **Update the OpenDayRegistration component**:

```typescript
// Add a submitting state
const [submitting, setSubmitting] = useState(false);

// Update the handleSubmit function
const handleSubmit = async () => {
  // Set submitting state
  setSubmitting(true);
  setReservationError(null);
  
  try {
    // Make reservations for all selected time slots
    for (const [activityId, timeSlotId] of Object.entries(selectedTimeSlots)) {
      console.log(`Making reservation for activity ${activityId}, time slot ${timeSlotId}`);
      
      // Make the reservation
      const result = await makeReservation(contactID, activityId, timeSlotId);
      
      if (!result.success) {
        setReservationError(`Failed to make reservation for ${
          activities.find(a => String(a.id) === String(activityId))?.title || 'activity'
        }`);
        setSubmitting(false);
        return;
      }
    }
    
    // All reservations successful, prepare data for confirmation page
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
    
    // Refresh the experiences data to get updated availability
    const language = lang || 'en';
    await fetchExperiences(contactID, language);
    
    // Navigate to the confirmation page with the selected activities
    navigate(`/${lang}/front/confirmation`, { state: { activities: selectedActivities } });
  } catch (error) {
    console.error('Error making reservations:', error);
    setReservationError('An error occurred while making the reservations');
    setSubmitting(false);
  }
};
```

2. **Add a loading overlay component**:

```typescript
// LoadingOverlay.tsx
import React from 'react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Processing...' }) => {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    </div>
  );
};
```

3. **Use the LoadingOverlay in the OpenDayRegistration component**:

```tsx
// Import the LoadingOverlay
import { LoadingOverlay } from './LoadingOverlay';

// In the return statement, add the LoadingOverlay
return (
  <main className="min-h-screen bg-[#00A4E4] w-full relative overflow-hidden">
    {/* Add the LoadingOverlay */}
    <LoadingOverlay 
      visible={submitting} 
      message={t('processingRegistration')}
    />
    
    {/* Rest of the component */}
    {/* ... */}
  </main>
);
```

4. **Update the translation files**:

Add a new translation key for the loading message:

```json
{
  "processingRegistration": "Processing your registration..."
}
```

## Benefits

This implementation will:

1. Provide immediate visual feedback when the user clicks "Submit Registration"
2. Prevent the user from interacting with the page while the submission is being processed
3. Make the application feel more responsive and professional
4. Reduce user confusion about whether their submission was received

The loading indicator will be displayed until the navigation to the confirmation page occurs, ensuring the user knows that their request is being processed.