# Simplified Key Format Plan

## Current Key Format Issue

The current system uses complex keys like:
```
imdp-e-medicina-chirurgia-mani-10_imdp-e-medicina-chirurgia-mani-10-5
```

This is composed of:
- Experience ID: `imdp-e-medicina-chirurgia-mani-10`
- Underscore: `_`
- Time Slot ID: `imdp-e-medicina-chirurgia-mani-10-5`

The time slot ID contains the experience ID again, followed by a dash and a number (5 in this case). This creates unnecessary redundancy and complexity.

## Database Structure

In the database, the data is stored much more simply:
- `experience_id` column: Stores `imdp-e-medicina-chirurgia-mani-10`
- `time_slot_id` column: Stores `imdp-e-medicina-chirurgia-mani-10-5`

When querying the database, we use these columns directly:
```sql
SELECT COUNT(*) as count FROM opend_reservations 
WHERE experience_id = ? AND time_slot_id = ?
```

## Simplified Approach

We can simplify this by using a more straightforward key format:

```
experienceId_slotNumber
```

For example: `imdp-e-medicina-chirurgia-mani-10_5`

This would be much cleaner while still maintaining uniqueness.

## Implementation Plan

### 1. Modify the `formatSlotKey` function

```javascript
/**
 * Create a consistent key format for slot availability
 * @param {string} experienceId - The experience ID
 * @param {string} timeSlotId - The time slot ID
 * @param {boolean} useSimpleFormat - Whether to use the simplified format
 * @returns {string} - The formatted key
 */
function formatSlotKey(experienceId, timeSlotId, useSimpleFormat = true) {
  if (useSimpleFormat) {
    // Extract just the slot number (the last number after the last dash)
    const slotNumber = timeSlotId.split('-').pop();
    return `${experienceId}_${slotNumber}`;
  }
  
  // Original complex format
  return `${experienceId}_${timeSlotId}`;
}
```

### 2. Update the `createCompatibleKeys` function

```javascript
/**
 * Create all necessary key formats for backward compatibility
 * @param {string} experienceId - The original experience ID
 * @param {string} timeSlotId - The time slot ID
 * @param {boolean} preserveNumbering - If true, preserve the numbering
 * @param {boolean} useSimpleFormat - Whether to use the simplified format
 * @returns {Object} - Object with keys in different formats
 */
function createCompatibleKeys(experienceId, timeSlotId, preserveNumbering = false, useSimpleFormat = true) {
  const baseExperienceId = standardizeExperienceId(experienceId, preserveNumbering);
  const baseTimeSlotId = standardizeTimeSlotId(experienceId, timeSlotId, preserveNumbering);
  
  // Database key format (primary format)
  const dbKey = formatSlotKey(baseExperienceId, baseTimeSlotId, false);
  
  // Simple key format (new format)
  const simpleKey = formatSlotKey(baseExperienceId, baseTimeSlotId, true);
  
  // Original key format (for backward compatibility)
  const originalKey = formatSlotKey(experienceId, timeSlotId, false);
  
  // Collect all unique keys
  const allKeys = new Set([dbKey, originalKey]);
  if (useSimpleFormat) {
    allKeys.add(simpleKey);
  }
  
  return {
    dbKey,
    simpleKey,
    originalKey,
    allKeys: Array.from(allKeys)
  };
}
```

### 3. Update the `getAllAvailableSlots` function

Modify the function to use the new simple key format when returning data to the frontend:

```javascript
// In getAllAvailableSlots function
const availableSlots = {};

// ... existing code ...

// Store the same value for all key formats (for backward compatibility)
keys.allKeys.forEach(key => {
  availableSlots[key] = availableSlotCount;
});

// Also store with the simple key format for new frontend code
const simpleKey = utils.formatSlotKey(baseExperienceId, dbTimeSlotId, true);
availableSlots[simpleKey] = availableSlotCount;
```

### 4. Update the Frontend Code

Modify the frontend code to use the new simple key format when making reservations:

```typescript
// In experienceService.ts
export const makeReservation = async (
  contactID: string,
  experienceId: string | number,
  timeSlotId: string
): Promise<{ success: boolean, error?: string, errorCode?: string }> => {
  try {
    // Extract just the slot number for the API
    const slotNumber = timeSlotId.split('-').pop();
    
    console.log('Making reservation:', { contactID, experienceId, timeSlotId, slotNumber });
    const response = await fetch(' /api/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactID,
        experienceId,
        timeSlotId: `${experienceId}-${slotNumber}` // Simplified time slot ID
      })
    });
    
    // ... rest of the function ...
  }
};
```

## Benefits of This Approach

1. **Simpler Keys**: The keys are much more readable and manageable
2. **Reduced Redundancy**: We eliminate the duplication of the experience ID
3. **Backward Compatibility**: We maintain support for the old key format
4. **No Database Changes**: We don't need to modify the database schema

## Implementation Strategy

1. First, implement the changes to the utility functions
2. Update the slot calculation service to use the new format while maintaining backward compatibility
3. Test thoroughly to ensure all existing functionality works
4. Gradually update frontend code to use the new format
5. After a transition period, we can consider removing support for the old format

This approach allows us to simplify the key format without breaking existing functionality.