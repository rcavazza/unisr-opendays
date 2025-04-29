# Slot Calculation Fix Implementation Plan

## Code Changes

To fix the slot calculation issue identified in the previous analysis, we need to modify the `getAllAvailableSlots` function in `slotCalculationService.js`. Here's the specific code change required:

### Current Code (Lines 167-172)

```javascript
// Database key format (used in the database)
const dbKey = `${baseExperienceId}_${frontendTimeSlotId}`;

// Get reservation count from the database key
const reservationCount = reservationCounts[dbKey] || 0;
```

### Proposed Fix

```javascript
// Try both key formats for reservation count
const originalKey = `${exp.experience_id}_${timeSlotId}`;
const dbKey = `${baseExperienceId}_${frontendTimeSlotId}`;

// Try the original key first, then fall back to the frontend key format
const reservationCount = reservationCounts[originalKey] || reservationCounts[dbKey] || 0;

// Log which key was used for debugging
if (reservationCounts[originalKey]) {
    logger.info(`Using original key for reservation count: ${originalKey} = ${reservationCounts[originalKey]}`);
} else if (reservationCounts[dbKey]) {
    logger.info(`Using db key for reservation count: ${dbKey} = ${reservationCounts[dbKey]}`);
} else {
    logger.info(`No reservation count found for keys: ${originalKey} or ${dbKey}`);
}
```

## Implementation Steps

1. Switch to Code mode to make the actual code changes.

2. Open `slotCalculationService.js` and locate the `getAllAvailableSlots` function.

3. Replace lines 167-172 with the proposed fix above.

4. Save the file.

5. Test the fix by:
   - Restarting the server
   - Accessing the frontend
   - Verifying that "imdp-e-medicina-chirurgia-mani-2" shows 19 available slots instead of 20

## Verification Steps

After implementing the fix, we should verify that:

1. The frontend shows the correct number of available slots for "imdp-e-medicina-chirurgia-mani-2":
   - Expected: 19 available slots (max_participants=20 - current_participants=1)
   - Previously: 20 available slots (incorrect)

2. Other experiences show the correct number of available slots.

3. The reservation system works correctly for all experiences.

## Rollback Plan

If the fix causes any issues, we can revert to the original code:

```javascript
// Database key format (used in the database)
const dbKey = `${baseExperienceId}_${frontendTimeSlotId}`;

// Get reservation count from the database key
const reservationCount = reservationCounts[dbKey] || 0;
```

## Additional Recommendations

1. **Consistent Key Format**: Consider standardizing the key format used throughout the application to avoid similar issues in the future.

2. **Logging Improvements**: Add more detailed logging to help diagnose similar issues in the future.

3. **Unit Tests**: Add unit tests for the `getAllAvailableSlots` function to ensure it works correctly with different key formats.

4. **Documentation**: Update the documentation to clearly explain the key formats used in different parts of the application.

## Next Steps

After implementing and verifying the fix, we should:

1. Document the issue and solution for future reference.

2. Consider a more comprehensive review of the codebase to identify similar issues.

3. Implement the additional recommendations to prevent similar issues in the future.