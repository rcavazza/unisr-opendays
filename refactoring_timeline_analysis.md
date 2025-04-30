# Analysis of the Refactoring from Experiences to Opend_Reservations

Based on my analysis of the codebase and documentation, I can provide insights into when and how the system was refactored from using the `experiences` table to using the `opend_reservations` table for tracking reservations.

## Timeline and Evolution

The refactoring appears to have happened in multiple phases:

### Phase 1: Initial Implementation of Opend_Reservations

Based on the `reservation_counter_implementation_plan.md` document, the `opend_reservations` table was initially proposed as part of a plan to implement a reservation counter system. This document outlines:

- The creation of a new table called `opend_reservations` to store reservation details
- The modification of the experience service to calculate available slots based on reservation counts
- The creation of a reservation service to handle reservation operations
- The addition of API endpoints for reservations

This was likely the first step in moving away from using the `current_participants` field in the `experiences` table.

### Phase 2: Transition Period

During this phase, the system appears to have used both approaches simultaneously:

- The `experiences` table with its `current_participants` field (legacy approach)
- The count of records in the `opend_reservations` table (new approach)

This is evidenced by comments in the code such as:

```javascript
// No need to update current_participants field anymore
// We're now using the actual reservation counts from the opend_reservations table
```

This comment in the `/api/reserve` endpoint suggests that the system was previously updating the `current_participants` field but has been refactored to use the reservation counts from the `opend_reservations` table instead.

### Phase 3: Slot Calculation Refactoring

According to the `slot_calculation_refactor_summary.md` document, there was a subsequent refactoring of the slot calculation system to:

- Simplify the backend logic
- Focus on complex ID transformations and key formats
- Improve code organization, readability, and performance

This refactoring maintained all existing functionality and API compatibility while improving the system. It included:

- Creating a utility module for ID standardization and key formatting
- Refactoring the slot calculation service to use these utility functions
- Implementing caching for frequently accessed data
- Creating tests to verify the refactored code

## Current State

The current state of the system, as described in `slot_calculation_analysis.md`, shows:

1. The `experiences` table contains:
   - `experience_id`, `max_participants`, and `current_participants` fields
   - The `current_participants` field is described as "a legacy counter that's not actively used"

2. The `opend_reservations` table contains:
   - Actual reservation records with `experience_id` and `time_slot_id`
   - The true count of reservations comes from counting records in this table

3. The slot calculation logic:
   - Uses the formula: `available = max_participants - reservation_count`
   - Gets `max_participants` from the `experiences` table
   - Gets `reservation_count` from the `opend_reservations` table

## Issues with the Current Implementation

Despite the refactoring, there are still some issues with the current implementation:

1. **Multiple Sources of Truth**: The system still has multiple sources of truth for slot availability:
   - The `experiences.current_participants` field (legacy)
   - The count of records in the `opend_reservations` table (current)
   - The calculated values in `slotCalculationService.getAllAvailableSlots`
   - Potentially corrected values in the frontend

2. **Key Format Inconsistency**: There are inconsistencies in key formats used to store and retrieve reservation counts.

3. **Data Type Inconsistency**: There are potential issues with data type handling, where `slot.available` might be a string instead of a number.

## Recommendations

Based on the analysis, the following recommendations were made in the documentation:

1. **Standardize Key Formats**: Define a single, consistent key format to be used throughout the application.

2. **Simplify the Data Model**: Consider removing the `current_participants` field from the `experiences` table and use the reservation count from `opend_reservations` as the single source of truth.

3. **Improve Error Handling and Logging**: Add more comprehensive error handling and detailed logging.

4. **Add Automated Tests**: Develop unit tests and integration tests for the slot calculation functions.

5. **Refactor Frontend Verification**: Address the root causes in the backend instead of having verification and correction code in the frontend.

6. **Implement Caching**: Consider caching slot availability data to improve performance.

7. **Add Real-time Updates**: Consider implementing WebSockets or Server-Sent Events for real-time updates of slot availability.

## Conclusion

The refactoring from using the `experiences` table to using the `opend_reservations` table appears to have been a gradual process that evolved over time. While the system now primarily uses the `opend_reservations` table for tracking reservations, there are still remnants of the old approach and some inconsistencies in the implementation.

The current issue with data not being saved when submitting from "/front" might be related to these inconsistencies, particularly around key formats and how the system interacts with the `opend_reservations` table.