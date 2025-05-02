# Time Format Implementation Plan

## Objective
Ensure that all time displays in the UI and emails show both start and end times in the format "ora_inizio - ora_fine" instead of just showing the start time.

## Current Issues

1. **Frontend Components**:
   - In the `OpenDayRegistration.tsx` component, when preparing data for the confirmation page (lines 515-525), it only includes the start time (`timeSlot?.time`) but not the end time (`timeSlot?.endTime`).
   - In the `ConfirmationPage.tsx` component, it displays only the activity time without checking for an end time.

2. **Email Templates**:
   - In the email templates (e.g., `email_courses.ejs`), time is displayed as a single date field without consistently showing both start and end times.

## Implementation Plan

### 1. Update OpenDayRegistration Component

Modify the `selectedActivities` mapping in `OpenDayRegistration.tsx` to include both start and end times:

```typescript
const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
  const activity = activities.find(a => String(a.id) === String(activityId));
  const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
  return {
    activity: activity?.title,
    course: activity?.course,
    time: timeSlot?.endTime ? `${timeSlot.time} - ${timeSlot.endTime}` : timeSlot?.time,
    location: activity?.location
  };
});
```

### 2. Update Email Templates

For each email template that displays time information, ensure it shows both start and end times:

1. **email_courses.ejs (Italian and English versions)**:
   - Update the time display logic to show both start and end times.
   - This may require changes to the server-side code that prepares the data for these email templates.

2. **email.ejs and email_patch.ejs (Italian and English versions)**:
   - Update the time display logic to show both start and end times.

### 3. Server-side Changes

If necessary, update the server-side code that prepares the data for the email templates to ensure it includes both start and end times.

## Implementation Steps

1. First, update the `OpenDayRegistration.tsx` component to include both start and end times.
2. Test the changes in the frontend to ensure the time is displayed correctly in the UI.
3. Update the email templates to ensure they display both start and end times.
4. If necessary, update the server-side code that prepares the data for the email templates.
5. Test the email functionality to ensure the time is displayed correctly in the emails.