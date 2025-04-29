# Slot Calculation Fix Summary

## Issue Overview

We've identified an issue with the slot availability calculation in the application. The frontend is showing incorrect available slot counts for certain experiences, specifically:

- For "imdp-e-medicina-chirurgia-mani-2", the frontend shows 20 available slots
- According to the database, it should show 19 available slots (max_participants=20 - current_participants=1)

This discrepancy could lead to overbooking if all 20 slots were allowed to be reserved when only 19 are actually available.

## Root Cause

The issue is in the `slotCalculationService.js` file, specifically in how it calculates available slots. There's a mismatch between the key formats used to store and retrieve reservation counts:

- The reservation count is stored with one key format in the database
- But the code is looking it up with a different key format

This mismatch causes the system to not find the existing reservation, assume there are no reservations, and therefore display the maximum number of slots (20) as available.

## Solution

The solution is straightforward:

1. Modify the `getAllAvailableSlots` function in `slotCalculationService.js` to try both key formats when looking up reservation counts
2. This ensures that regardless of which format is used in the database, the correct reservation count will be found

The code change is minimal and focused, affecting only a few lines of code.

## Implementation Approach

We've prepared three documents to guide the implementation:

1. **[slot_calculation_fix_plan.md](slot_calculation_fix_plan.md)**: Detailed analysis of the issue and proposed solution
2. **[slot_calculation_fix_implementation_plan.md](slot_calculation_fix_implementation_plan.md)**: Specific code changes and implementation steps
3. **[slot_calculation_fix_deployment.md](slot_calculation_fix_deployment.md)**: Deployment process and verification steps

The implementation will be done in the following phases:

1. Code change in development environment
2. Testing and verification
3. Deployment to production
4. Post-deployment verification

## Impact and Benefits

Fixing this issue will:

- Ensure accurate display of available slots for all experiences
- Prevent potential overbooking situations
- Improve user experience by showing correct availability information
- Maintain data integrity between the database and frontend

## Next Steps

1. Review and approve the implementation plan
2. Schedule the deployment
3. Implement the fix
4. Verify the fix works as expected
5. Consider a more comprehensive review of similar code patterns to prevent similar issues

## Timeline

- Implementation: 1 day
- Testing: 1 day
- Deployment: 1 hour during low-traffic period

## Conclusion

This is a focused fix for a specific issue with slot availability calculation. The solution is well-understood, the implementation is straightforward, and the risk is minimal. We recommend proceeding with the implementation as outlined in the detailed plans.