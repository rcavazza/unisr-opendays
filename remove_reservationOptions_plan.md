# Plan to Remove reservationOptions.json References

## Overview

The `reservationOptions.json` file is outdated and no longer used in the system. This document outlines a plan to safely remove all references to this file from the codebase, ensuring that the system continues to function correctly after these changes.

## Step 1: Identify All References to reservationOptions.json

First, we need to identify all places in the codebase where `reservationOptions.json` is referenced. This includes:

1. Direct imports or requires of the file
2. References to variables or objects that might be loaded from this file
3. Functions that use data from this file

We can use the following search patterns:
- `reservationOptions`
- `require.*reservationOptions`
- `import.*reservationOptions`
- `fs.readFile.*reservationOptions`

## Step 2: Understand the Current Usage

For each reference found, we need to understand:

1. What data is being used from the file
2. How that data is being used in the application
3. Where that data should come from after removing the file

The most critical information to identify is:
- How maximum capacity for experiences/time slots is determined
- How available spots are calculated
- What other configuration data might be stored in this file

## Step 3: Identify the Source of Truth

Before removing references, we need to confirm:

1. Where the maximum capacity for experiences/time slots is now stored
2. How the system should calculate available spots without this file
3. Where any other configuration data from this file is now stored

## Step 4: Create a Removal Plan for Each Reference

For each reference to `reservationOptions.json`, we need to:

1. Determine if the reference can be simply removed or needs to be replaced
2. If it needs to be replaced, identify the correct data source to use instead
3. Plan the code changes needed

### Common Replacement Patterns

Based on our understanding of the system, here are likely replacement patterns:

1. **For Maximum Capacity**:
   - Replace with database queries to get capacity from the experiences or time_slots table
   - Example: `const maxCapacity = reservationOptions.limits[slotKey]` might become:
     ```javascript
     const maxCapacity = await db.get(
       "SELECT max_capacity FROM time_slots WHERE id = ?", 
       [slotId]
     ).max_capacity;
     ```

2. **For Reservation Counting**:
   - Keep the existing queries that count reservations from the `opend_reservations` table
   - Example:
     ```javascript
     const reservationCount = await db.get(
       "SELECT COUNT(*) as count FROM opend_reservations WHERE experience_id = ? AND time_slot_id = ?",
       [experienceId, timeSlotId]
     ).count;
     ```

3. **For Available Spots Calculation**:
   - Replace calculations that use `reservationOptions.limits` with calculations that use the database
   - Example: `available = reservationOptions.limits[key] - count` might become:
     ```javascript
     const maxCapacity = await db.get(
       "SELECT max_capacity FROM time_slots WHERE id = ?", 
       [timeSlotId]
     ).max_capacity;
     
     const reservationCount = await db.get(
       "SELECT COUNT(*) as count FROM opend_reservations WHERE experience_id = ? AND time_slot_id = ?",
       [experienceId, timeSlotId]
     ).count;
     
     const available = maxCapacity - reservationCount;
     ```

## Step 5: Implementation Plan

1. **Create a Backup**:
   - Create a backup of the current codebase
   - Ensure the database schema is documented

2. **Update Code in Stages**:
   - Start with the most isolated references that have minimal impact
   - Progress to more complex or interconnected references
   - For each change:
     - Update the code
     - Test the specific functionality
     - Ensure no regressions

3. **Update the Following Files** (based on our understanding):
   - `server.js`: Remove imports and references to reservationOptions.json
   - `reservationService.js`: Update the `isSlotAvailable` function to get capacity from the database
   - `remainingSlots.js`: Update to get limits from the database instead of the JSON file
   - Any other files identified in Step 1

4. **Remove the File**:
   - Once all references have been updated or removed, delete the `reservationOptions.json` file

## Step 6: Testing Plan

1. **Unit Tests**:
   - Test each modified function to ensure it works correctly with the new data source

2. **Integration Tests**:
   - Test the reservation flow end-to-end
   - Verify that available spots are calculated correctly
   - Ensure that the UI displays the correct number of available spots

3. **Regression Testing**:
   - Test all features that might be affected by these changes
   - Verify that the system behaves the same way before and after the changes

## Step 7: Documentation

1. **Update Documentation**:
   - Update any documentation that references `reservationOptions.json`
   - Document the new source of truth for maximum capacity and other configuration data

2. **Create Migration Notes**:
   - Document the changes made for future reference
   - Note any potential issues or edge cases to watch for

## Conclusion

By following this plan, we can safely remove all references to the outdated `reservationOptions.json` file while ensuring that the system continues to function correctly. This will simplify the codebase and make it more maintainable by removing deprecated code.

Once this task is complete, we can proceed to address the discrepancy between manage_experiences.js and the UI to ensure consistent display of available spots throughout the system.