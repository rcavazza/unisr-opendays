# Plan to Fix Reservation System

## Overview

Based on the analysis of the codebase, we need to implement a solution where:

1. The `opend_reservations` table continues to save individual reservations
2. The `current_participants` field in the `experiences` table is the only thing used for counting available slots
3. The `current_participants` field is properly updated when reservations are made or canceled

## Current Issues

1. The `/api/reserve` endpoint no longer updates the `current_participants` field
2. Some parts of the code still use the `current_participants` field to calculate available slots
3. Other parts of the code use the reservation counts from the `opend_reservations` table

## Solution Plan

### 1. Update the `/api/reserve` Endpoint

Modify the `/api/reserve` endpoint in `server.js` to update the `current_participants` field when a reservation is made:

```javascript
// Endpoint to make a reservation
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
        await experiencesService.incrementParticipantCount(db, experienceId);
        
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

### 2. Update the `/api/cancel-reservation` Endpoint

Similarly, modify the `/api/cancel-reservation` endpoint to decrement the `current_participants` field when a reservation is canceled:

```javascript
// Endpoint to cancel a reservation
app.post('/api/cancel-reservation', async (req, res) => {
    const { contactID, experienceId, timeSlotId } = req.body;
    
    if (!contactID || !experienceId || !timeSlotId) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Use the new cancelReservation function from reservationService
        await reservationService.cancelReservation(db, contactID, experienceId, timeSlotId);
        
        // Decrement the current_participants field in the experiences table
        await experiencesService.decrementParticipantCount(db, experienceId);
        
        // Update the remaining slots
        await updateRemainingSlots();
        
        // Return success
        res.json({
            success: true
        });
    } catch (error) {
        logger.error('Error in /api/cancel-reservation:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
```

### 3. Update the `slotCalculationService.js` File

Modify the `getAvailableSlots` function in `slotCalculationService.js` to use only the `current_participants` field for calculating available slots:

```javascript
async function getAvailableSlots(db, experienceId, timeSlotId) {
    try {
        // Standardize IDs using utility functions with preserveNumbering flag
        const baseExperienceId = utils.standardizeExperienceId(experienceId, PRESERVE_NUMBERING);
        const baseTimeSlotId = utils.standardizeTimeSlotId(experienceId, timeSlotId, PRESERVE_NUMBERING);
        
        logger.info(`Getting available slots for baseExperienceId: ${baseExperienceId}, baseTimeSlotId: ${baseTimeSlotId}`);
        
        // Get max_participants and current_participants for this experience
        const experience = await new Promise((resolve, reject) => {
            db.get(
                "SELECT max_participants, current_participants FROM experiences WHERE experience_id = ?",
                [baseExperienceId],
                (err, row) => {
                    if (err) {
                        logger.error(`Error getting experience details: ${err.message}`);
                        reject(err);
                    } else if (!row) {
                        logger.warn(`No experience found with ID ${baseExperienceId}`);
                        resolve({ max_participants: 0, current_participants: 0 });
                    } else {
                        resolve(row);
                    }
                }
            );
        });
        
        // Calculate available slots based on current_participants
        const availableSlots = Math.max(0, experience.max_participants - experience.current_participants);
        logger.info(`Available slots for ${baseExperienceId}, ${baseTimeSlotId}: ${availableSlots} (max: ${experience.max_participants}, current: ${experience.current_participants})`);
        
        return availableSlots;
    } catch (error) {
        logger.error(`Error in getAvailableSlots: ${error.message}`);
        throw error;
    }
}
```

### 4. Update the `getAllAvailableSlots` Function

Similarly, modify the `getAllAvailableSlots` function to use only the `current_participants` field:

```javascript
async function getAllAvailableSlots(db) {
    try {
        // Get all experiences with their max_participants and current_participants in a single query
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, max_participants, current_participants FROM experiences",
                (err, rows) => {
                    if (err) {
                        logger.error(`Error getting experiences: ${err.message}`);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        // Calculate available slots for each experience and time slot
        const availableSlots = {};
        
        for (const exp of experiences) {
            // Standardize the experience ID based on the configuration
            const baseExperienceId = utils.standardizeExperienceId(exp.experience_id, PRESERVE_NUMBERING);
            
            // Assume up to 5 time slots per experience
            for (let i = 1; i <= 5; i++) {
                // Create the time slot ID
                const dbTimeSlotId = `${baseExperienceId}-${i}`;
                
                // Calculate available slots based on current_participants
                const availableSlotCount = Number(Math.max(0, exp.max_participants - exp.current_participants));
                
                if (USE_DIRECT_KEYS) {
                    // Create a direct key using the database columns
                    const directKey = utils.createDirectKey(baseExperienceId, i);
                    availableSlots[directKey] = availableSlotCount;
                    
                    // For backward compatibility, also store with the old key format
                    const oldKey = utils.formatSlotKey(baseExperienceId, dbTimeSlotId);
                    availableSlots[oldKey] = availableSlotCount;
                    
                    // For backward compatibility with numbered IDs
                    const originalKey = utils.formatSlotKey(exp.experience_id, `${exp.experience_id}-${i}`);
                    if (originalKey !== oldKey) {
                        availableSlots[originalKey] = availableSlotCount;
                    }
                    
                    logger.info(`Generated key: ${directKey} with availability: ${availableSlotCount}, current_participants: ${exp.current_participants}`);
                } else {
                    // Legacy approach
                    const dbKey = utils.formatSlotKey(baseExperienceId, dbTimeSlotId);
                    availableSlots[dbKey] = availableSlotCount;
                    
                    // For backward compatibility with numbered IDs
                    const originalKey = utils.formatSlotKey(exp.experience_id, `${exp.experience_id}-${i}`);
                    if (originalKey !== dbKey) {
                        availableSlots[originalKey] = availableSlotCount;
                    }
                    
                    logger.info(`Generated key: ${dbKey} with availability: ${availableSlotCount}, current_participants: ${exp.current_participants}`);
                }
            }
        }
        
        return availableSlots;
    } catch (error) {
        logger.error(`Error in getAllAvailableSlots: ${error.message}`);
        throw error;
    }
}
```

### 5. Update the `isSlotAvailable` Function

Update the `isSlotAvailable` function to use the `getAvailableSlots` function:

```javascript
async function isSlotAvailable(db, experienceId, timeSlotId) {
    try {
        const availableSlots = await getAvailableSlots(db, experienceId, timeSlotId);
        return availableSlots > 0;
    } catch (error) {
        logger.error(`Error in isSlotAvailable: ${error.message}`);
        throw error;
    }
}
```

### 6. Run the `sync_participants.js` Script

Before deploying these changes, run the `sync_participants.js` script to ensure that the `current_participants` field is in sync with the actual reservation counts:

```bash
node sync_participants.js
```

This will update the `current_participants` field in the `experiences` table to match the actual reservation counts in the `opend_reservations` table.

### 7. Update the `saveReservation` Function in `reservationService.js`

Modify the `saveReservation` function to handle the case where `replaceAll` is true:

```javascript
async function saveReservation(db, contactId, experienceId, timeSlotId, qrCodeUrl = null, replaceAll = false) {
    try {
        logger.info(`Saving reservation for contact ${contactId}, experience ${experienceId}, time slot ${timeSlotId}`);
        
        // If replaceAll is true, delete all existing reservations for this contact
        if (replaceAll) {
            logger.info(`Deleting all existing reservations for contact ${contactId}`);
            
            // Get all existing reservations for this contact
            const existingReservations = await new Promise((resolve, reject) => {
                db.all(
                    "SELECT experience_id FROM opend_reservations WHERE contact_id = ?",
                    [contactId],
                    (err, rows) => {
                        if (err) {
                            logger.error(`Error getting existing reservations: ${err.message}`);
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    }
                );
            });
            
            // Decrement current_participants for each existing reservation
            for (const reservation of existingReservations) {
                await experiencesService.decrementParticipantCount(db, reservation.experience_id);
            }
            
            // Delete all existing reservations
            await deleteAllReservationsForContact(db, contactId);
            
            // Create new reservation
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO opend_reservations (contact_id, experience_id, time_slot_id, qr_code_url) VALUES (?, ?, ?, ?)",
                    [contactId, experienceId, timeSlotId, qrCodeUrl],
                    (err) => {
                        if (err) {
                            logger.error(`Error creating reservation: ${err.message}`);
                            reject(err);
                        } else {
                            logger.info(`Created reservation for contact ${contactId}, experience ${experienceId}`);
                            resolve();
                        }
                    }
                );
            });
        } else {
            // Check if a reservation already exists for this contact and experience
            const existingReservation = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT id FROM opend_reservations WHERE contact_id = ? AND experience_id = ?",
                    [contactId, experienceId],
                    (err, row) => {
                        if (err) {
                            logger.error(`Error checking existing reservation: ${err.message}`);
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    }
                );
            });
            
            if (existingReservation) {
                // Update existing reservation
                await new Promise((resolve, reject) => {
                    db.run(
                        "UPDATE opend_reservations SET time_slot_id = ?, qr_code_url = ?, created_at = CURRENT_TIMESTAMP WHERE contact_id = ? AND experience_id = ?",
                        [timeSlotId, qrCodeUrl, contactId, experienceId],
                        (err) => {
                            if (err) {
                                logger.error(`Error updating reservation: ${err.message}`);
                                reject(err);
                            } else {
                                logger.info(`Updated reservation for contact ${contactId}, experience ${experienceId}`);
                                resolve();
                            }
                        }
                    );
                });
            } else {
                // Create new reservation
                await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO opend_reservations (contact_id, experience_id, time_slot_id, qr_code_url) VALUES (?, ?, ?, ?)",
                        [contactId, experienceId, timeSlotId, qrCodeUrl],
                        (err) => {
                            if (err) {
                                logger.error(`Error creating reservation: ${err.message}`);
                                reject(err);
                            } else {
                                logger.info(`Created reservation for contact ${contactId}, experience ${experienceId}`);
                                resolve();
                            }
                        }
                    );
                });
            }
        }
        
        return true;
    } catch (error) {
        logger.error(`Error in saveReservation: ${error.message}`);
        throw error;
    }
}
```

## Implementation Steps

1. Update the `slotCalculationService.js` file with the modified functions
2. Update the `/api/reserve` endpoint in `server.js`
3. Update the `/api/cancel-reservation` endpoint in `server.js`
4. Update the `saveReservation` function in `reservationService.js`
5. Run the `sync_participants.js` script to synchronize the `current_participants` field
6. Restart the server
7. Test the system by making reservations and cancellations

## Expected Outcome

After implementing these changes:

1. The `opend_reservations` table will continue to save individual reservations
2. The `current_participants` field in the `experiences` table will be the only thing used for counting available slots
3. The `current_participants` field will be properly updated when reservations are made or canceled
4. The system will consistently use the `current_participants` field to calculate available slots

This will ensure that the data is properly saved when submitting from "/front" and that the available slot counts are accurate.