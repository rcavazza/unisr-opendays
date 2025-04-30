# Plan to Fix Data Submission from "/front"

## Issue Identified

When submitting data from the "/front" path, the data is not being saved to the database. After investigating the code, I've identified the following issues:

1. The system has been refactored to use the `opend_reservations` table for tracking reservations instead of updating the `current_participants` field in the `experiences` table directly.
2. However, there might be inconsistencies in how the experience IDs are being handled between the frontend and backend.

## Data Flow Analysis

### Frontend Submission Process
1. The user selects experiences and time slots in the `OpenDayRegistration` component
2. When the user submits the form, the `handleSubmit` function is called
3. For each selected time slot, the `makeReservation` function is called
4. After all reservations are made, the `updateSelectedExperiences` function is called

### Backend Processing
1. The `/api/reserve` endpoint receives the reservation request
2. It checks if the slot is available using `reservationService.isSlotAvailable`
3. It saves the reservation using `reservationService.saveReservation`
4. It updates the remaining slots using `updateRemainingSlots`
5. The `/api/update-selected-experiences` endpoint receives the request to update the HubSpot contact
6. It updates the HubSpot contact property and sends a confirmation email

### Database Operations
1. The `saveReservation` function inserts or updates records in the `opend_reservations` table
2. The `getAllAvailableSlots` function queries both the `experiences` table and the `opend_reservations` table
3. The `experiences` table is not being updated with the current number of participants

## Potential Issues

1. **Experience ID Standardization**: The `standardizeExperienceId` function in slotCalculationUtils.js might be causing inconsistencies in how experience IDs are handled.
2. **Missing Database Updates**: The `current_participants` field in the `experiences` table is not being updated, which might be causing issues with slot availability calculations.
3. **Incorrect Function Calls**: The functions that are supposed to update the database might not be called correctly.

## Solution Plan

### 1. Fix Experience ID Handling

Ensure that experience IDs are handled consistently throughout the codebase:

```javascript
// In slotCalculationUtils.js
function standardizeExperienceId(experienceId, preserveNumbering = false) {
  if (!experienceId) return '';
  
  // If preserveNumbering is true, return the original ID
  if (preserveNumbering) {
    return String(experienceId); // Ensure it's a string
  }
  
  return String(experienceId).replace(/-\d+$/, '');
}
```

### 2. Update the Database Operations

Add code to update the `current_participants` field in the `experiences` table:

```javascript
// In reservationService.js
async function saveReservation(db, contactId, experienceId, timeSlotId, qrCodeUrl = null, replaceAll = false) {
  try {
    logger.info(`Saving reservation for contact ${contactId}, experience ${experienceId}, time slot ${timeSlotId}`);
    
    // ... existing code ...
    
    // Update the current_participants field in the experiences table
    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id = ?",
        [experienceId],
        (err) => {
          if (err) {
            logger.error(`Error updating current_participants: ${err.message}`);
            reject(err);
          } else {
            logger.info(`Updated current_participants for experience ${experienceId}`);
            resolve();
          }
        }
      );
    });
    
    return true;
  } catch (error) {
    logger.error(`Error in saveReservation: ${error.message}`);
    throw error;
  }
}
```

### 3. Fix the `/api/reserve` Endpoint

Update the `/api/reserve` endpoint to ensure it's updating the database correctly:

```javascript
// In server.js
app.post('/api/reserve', async (req, res) => {
  const { contactID, experienceId, timeSlotId, replaceAll } = req.body;
  
  if (!contactID || !experienceId || !timeSlotId) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }
  
  try {
    // Check if the slot is still available
    const isAvailable = await reservationService.isSlotAvailable(db, experienceId, timeSlotId);
    
    if (!isAvailable) {
      // No spots available, return an error
      logger.warn(`No spots available for experience ${experienceId}, time slot ${timeSlotId}`);
      return res.status(409).json({
        success: false,
        error: 'No spots available',
        errorCode: 'NO_SPOTS_AVAILABLE'
      });
    }
    
    // Save the reservation
    await reservationService.saveReservation(db, contactID, experienceId, timeSlotId, null, replaceAll);
    
    // Update the current_participants field in the experiences table
    await experiencesService.incrementParticipants(db, experienceId);
    
    // Update the remaining slots
    await updateRemainingSlots();
    
    // Return success
    res.json({
      success: true
    });
  } catch (error) {
    logger.error('Error in /api/reserve:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});
```

### 4. Add Logging for Debugging

Add more logging to help identify where the issue is occurring:

```javascript
// In reservationService.js
async function saveReservation(db, contactId, experienceId, timeSlotId, qrCodeUrl = null, replaceAll = false) {
  try {
    logger.info(`Saving reservation for contact ${contactId}, experience ${experienceId}, time slot ${timeSlotId}`);
    logger.info(`Experience ID type: ${typeof experienceId}, value: ${experienceId}`);
    
    // ... existing code ...
    
    return true;
  } catch (error) {
    logger.error(`Error in saveReservation: ${error.message}`);
    throw error;
  }
}
```

## Implementation Steps

1. Switch to Code mode to implement the changes
2. Update the `standardizeExperienceId` function in slotCalculationUtils.js
3. Update the `saveReservation` function in reservationService.js
4. Update the `/api/reserve` endpoint in server.js
5. Add logging for debugging
6. Restart the server
7. Test the submission process from "/front"

## Expected Outcome

After implementing these changes:
1. The data will be properly saved to the database when submitting from "/front"
2. The `current_participants` field in the `experiences` table will be updated correctly
3. The slot availability calculations will work correctly