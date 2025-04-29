# Slot Calculation Test Plan

## Overview

This test plan outlines the verification steps to ensure that the slot calculation fix correctly resolves the issue with available slot counts in the frontend. The focus is on verifying that the fix works for "imdp-e-medicina-chirurgia-mani-2" while ensuring that other experiences are not negatively affected.

## Test Environment Setup

- Development environment with the fix implemented
- Access to the database to verify reservation counts
- Frontend access to verify displayed slot counts
- Test user accounts for making reservations

## Test Cases

### 1. Verify Fix for "imdp-e-medicina-chirurgia-mani-2"

**Objective**: Confirm that the frontend shows the correct number of available slots for "imdp-e-medicina-chirurgia-mani-2".

**Steps**:
1. Access the frontend application
2. Navigate to the experience selection page
3. Find "imdp-e-medicina-chirurgia-mani-2" in the list
4. Verify the displayed available slot count

**Expected Result**:
- The frontend should show 19 available slots (max_participants=20 - current_participants=1)
- Previously, it incorrectly showed 20 available slots

### 2. Verify Other Experiences

**Objective**: Ensure that the fix does not affect the slot count display for other experiences.

**Steps**:
1. Access the frontend application
2. Navigate to the experience selection page
3. Check the available slot counts for at least 5 other experiences
4. Compare with the expected counts based on database values

**Expected Result**:
- All experiences should show the correct number of available slots
- The counts should match the calculation: max_participants - reservation_count

### 3. Make a New Reservation

**Objective**: Verify that the reservation system works correctly after the fix.

**Steps**:
1. Access the frontend application
2. Navigate to the experience selection page
3. Select "imdp-e-medicina-chirurgia-mani-2"
4. Complete the reservation process
5. Verify that the available slot count decreases by 1

**Expected Result**:
- The reservation should be successful
- The available slot count for "imdp-e-medicina-chirurgia-mani-2" should decrease from 19 to 18
- The reservation should be recorded correctly in the database

### 4. Cancel a Reservation

**Objective**: Verify that canceling a reservation correctly updates the available slot count.

**Steps**:
1. Access the frontend application
2. Navigate to the user's reservations page
3. Cancel a reservation for "imdp-e-medicina-chirurgia-mani-2"
4. Verify that the available slot count increases by 1

**Expected Result**:
- The cancellation should be successful
- The available slot count for "imdp-e-medicina-chirurgia-mani-2" should increase from 18 to 19
- The reservation should be removed correctly from the database

### 5. Edge Case: Fully Booked Experience

**Objective**: Verify that the system correctly handles fully booked experiences.

**Steps**:
1. Find an experience with only 1 available slot
2. Make a reservation for that experience
3. Verify that the experience shows as fully booked (0 available slots)
4. Try to make another reservation for the same experience

**Expected Result**:
- After the first reservation, the experience should show 0 available slots
- The system should prevent making a reservation for a fully booked experience
- An appropriate error message should be displayed

### 6. Edge Case: Experience with No Reservations

**Objective**: Verify that the system correctly handles experiences with no reservations.

**Steps**:
1. Find an experience with no current reservations
2. Verify that the available slot count equals the max_participants value
3. Make a reservation for that experience
4. Verify that the available slot count decreases by 1

**Expected Result**:
- The initial available slot count should equal max_participants
- After making a reservation, the count should decrease by 1
- The reservation should be recorded correctly in the database

## Regression Testing

### 1. Frontend Functionality

**Objective**: Ensure that the fix does not break other frontend functionality.

**Areas to Test**:
- Navigation between pages
- Experience filtering and sorting
- User profile and reservation history
- Reservation process flow

**Expected Result**:
- All frontend functionality should work as expected
- No new errors or issues should be introduced

### 2. Backend API Endpoints

**Objective**: Verify that all API endpoints related to slot calculation work correctly.

**Endpoints to Test**:
- `/api/get_experiences`
- `/api/get_raw_slots`
- `/api/reserve`
- `/api/cancel-reservation`
- `/api/reservation-counters`

**Expected Result**:
- All API endpoints should return the correct data
- Response times should be within acceptable limits
- No errors should be returned

## Performance Testing

**Objective**: Ensure that the fix does not negatively impact performance.

**Areas to Test**:
- Page load time for the experience selection page
- Response time for making a reservation
- Response time for canceling a reservation

**Expected Result**:
- Performance should be the same or better than before the fix
- No significant increase in response times

## Test Data Requirements

- Test user accounts with different reservation histories
- Experiences with various reservation counts:
  - Fully booked experiences
  - Experiences with no reservations
  - Experiences with some reservations
- Database access to verify reservation counts

## Test Execution

1. Execute all test cases in the development environment
2. Document any issues or discrepancies
3. Fix any issues found during testing
4. Re-test to verify that the issues are resolved
5. Prepare a test report summarizing the results

## Success Criteria

The testing will be considered successful if:

1. The frontend shows 19 available slots for "imdp-e-medicina-chirurgia-mani-2" instead of 20
2. All other experiences show the correct number of available slots
3. The reservation system works correctly for all experiences
4. No new issues are introduced by the fix
5. All regression tests pass
6. Performance is not negatively impacted

## Test Report Template

```
# Slot Calculation Fix Test Report

## Test Summary
- Test Date: [Date]
- Tester: [Name]
- Environment: [Development/Staging/Production]
- Build Version: [Version]

## Test Results
- Total Test Cases: [Number]
- Passed: [Number]
- Failed: [Number]
- Blocked: [Number]

## Issues Found
1. [Issue description, severity, steps to reproduce]
2. [Issue description, severity, steps to reproduce]

## Recommendations
[Recommendations based on test results]

## Conclusion
[Overall assessment of the fix]
```

## Conclusion

This test plan provides a comprehensive approach to verifying that the slot calculation fix works correctly. By following this plan, we can ensure that the fix resolves the issue with "imdp-e-medicina-chirurgia-mani-2" without introducing new problems.