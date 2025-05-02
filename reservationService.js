/**
 * Service for managing reservations
 */
const logger = require('./logger');
const slotCalculationService = require('./slotCalculationService');

/**
 * Save a new reservation
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @param {string} qrCodeUrl - QR code URL (optional)
 * @returns {Promise<boolean>} - Success status
 */
async function saveReservation(db, contactId, experienceId, timeSlotId, qrCodeUrl = null, replaceAll = false) {
    try {
        logger.info(`Saving reservation for contact ${contactId}, experience ${experienceId} (this should be the dbId of the slot), time slot ${timeSlotId}`);
        
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
            
            // Note: We don't need to decrement current_participants here
            // because that will be handled by the /api/reserve endpoint
            
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

/**
 * Get reservations for a contact
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @returns {Promise<Array>} - Array of reservations
 */
async function getReservationsForContact(db, contactId) {
    try {
        logger.info(`Getting reservations for contact ${contactId}`);
        
        return new Promise((resolve, reject) => {
            db.all(
                "SELECT * FROM opend_reservations WHERE contact_id = ?",
                [contactId],
                (err, rows) => {
                    if (err) {
                        logger.error(`Error getting reservations: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Found ${rows.length} reservations for contact ${contactId}`);
                        
                        // Log dettagliato per ogni prenotazione
                        rows.forEach((row, index) => {
                            logger.info(`Reservation ${index + 1}: experience_id=${row.experience_id} (type: ${typeof row.experience_id}), time_slot_id=${row.time_slot_id}`);
                            
                            // Assicurati che experience_id sia un numero
                            if (typeof row.experience_id === 'string') {
                                row.experience_id = parseInt(row.experience_id, 10);
                                logger.info(`Converted experience_id to number: ${row.experience_id}`);
                            }
                        });
                        
                        resolve(rows);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in getReservationsForContact: ${error.message}`);
        throw error;
    }
}

/**
 * Get reservation counts for all time slots
 * @param {Object} db - Database instance
 * @returns {Promise<Object>} - Object with time slot IDs as keys and counts as values
 */
async function getReservationCounts(db) {
    try {
        logger.info('Getting reservation counts for all time slots');
        
        return new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations GROUP BY experience_id, time_slot_id",
                [],
                (err, rows) => {
                    if (err) {
                        logger.error(`Error getting reservation counts: ${err.message}`);
                        reject(err);
                    } else {
                        const counts = {};
                        rows.forEach(row => {
                            const key = `${row.experience_id}_${row.time_slot_id}`;
                            counts[key] = row.count;
                        });
                        logger.info(`Found counts for ${rows.length} time slots`);
                        resolve(counts);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in getReservationCounts: ${error.message}`);
        throw error;
    }
}

/**
 * Check if a slot is available
 * @param {Object} db - Database instance
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<boolean>} - True if the slot is available, false otherwise
 */
async function isSlotAvailable(db, experienceId, timeSlotId) {
    try {
        logger.info(`Checking availability for experience ${experienceId}, time slot ${timeSlotId}`);
        
        // Use the slot calculation service to check availability
        return slotCalculationService.isSlotAvailable(db, experienceId, timeSlotId);
    } catch (error) {
        logger.error(`Error in isSlotAvailable: ${error.message}`);
        throw error;
    }
}

/**
 * Update QR code URL for a reservation
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @param {string} experienceId - Experience ID
 * @param {string} qrCodeUrl - QR code URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateQrCodeUrl(db, contactId, experienceId, qrCodeUrl) {
    try {
        logger.info(`Updating QR code URL for contact ${contactId}, experience ${experienceId}`);
        
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE opend_reservations SET qr_code_url = ? WHERE contact_id = ? AND experience_id = ?",
                [qrCodeUrl, contactId, experienceId],
                (err) => {
                    if (err) {
                        logger.error(`Error updating QR code URL: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Updated QR code URL for contact ${contactId}, experience ${experienceId}`);
                        resolve(true);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in updateQrCodeUrl: ${error.message}`);
        throw error;
    }
}

/**
 * Cancel a reservation
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<boolean>} - True if the reservation was canceled, false otherwise
 */
async function cancelReservation(db, contactId, experienceId, timeSlotId) {
    try {
        logger.info(`Canceling reservation for contact ${contactId}, experience ${experienceId}, time slot ${timeSlotId}`);
        
        return new Promise((resolve, reject) => {
            db.run(
                "DELETE FROM opend_reservations WHERE contact_id = ? AND experience_id = ? AND time_slot_id = ?",
                [contactId, experienceId, timeSlotId],
                function(err) {
                    if (err) {
                        logger.error(`Error canceling reservation: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Reservation canceled successfully, rows affected: ${this.changes}`);
                        resolve(this.changes > 0);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in cancelReservation: ${error.message}`);
        throw error;
    }
}

/**
 * Delete all reservations for a contact
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteAllReservationsForContact(db, contactId) {
    try {
        logger.info(`Deleting all reservations for contact ${contactId}`);
        
        return new Promise((resolve, reject) => {
            db.run(
                "DELETE FROM opend_reservations WHERE contact_id = ?",
                [contactId],
                function(err) {
                    if (err) {
                        logger.error(`Error deleting reservations: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Deleted ${this.changes} reservations for contact ${contactId}`);
                        resolve(true);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in deleteAllReservationsForContact: ${error.message}`);
        throw error;
    }
}

module.exports = {
    saveReservation,
    getReservationsForContact,
    getReservationCounts,
    updateQrCodeUrl,
    isSlotAvailable,
    cancelReservation,
    deleteAllReservationsForContact
};