# Analysis of current_participants Field in experiences Table

## Overview

Based on my analysis of the codebase, I can provide insights into whether and how the `current_participants` field in the `experiences` table is being updated.

## Functions That Update current_participants

There are several functions in the codebase that are designed to update the `current_participants` field:

1. In `experiencesService.js`:
   ```javascript
   async function incrementParticipantCount(db, experienceId) {
     // ...
     db.run(
       "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id = ?",
       [experienceId],
       // ...
     );
   }

   async function decrementParticipantCount(db, experienceId) {
     // ...
     db.run(
       "UPDATE experiences SET current_participants = MAX(0, current_participants - 1) WHERE experience_id = ?",
       [experienceId],
       // ...
     );
   }
   ```

2. In `courseExperienceService.js`:
   ```javascript
   db.run(
     "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id = ?",
     [experience.id],
     // ...
   );
   ```

3. In `sync_participants.js`:
   ```javascript
   db.run(
     "UPDATE experiences SET current_participants = ? WHERE experience_id = ?",
     [reservationCount, exp.experience_id],
     // ...
   );
   ```

## Current Usage in the API Endpoints

However, in the `/api/reserve` endpoint in `server.js`, there's a comment that explicitly states:

```javascript
// No need to update current_participants field anymore
// We're now using the actual reservation counts from the opend_reservations table
```

This suggests that the system has been refactored to use the `opend_reservations` table for tracking reservations instead of updating the `current_participants` field directly.

## How Available Slots Are Calculated

The available slots are calculated in different ways in different parts of the code:

1. In `courseExperienceService.js`:
   ```javascript
   available: Math.max(0, row.max_participants - row.current_participants)
   ```
   This suggests that the `current_participants` field is still being used to calculate available slots.

2. In `slotCalculationService.js` (after the fix in `fix_slot_calculation.js`):
   ```javascript
   // Don't subtract reservation count as it's already accounted for in current_participants
   slot.available = originalAvailable;
   ```
   This suggests that the `current_participants` field is expected to already include the reservation count.

## Synchronization Script

There's a `sync_participants.js` script that synchronizes the `current_participants` field with the actual reservation counts:

```javascript
// For each experience, count reservations and update current_participants
for (const exp of experiences) {
  // ...
  db.run(
    "UPDATE experiences SET current_participants = ? WHERE experience_id = ?",
    [reservationCount, exp.experience_id],
    // ...
  );
}
```

This script could be used to ensure that the `current_participants` field is in sync with the actual reservation counts in the `opend_reservations` table.

## Conclusion

Based on the analysis:

1. The `current_participants` field is not being automatically updated when reservations are made through the `/api/reserve` endpoint.

2. There are functions in the codebase that could update the `current_participants` field, but they don't appear to be called in the main reservation flow.

3. The system appears to be in a transitional state where:
   - Some parts of the code still use the `current_participants` field to calculate available slots
   - But the system has been refactored to use the `opend_reservations` table for tracking reservations
   - The `current_participants` field is not being updated in the `/api/reserve` endpoint anymore

4. This inconsistency could be causing the issue where data is not being saved when submitting from "/front". The system might be calculating available slots based on the `current_participants` field, but not updating this field when new reservations are made.

5. The `sync_participants.js` script could be used to synchronize the `current_participants` field with the actual reservation counts, but it's not clear if this script is being run regularly.

## Recommendation

To fix the issue with data not being saved when submitting from "/front", you could:

1. Update the `/api/reserve` endpoint to call `experiencesService.incrementParticipantCount` to update the `current_participants` field when a reservation is made.

2. Or, modify the slot calculation logic to consistently use the reservation counts from the `opend_reservations` table instead of relying on the `current_participants` field.

3. Run the `sync_participants.js` script to ensure that the `current_participants` field is in sync with the actual reservation counts.