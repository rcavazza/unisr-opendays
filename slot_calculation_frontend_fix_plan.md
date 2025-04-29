# Slot Calculation Frontend Fix Plan

## Overview

While the primary fix for the slot calculation issue will be implemented in the backend (`slotCalculationService.js`), this document outlines complementary frontend improvements to ensure a robust solution. These frontend enhancements will provide better error handling, verification, and user experience around slot availability.

## Current Frontend Implementation

The frontend currently handles slot availability in several components:

1. **experienceService.ts**:
   - Fetches experiences from the API
   - Includes debugging logs for slot availability

2. **OpenDayRegistration.tsx**:
   - Contains verification and fix functions for slot discrepancies
   - Includes data type normalization for slot availability

3. **ActivityAccordion.tsx**:
   - Displays the available slot count
   - Handles UI states for fully booked slots

## Proposed Frontend Improvements

### 1. Enhanced Error Handling and Verification

#### Improve Type Safety

```typescript
// Define explicit types for slot availability
interface TimeSlot {
  id: string;
  time: string;
  endTime?: string;
  available: number; // Explicitly number, not string | number
  reserved?: number;
}

// Add runtime type checking
function ensureNumericAvailability(slots: TimeSlot[]): TimeSlot[] {
  return slots.map(slot => ({
    ...slot,
    available: typeof slot.available === 'string'
      ? parseInt(String(slot.available), 10)
      : slot.available
  }));
}
```

#### Centralize Verification Logic

Move the verification and fix logic from `OpenDayRegistration.tsx` to a dedicated service:

```typescript
// Create a new file: src/services/slotVerificationService.ts
export const verifySlotAvailability = async (activities: ActivityDetails[]): Promise<ActivityDetails[]> => {
  try {
    // Fetch raw slot data from API
    const response = await fetch('/api/get_raw_slots');
    const rawSlots = await response.json();
    
    // Check for and fix discrepancies
    return activities.map(activity => ({
      ...activity,
      timeSlots: activity.timeSlots.map(slot => {
        // Try different key formats
        const key1 = `${activity.id}_${slot.id}`;
        const key2 = `${String(activity.id).replace(/-\d+$/, '')}_${slot.id}`;
        
        // Get the expected value from raw data
        const expected = rawSlots[key1] !== undefined ? rawSlots[key1] : rawSlots[key2];
        
        // Return corrected slot if discrepancy found
        if (expected !== undefined && slot.available !== expected) {
          console.warn(`Fixing slot availability discrepancy: ${key1} displayed=${slot.available}, expected=${expected}`);
          return { ...slot, available: expected };
        }
        
        return slot;
      })
    }));
  } catch (error) {
    console.error('Error verifying slot availability:', error);
    return activities; // Return original data if verification fails
  }
};
```

#### Add Automatic Verification

Modify `OpenDayRegistration.tsx` to use the new verification service:

```typescript
// In OpenDayRegistration.tsx
import { verifySlotAvailability } from '../services/slotVerificationService';

// In the loadExperiences function
const data = await fetchExperiences(contactID, language);
const inspectedData = inspectExperienceData(data);
const fixedData = inspectedData.map(exp => ({
  ...exp,
  timeSlots: exp.timeSlots.map(slot => ({
    ...slot,
    available: typeof slot.available === 'string'
      ? parseInt(String(slot.available), 10)
      : slot.available
  }))
}));

// Add automatic verification
const verifiedData = await verifySlotAvailability(fixedData);
setActivities(verifiedData);
```

### 2. Improved User Experience

#### Add Refresh Capability

Add a button to manually refresh slot availability:

```tsx
// In OpenDayRegistration.tsx
const refreshAvailability = async () => {
  setRefreshing(true);
  try {
    const updatedData = await fetchExperiences(contactID, language);
    const verifiedData = await verifySlotAvailability(updatedData);
    setActivities(verifiedData);
  } catch (error) {
    console.error('Error refreshing availability:', error);
  } finally {
    setRefreshing(false);
  }
};

// In the JSX
<button 
  onClick={refreshAvailability}
  disabled={refreshing}
  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
>
  {refreshing ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {t('refreshing')}
    </>
  ) : (
    <>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      {t('refreshAvailability')}
    </>
  )}
</button>
```

#### Add Last Updated Indicator

