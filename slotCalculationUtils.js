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

/**
 * Extract slot number from time slot ID
 * @param {string} timeSlotId - The time slot ID
 * @returns {string} - The slot number
 */
function extractSlotNumber(timeSlotId) {
  if (!timeSlotId) return '';
  // Extract the last part after the last dash
  const parts = timeSlotId.split('-');
  return parts[parts.length - 1];
}

/**
 * Create a consistent key format for slot availability (legacy format)
 * @param {string} experienceId - The experience ID
 * @param {string} timeSlotId - The time slot ID
 * @returns {string} - The formatted key
 */
function formatSlotKey(experienceId, timeSlotId) {
  return `${experienceId}_${timeSlotId}`;
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
  extractSlotNumber,
  formatSlotKey,
  cache
};