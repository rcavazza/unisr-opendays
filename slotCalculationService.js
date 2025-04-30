/**
 * Service for standardized slot availability calculations
 */
const logger = require('./logger');
const utils = require('./slotCalculationUtils');

// Configuration flag to enable separate slot counts for numbered experience IDs
const PRESERVE_NUMBERING = true;
// Configuration flag to use direct database keys
const USE_DIRECT_KEYS = true;

/**
 * Get the number of available slots for a specific experience and time slot
 * @param {Object} db - Database instance
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<number>} - Number of available slots
 */
async function getAvailableSlots(db, experienceId, timeSlotId) {
    try {
        // Standardize IDs using utility functions with preserveNumbering flag
        const baseExperienceId = utils.standardizeExperienceId(experienceId, PRESERVE_NUMBERING);
        
        logger.info(`Getting available slots for baseExperienceId: ${baseExperienceId}`);
        
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
        logger.info(`Available slots for ${baseExperienceId}: ${availableSlots} (max: ${experience.max_participants}, current: ${experience.current_participants})`);
        
        return availableSlots;
    } catch (error) {
        logger.error(`Error in getAvailableSlots: ${error.message}`);
        throw error;
    }
}

/**
 * Check if a slot is available
 * @param {Object} db - Database instance
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<boolean>} - True if slot is available
 */
async function isSlotAvailable(db, experienceId, timeSlotId) {
    try {
        const availableSlots = await getAvailableSlots(db, experienceId, timeSlotId);
        return availableSlots > 0;
    } catch (error) {
        logger.error(`Error in isSlotAvailable: ${error.message}`);
        throw error;
    }
}

/**
 * Get the maximum number of participants for an experience
 * @param {Object} db - Database instance
 * @param {string} experienceId - Experience ID
 * @returns {Promise<number>} - Maximum number of participants
 */
async function getMaxParticipants(db, experienceId) {
    try {
        // Check cache first
        const cacheKey = `max_participants_${experienceId}`;
        const cachedValue = utils.cache.get(cacheKey);
        if (cachedValue !== null) {
            return cachedValue;
        }
        
        // Try to get max_participants for the exact experience ID first
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT max_participants FROM experiences WHERE experience_id = ?",
                [experienceId],
                (err, row) => {
                    if (err) {
                        logger.error(`Error getting max_participants: ${err.message}`);
                        reject(err);
                    } else if (!row) {
                        // If not found with exact ID, try with base ID (for backward compatibility)
                        const baseExperienceId = utils.standardizeExperienceId(experienceId, false);
                        db.get(
                            "SELECT max_participants FROM experiences WHERE experience_id LIKE ?",
                            [`${baseExperienceId}%`],
                            (err, row) => {
                                if (err) {
                                    logger.error(`Error getting max_participants with base ID: ${err.message}`);
                                    reject(err);
                                } else if (!row) {
                                    logger.warn(`No experience found with ID ${experienceId} or base ID ${baseExperienceId}`);
                                    resolve(0);
                                } else {
                                    // Cache the result for 5 minutes
                                    utils.cache.set(cacheKey, row.max_participants, 5 * 60 * 1000);
                                    resolve(row.max_participants);
                                }
                            }
                        );
                    } else {
                        // Cache the result for 5 minutes
                        utils.cache.set(cacheKey, row.max_participants, 5 * 60 * 1000);
                        resolve(row.max_participants);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in getMaxParticipants: ${error.message}`);
        throw error;
    }
}

/**
 * Get the current reservation count for an experience and time slot
 * @param {Object} db - Database instance
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @returns {Promise<number>} - Current reservation count
 */
async function getReservationCount(db, experienceId, timeSlotId) {
    try {
        // Standardize IDs using utility functions with preserveNumbering flag
        const baseExperienceId = utils.standardizeExperienceId(experienceId, PRESERVE_NUMBERING);
        const baseTimeSlotId = utils.standardizeTimeSlotId(experienceId, timeSlotId, PRESERVE_NUMBERING);
        
        // Check cache first (short TTL for reservation counts)
        const cacheKey = `reservation_count_${baseExperienceId}_${baseTimeSlotId}`;
        const cachedValue = utils.cache.get(cacheKey);
        if (cachedValue !== null) {
            return cachedValue;
        }
        
        logger.info(`Getting reservation count for baseExperienceId: ${baseExperienceId}, baseTimeSlotId: ${baseTimeSlotId}`);
        
        // Get count using the appropriate experience ID format
        const count = await new Promise((resolve, reject) => {
            db.get(
                "SELECT COUNT(*) as count FROM opend_reservations WHERE experience_id = ? AND time_slot_id = ?",
                [baseExperienceId, baseTimeSlotId],
                (err, row) => {
                    if (err) {
                        logger.error(`Error getting reservation count: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Reservation count for ${baseExperienceId}, ${baseTimeSlotId}: ${row ? row.count : 0}`);
                        resolve(row ? row.count : 0);
                    }
                }
            );
        });
        
        // Cache the result for 30 seconds
        utils.cache.set(cacheKey, count, 30 * 1000);
        
        return count;
    } catch (error) {
        logger.error(`Error in getReservationCount: ${error.message}`);
        throw error;
    }
}

/**
 * Get all available slots for all experiences
 * @param {Object} db - Database instance
 * @returns {Promise<Object>} - Object with keys in the format "experienceId:slotNumber" and values representing available slots
 */
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

module.exports = {
    getAvailableSlots,
    isSlotAvailable,
    getReservationCount,
    getAllAvailableSlots
};