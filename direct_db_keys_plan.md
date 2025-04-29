# Direct Database Keys Implementation Plan

## Current Situation

Currently, the system uses complex key formats like:
```
imdp-e-medicina-chirurgia-mani-10_imdp-e-medicina-chirurgia-mani-10-5
```

This is unnecessarily complex and redundant.

## Database Structure

In the database, the data is stored much more simply:
- `experience_id` column: Stores `imdp-e-medicina-chirurgia-mani-10`
- `time_slot_id` column: Stores `imdp-e-medicina-chirurgia-mani-10-5`

## Direct Database Keys Approach

Instead of creating complex composite keys, we'll use the database columns directly:

1. For individual slot queries, we'll pass `experience_id` and `time_slot_id` separately
2. For the slot availability map, we'll use a simpler key format that directly reflects the database structure

## Implementation Plan

### 1. Modify the `slotCalculationUtils.js` file

```javascript
/**
 * Utility functions for slot calculation
 */
const logger = require('./logger');

/**
 * Standardize an experience ID by removing any number suffix
 * @param {string} experienceId - The experience ID to standardize
 * @param {boolean} preserveNumbering - If true, preserve the numbering (for separate slot counts)
 * @returns {string} - The standardized experience ID
 */
function standardizeExperienceId(experienceId, preserveNumbering = false) {
  if (!experienceId) return '';
  
  // If preserveNumbering is true, return the original ID
  if (preserveNumbering) {
    return experienceId;
  }
  
  return experienceId.replace(/-\d+$/, '');
}

/**
 * Standardize a time slot ID to ensure it uses the base experience ID
 * @param {string} experienceId - The experience ID
 * @param {string} timeSlotId - The time slot ID
 * @param {boolean} preserveNumbering - If true, preserve the numbering (for separate slot counts)
 * @returns {string} - The standardized time slot ID
 */
function standardizeTimeSlotId(experienceId, timeSlotId, preserveNumbering = false) {
  if (!experienceId || !timeSlotId) return timeSlotId;
  
  // Use the appropriate experience ID based on preserveNumbering
  const baseExperienceId = standardizeExperienceId(experienceId, preserveNumbering);
  
  // If the time slot ID starts with the full experience ID, replace it with the base ID
  if (timeSlotId.startsWith(experienceId)) {
    return `${baseExperienceId}${timeSlotId.substring(experienceId.length)}`;
  }
  
  return timeSlotId;
}

/**
 * Create a direct database key format
 * @param {string} experienceId - The experience ID
 * @param {number|string} slotNumber - The slot number (1-5)
 * @returns {string} - The formatted key
 */
function createDirectKey(experienceId, slotNumber) {
  return `${experienceId}:${slotNumber}`;
}

/**
 * Parse a direct database key
 * @param {string} key - The key to parse
 * @returns {Object} - Object with experienceId and slotNumber
 */
function parseDirectKey(key) {
  const [experienceId, slotNumber] = key.split(':');
  return { experienceId, slotNumber };
}

// Simple in-memory cache with TTL
const cache = {
  data: {},
  ttl: {},
  
  /**
   * Set a value in the cache with a TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set(key, value, ttlMs = 60000) {
    this.data[key] = value;
    this.ttl[key] = Date.now() + ttlMs;
  },
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found or expired
   */
  get(key) {
    // Check if key exists and is not expired
    if (this.data[key] && this.ttl[key] > Date.now()) {
      return this.data[key];
    }
    
    // Delete expired key
    if (this.data[key]) {
      delete this.data[key];
      delete this.ttl[key];
    }
    
    return null;
  },
  
  /**
   * Clear all cache entries
   */
  clear() {
    this.data = {};
    this.ttl = {};
  }
};

module.exports = {
  standardizeExperienceId,
  standardizeTimeSlotId,
  createDirectKey,
  parseDirectKey,
  cache
};
```

### 2. Update the `slotCalculationService.js` file

