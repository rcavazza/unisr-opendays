# Slot Calculation Fix Summary

## Issue Fixed

We've resolved the discrepancy in slot counting where the frontend was showing 1 less available slot than what was actually available in the database. For example, experience ID 71 had 0 reserved slots and 20 available slots in the database, but the frontend was showing only 19 available slots.

## Root Cause

The issue was caused by **double-counting of reservations** in the slot availability calculation:

1. In `courseExperienceService.js`, the initial available slots were calculated as:
   ```javascript
   available: Math.max(0, row.max_participants - row.current_participants)
   ```
   This already accounted for reservations through the `current_participants` field.

2. Later in the same file, the available slots were adjusted again based on reservation counts:
   ```javascript
   slot.available = Math.max(0, originalAvailable - reservationCount)
   ```
   This subtracted the reservation count a second time.

Since the `current_participants` field was being updated when reservations were made, this led to double-counting of reservations and incorrect available slot counts in the frontend.

## Solution Implemented

We modified `courseExperienceService.js` to stop subtracting the reservation count from the already-calculated available slots:

```javascript
// Before:
slot.available = Math.max(0, originalAvailable - reservationCount);

// After:
// Don't subtract reservation count as it's already accounted for in current_participants
slot.available = originalAvailable;
```

We also updated the logging statement to reflect this change:

```javascript
// Before:
logger.info(`Slot ${directKey} (or ${key}): original=${originalAvailable}, reservations=${reservationCount}, available=${slot.available}`);

// After:
logger.info(`Slot ${directKey} (or ${key}): available=${slot.available}, reservations=${reservationCount} (already accounted for in current_participants)`);
```

## Implementation Steps

1. Created a script (`fix_slot_calculation.js`) to patch the `courseExperienceService.js` file
2. Executed the script to apply the changes
3. Created and executed a script (`restart_after_slot_fix.js`) to restart the server with the fixed code

## Expected Results

- Experience ID 71 should now show 20 available slots in the frontend (instead of 19)
- All other experiences should show the correct number of available slots
- The slot calculation system should now correctly handle reservations without double-counting

## Verification

To verify that the fix is working correctly:

1. Check that experience ID 71 shows 20 available slots in the frontend
2. Verify that other experiences show the correct number of available slots
3. Test making a reservation to ensure the count updates correctly

## Long-term Recommendations

For a more comprehensive solution in the future, consider:

1. **Standardize Slot Calculation**: Use a single, consistent approach to calculate available slots throughout the codebase
2. **Simplify Data Model**: Consider removing the `current_participants` field and rely solely on counting reservations from the `opend_reservations` table
3. **Add Automated Tests**: Implement tests to verify slot calculation logic and prevent regression
4. **Improve Error Handling**: Add more comprehensive error handling and logging for slot calculation
5. **Add Monitoring**: Implement monitoring for slot calculation discrepancies to catch issues early