# QR Code Real Data Implementation Plan

## Problem Statement

In the `/front` directory, the page with the QR code that shows a recap of selected experiences is displaying mock data rather than real data, particularly for time and location information.

## Current Implementation

### ConfirmationPage.tsx

Currently, the `ConfirmationPage.tsx` component has hardcoded values for location and duration:

```jsx
<div className="text-yellow-300 font-bold">
  {t('location')}: Room 101
</div>
<div className="text-yellow-300 font-bold">
  {t('duration')}: 45 minutes
</div>
```

The `SelectedActivity` interface in `ConfirmationPage.tsx` only includes:

```typescript
interface SelectedActivity {
  activity?: string;
  course?: string;
  time?: string;
}
```

### OpenDayRegistration.tsx

In `OpenDayRegistration.tsx`, when preparing data for the confirmation page, it only passes the activity title, course, and time:

```javascript
const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
  const activity = activities.find(a => String(a.id) === String(activityId));
  const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
  return {
    activity: activity?.title,
    course: activity?.course,
    time: timeSlot?.time
  };
});
```

### ActivityDetails Interface

The `ActivityDetails` interface in `activities.ts` includes location and duration:

```typescript
export interface ActivityDetails {
  id: number | string;
  title: string;
  course: string;
  location: string;
  duration: string;
  desc: string;
  timeSlots: TimeSlot[];
}
```

## Implementation Plan

### 1. Update the SelectedActivity interface in ConfirmationPage.tsx

```typescript
interface SelectedActivity {
  activity?: string;
  course?: string;
  time?: string;
  location?: string;  // Add location field
  duration?: string;  // Add duration field
}
```

### 2. Update the selectedActivities mapping in OpenDayRegistration.tsx

```javascript
const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
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
```

### 3. Update the ConfirmationPage.tsx component

Replace the hardcoded values with the real data:

```jsx
<div className="text-yellow-300 font-bold">
  {t('location')}: {activity.location || t('locationNotAvailable')}
</div>
<div className="text-yellow-300 font-bold">
  {t('duration')}: {activity.duration || t('durationNotAvailable')}
</div>
```

## Implementation Steps

1. Switch to Code mode
2. Update the `SelectedActivity` interface in `ConfirmationPage.tsx`
3. Update the `selectedActivities` mapping in `OpenDayRegistration.tsx`
4. Update the display in `ConfirmationPage.tsx` to use the real data
5. Test the changes by going through the registration flow and checking the final QR code page

## Expected Outcome

After implementing these changes, the QR code page should display the real location and duration for each selected experience, instead of the hardcoded mock values.