```javascript
/**
 * Service for standardized slot availability calculations
 */
const logger = require('./logger');
const utils = require('./slotCalculationUtils');

// Configuration flag to enable separate slot counts for numbered experience IDs
const PRESERVE_NUMBERING = true;

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
        const baseTimeSlotId = utils.standardizeTimeSlotId(experienceId, timeSlotId, PRESERVE_NUMBERING);
        
        logger.info(`Getting available slots for baseExperienceId: ${baseExperienceId}, baseTimeSlotId: ${baseTimeSlotId}`);
        
        // Get max_participants for this experience
        const maxParticipants = await getMaxParticipants(db, baseExperienceId);
        
        // Get current reservation count
        const reservationCount = await getReservationCount(db, baseExperienceId, baseTimeSlotId);
        
        // Calculate available slots
        const availableSlots = Math.max(0, maxParticipants - reservationCount);
        logger.info(`Available slots for ${baseExperienceId}, ${baseTimeSlotId}: ${availableSlots} (max: ${maxParticipants}, reserved: ${reservationCount})`);
        
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
        // Get all experiences with their max_participants in a single query
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, max_participants FROM experiences",
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
        
        // Get all reservation counts in a single query
        const reservationCounts = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations GROUP BY experience_id, time_slot_id",
                (err, rows) => {
                    if (err) {
                        logger.error(`Error getting reservation counts: ${err.message}`);
                        reject(err);
                    } else {
                        const counts = {};
                        rows.forEach(row => {
                            // Extract the slot number from the time_slot_id
                            const slotNumber = row.time_slot_id.split('-').pop();
                            // Create a direct key using the database columns
                            const directKey = utils.createDirectKey(row.experience_id, slotNumber);
                            counts[directKey] = row.count;
                        });
                        resolve(counts);
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
                
                // Create a direct key using the database columns
                const directKey = utils.createDirectKey(baseExperienceId, i);
                
                // Get reservation count for the direct key
                const reservationCount = reservationCounts[directKey] || 0;
                
                // Calculate available slots
                const availableSlotCount = Number(Math.max(0, exp.max_participants - reservationCount));
                
                // Store the value with the direct key
                availableSlots[directKey] = availableSlotCount;
                
                // For backward compatibility, also store with the old key format
                const oldKey = `${baseExperienceId}_${dbTimeSlotId}`;
                availableSlots[oldKey] = availableSlotCount;
                
                logger.info(`Generated key: ${directKey} with availability: ${availableSlotCount}, reservation count: ${reservationCount}`);
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
```

### 3. Update the Frontend Code

Modify the frontend code to use the new direct key format:

```typescript
// In experienceService.ts
export const fetchExperiences = async (contactID: string, lang: string): Promise<ActivityDetails[]> => {
  try {
    // ... existing code ...
    
    const data = await response.json();
    
    // Process the data to use the direct key format
    if (data && data.length > 0) {
      data.forEach((experience: ActivityDetails) => {
        if (experience.timeSlots && experience.timeSlots.length > 0) {
          experience.timeSlots.forEach((slot) => {
            // Extract the slot number from the time slot ID
            const slotNumber = slot.id.split('-').pop();
            // Create a direct key
            slot.directKey = `${experience.id}:${slotNumber}`;
          });
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return [];
  }
};
```

## Benefits of This Approach

1. **Simplicity**: We use the database columns directly without complex transformations
2. **Clarity**: The key format is clear and directly reflects the database structure
3. **Maintainability**: The code is easier to understand and maintain
4. **Performance**: We reduce the overhead of complex key transformations

## Implementation Strategy

1. Implement the changes to the utility functions
2. Update the slot calculation service to use the direct key format
3. Test thoroughly to ensure all existing functionality works
4. Update the frontend code to use the new format
5. Gradually phase out the old key format

This approach allows us to use the database keys directly while maintaining backward compatibility with existing code.