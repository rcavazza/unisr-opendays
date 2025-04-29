# Slot Calculation Fix Plan

## Problem Description

The frontend is showing incorrect slot availability for the experience "imdp-e-medicina-chirurgia-mani-2". Specifically:

- The frontend shows 20 available slots
- According to the database, it should show 19 available slots (max_participants=20 - current_participants=1)

## Root Cause Analysis

After examining the code, I've identified the issue in the `slotCalculationService.js` file, specifically in the `getAllAvailableSlots` function. There's a mismatch between how the keys are generated for looking up reservation counts and how they're stored in the database.

Here's what's happening:

1. For "imdp-e-medicina-chirurgia-mani-2", the database shows:
   - max_participants = 20
   - current_participants = 1

2. In the `slotCalculationService.js` file:
   - It extracts the base experience ID: "imdp-e-medicina-chirurgia-mani"
   - It generates keys for looking up reservation counts
   - The key format mismatch occurs when it tries to look up the reservation count

3. The key mismatch:
   - The reservation count is stored with key: "imdp-e-medicina-chirurgia-mani-2_imdp-e-medicina-chirurgia-mani-2-1"
   - But it's looking it up with key: "imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-1"

4. Because of this mismatch, it doesn't find the reservation count, assumes it's 0, and calculates 20 available slots instead of 19.

## Detailed Technical Analysis

In the `slotCalculationService.js` file:

```javascript
// Original key format (used in the code)
const timeSlotId = `${exp.experience_id}-${i}`;
const key = `${exp.experience_id}_${timeSlotId}`;

// Frontend key format (used in the frontend)
const frontendTimeSlotId = `${baseExperienceId}-${i}`;
const frontendKey = `${baseExperienceId}_${frontendTimeSlotId}`;

// Database key format (used in the database)
const dbKey = `${baseExperienceId}_${frontendTimeSlotId}`;

// Get reservation count from the database key
const reservationCount = reservationCounts[dbKey] || 0;
```

The issue is that `dbKey` is using the wrong format. It's using `baseExperienceId` instead of `exp.experience_id` when looking up the reservation count.

For "imdp-e-medicina-chirurgia-mani-2":
- `exp.experience_id` is "imdp-e-medicina-chirurgia-mani-2"
- `baseExperienceId` is "imdp-e-medicina-chirurgia-mani"
- `timeSlotId` is "imdp-e-medicina-chirurgia-mani-2-1"
- `frontendTimeSlotId` is "imdp-e-medicina-chirurgia-mani-1"
- `key` is "imdp-e-medicina-chirurgia-mani-2_imdp-e-medicina-chirurgia-mani-2-1"
- `frontendKey` is "imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-1"
- `dbKey` is "imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-1"

But in the `reservationCounts` object, the key is "imdp-e-medicina-chirurgia-mani-2_imdp-e-medicina-chirurgia-mani-2-1" (based on how it's populated in lines 140-144).

## Solution

The solution is to modify the `getAllAvailableSlots` function in `slotCalculationService.js` to try both key formats when looking up the reservation count:

1. Try the original key format first: `${exp.experience_id}_${timeSlotId}`
2. If no reservation count is found, try the frontend key format: `${baseExperienceId}_${frontendTimeSlotId}`

Here's the proposed code change:

```javascript
// Try both key formats for reservation count
const originalKey = `${exp.experience_id}_${timeSlotId}`;
const reservationCount = reservationCounts[originalKey] || reservationCounts[dbKey] || 0;
```

This change will ensure that the correct reservation count is used when calculating available slots, regardless of which key format is used in the database.

## Implementation Plan

1. Modify the `getAllAvailableSlots` function in `slotCalculationService.js` as described above.
2. Test the change by verifying that the frontend shows the correct number of available slots for "imdp-e-medicina-chirurgia-mani-2".
3. Verify that other experiences are not affected by the change.

## Verification

After implementing the fix, we should verify that:

1. The frontend shows 19 available slots for "imdp-e-medicina-chirurgia-mani-2" instead of 20.
2. Other experiences show the correct number of available slots.
3. The reservation system works correctly for all experiences.

## Conclusion

This issue highlights the importance of consistent key formats when working with data across different parts of the application. By fixing the key mismatch in the `slotCalculationService.js` file, we can ensure that the frontend shows the correct number of available slots for all experiences.