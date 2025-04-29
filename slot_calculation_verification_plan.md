# Slot Calculation Verification Plan

## Overview

This verification plan outlines the steps to confirm that the slot calculation fix has been successfully implemented in the production environment. It focuses on verifying that the fix correctly resolves the issue with available slot counts for "imdp-e-medicina-chirurgia-mani-2" while ensuring that the overall system continues to function properly.

## Verification Timeline

- **Pre-Deployment Verification**: Before deploying the fix to production
- **Immediate Post-Deployment Verification**: Immediately after deploying the fix
- **Extended Verification**: 24-48 hours after deployment
- **Final Verification**: One week after deployment

## Verification Steps

### Pre-Deployment Verification

1. **Baseline Measurement**
   - Document the current available slot count for "imdp-e-medicina-chirurgia-mani-2" in production
   - Expected: 20 available slots (incorrect)
   - Document the current available slot counts for at least 5 other experiences
   - Take screenshots of the frontend showing these counts

2. **Database Verification**
   - Query the database to confirm the actual values:
     ```sql
     SELECT experience_id, max_participants, current_participants 
     FROM experiences 
     WHERE experience_id = 'imdp-e-medicina-chirurgia-mani-2';
     ```
   - Expected: max_participants=20, current_participants=1
   - Query the reservation counts:
     ```sql
     SELECT experience_id, time_slot_id, COUNT(*) as count 
     FROM opend_reservations 
     WHERE experience_id = 'imdp-e-medicina-chirurgia-mani-2' 
     GROUP BY experience_id, time_slot_id;
     ```
   - Document the results for comparison after deployment

### Immediate Post-Deployment Verification

1. **Slot Count Verification**
   - Check the available slot count for "imdp-e-medicina-chirurgia-mani-2" in production
   - Expected: 19 available slots (correct)
   - Take a screenshot of the frontend showing the corrected count

2. **API Response Verification**
   - Use the `/api/get_raw_slots` endpoint to verify the raw slot data
   - Check that the response includes the correct available slot count for "imdp-e-medicina-chirurgia-mani-2"
   - Expected: The API should return 19 available slots

3. **Other Experiences Verification**
   - Check the available slot counts for the same 5 experiences documented in pre-deployment
   - Verify that they show the correct counts based on database values
   - Take screenshots for documentation

4. **Reservation Functionality Verification**
   - Make a test reservation for "imdp-e-medicina-chirurgia-mani-2"
   - Verify that the available slot count decreases to 18
   - Cancel the test reservation
   - Verify that the available slot count increases back to 19

5. **Error Logging Verification**
   - Check the server logs for any errors or warnings related to slot calculation
   - Verify that the fix is working as expected without generating errors

### Extended Verification (24-48 hours)

1. **User Feedback Monitoring**
   - Monitor user feedback channels for any reports of issues with slot availability
   - Address any reported issues promptly

2. **System Stability Verification**
   - Monitor system performance metrics
   - Verify that the fix has not introduced any performance issues
   - Check error logs for any new errors related to slot calculation

3. **Reservation Data Integrity**
   - Verify that new reservations are being correctly recorded in the database
   - Check that available slot counts are being correctly updated for all experiences

### Final Verification (One Week)

1. **Comprehensive Slot Count Verification**
   - Verify the available slot counts for all experiences
   - Compare with the expected counts based on database values
   - Document any discrepancies

2. **Long-term Stability Assessment**
   - Review system logs for the past week
   - Verify that there have been no errors or issues related to slot calculation
   - Confirm that the fix has been stable in production

3. **User Experience Assessment**
   - Gather feedback from users about their experience with the reservation system
   - Verify that there have been no reports of issues with slot availability

## Verification Documentation

For each verification step, document the following:

- Date and time of verification
- Name of the person performing the verification
- Expected result
- Actual result
- Screenshots or other evidence
- Any issues or discrepancies found
- Actions taken to address issues

## Verification Report Template

```
# Slot Calculation Fix Verification Report

## Verification Summary
- Verification Date: [Date]
- Verifier: [Name]
- Environment: Production
- Build Version: [Version]

## Pre-Deployment Baseline
- "imdp-e-medicina-chirurgia-mani-2" available slots: [Number]
- Database values: max_participants=[Number], current_participants=[Number]
- Reservation count: [Number]

## Post-Deployment Results
- "imdp-e-medicina-chirurgia-mani-2" available slots: [Number]
- API response: [JSON snippet]
- Other experiences verified: [List]
- Reservation functionality: [Pass/Fail]
- Error logs: [Clean/Issues found]

## Extended Verification Results
- User feedback: [Summary]
- System stability: [Assessment]
- Data integrity: [Assessment]

## Final Verification Results
- Comprehensive slot count verification: [Pass/Fail]
- Long-term stability: [Assessment]
- User experience: [Summary]

## Issues Found
1. [Issue description, severity, resolution]
2. [Issue description, severity, resolution]

## Conclusion
[Overall assessment of the fix in production]
```

## Success Criteria

The verification will be considered successful if:

1. The frontend shows 19 available slots for "imdp-e-medicina-chirurgia-mani-2" instead of 20
2. All other experiences show the correct number of available slots
3. The reservation system works correctly for all experiences
4. No new issues are introduced by the fix
5. The system remains stable over the extended verification period
6. No user complaints are received about incorrect slot availability

## Rollback Criteria

Consider rolling back the fix if:

1. The fix does not correct the slot count for "imdp-e-medicina-chirurgia-mani-2"
2. The fix causes incorrect slot counts for other experiences
3. The fix introduces new errors or issues in the reservation system
4. The system becomes unstable after deploying the fix
5. Users report significant issues with slot availability

## Conclusion

This verification plan provides a structured approach to confirming that the slot calculation fix works correctly in production. By following this plan, we can ensure that the fix resolves the issue with "imdp-e-medicina-chirurgia-mani-2" without introducing new problems, and that the system remains stable over time.