Show when the availability data was last updated:

```tsx
// In OpenDayRegistration.tsx state
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

// Update when data is fetched
const loadExperiences = async () => {
  // ... existing code ...
  setLastUpdated(new Date());
};

// In the JSX
{lastUpdated && (
  <div className="text-sm text-white/70 mt-2">
    {t('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
  </div>
)}
```

#### Enhance Visual Feedback for Availability

Improve how availability is displayed in `ActivityAccordion.tsx`:

```tsx
// In ActivityAccordion.tsx
const getAvailabilityColor = (available: number, max: number) => {
  if (available <= 0) return 'text-red-400';
  if (available <= max * 0.2) return 'text-orange-400'; // Less than 20% available
  if (available <= max * 0.5) return 'text-yellow-400'; // Less than 50% available
  return 'text-green-400'; // More than 50% available
};

// In the JSX
<span 
  className={`text-sm ${getAvailabilityColor(slot.available, activity.maxParticipants || 20)} available-slots`} 
  data-experience-id={activity.id} 
  data-time-slot-id={slot.id}
>
  ({t('spotsAvailable', { count: slot.available })})
</span>
```

### 3. Periodic Refresh

Implement a periodic refresh to keep availability data up-to-date:

```tsx
// In OpenDayRegistration.tsx
useEffect(() => {
  // Skip if no contact ID or if not on the page
  if (!contactID || !activities.length) return;
  
  // Set up periodic refresh every 30 seconds
  const refreshInterval = setInterval(async () => {
    try {
      console.log('Performing periodic refresh of availability data');
      const updatedData = await fetchExperiences(contactID, lang || 'en');
      const verifiedData = await verifySlotAvailability(updatedData);
      setActivities(verifiedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error in periodic refresh:', error);
    }
  }, 30000); // 30 seconds
  
  // Clean up interval on unmount
  return () => clearInterval(refreshInterval);
}, [contactID, lang, activities.length]);
```

### 4. Improved Error Messaging

Enhance error handling and user feedback:

```tsx
// In OpenDayRegistration.tsx state
const [availabilityError, setAvailabilityError] = useState<string | null>(null);

// In the loadExperiences function
try {
  // ... existing code ...
} catch (err) {
  setError('Failed to load experiences');
  setAvailabilityError(t('errorLoadingAvailability'));
  console.error('Error loading experiences:', err);
} finally {
  setLoading(false);
}

// In the JSX
{availabilityError && (
  <div className="bg-red-900/20 border border-red-400 text-red-100 px-4 py-3 rounded relative mb-4" role="alert">
    <strong className="font-bold">{t('error')}:</strong>
    <span className="block sm:inline"> {availabilityError}</span>
    <button 
      className="absolute top-0 bottom-0 right-0 px-4 py-3"
      onClick={() => setAvailabilityError(null)}
    >
      <svg className="fill-current h-6 w-6 text-red-300" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <title>{t('close')}</title>
        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
      </svg>
    </button>
  </div>
)}
```

## Implementation Plan

### Phase 1: Core Improvements

1. Create the `slotVerificationService.ts` file
2. Update `OpenDayRegistration.tsx` to use the verification service
3. Add type safety improvements

### Phase 2: User Experience Enhancements

1. Add the refresh capability
2. Implement the last updated indicator
3. Enhance visual feedback for availability

### Phase 3: Advanced Features

1. Implement periodic refresh
2. Add improved error messaging
3. Test all features thoroughly

## Testing Strategy

1. **Unit Tests**:
   - Test the `verifySlotAvailability` function with various scenarios
   - Test the type conversion and normalization functions

2. **Integration Tests**:
   - Test the interaction between the frontend and the verification service
   - Test the refresh functionality

3. **End-to-End Tests**:
   - Test the complete flow from API to display
   - Verify that discrepancies are correctly identified and fixed

## Conclusion

While the backend fix addresses the root cause of the slot calculation issue, these frontend improvements provide additional safeguards and a better user experience. By implementing both the backend and frontend changes, we can ensure a robust solution that handles slot availability correctly and provides clear feedback to users.

The frontend improvements focus on:
1. Enhanced error handling and verification
2. Improved user experience
3. Periodic refresh to keep data up-to-date
4. Better error messaging

These changes complement the backend fix and provide a more resilient system overall.