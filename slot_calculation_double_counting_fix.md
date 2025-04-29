# Slot Calculation Double-Counting Fix

## Problem

There's a discrepancy in the slot counting for experiences:
- The database shows correct available slots (e.g., 20 for experience ID 71)
- The frontend displays 1 less available slot (e.g., 19 for experience ID 71)

## Root Cause

The issue is that **reservation counts are being double-counted** in the slot availability calculation:

1. In `courseExperienceService.js`, the initial available slots are calculated as:
   ```javascript
   available: Math.max(0, row.max_participants - row.current_participants)
   ```
   This already accounts for reservations through the `current_participants` field.

2. Later in the same file, the available slots are adjusted again based on reservation counts:
   ```javascript
   slot.available = Math.max(0, originalAvailable - reservationCount)
   ```
   This subtracts the reservation count a second time.

3. The `current_participants` field is being updated when reservations are made:
   ```javascript
   "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id = ?"
   ```

For experience ID 71:
- If `max_participants` is 20 and `current_participants` is 0, the initial available slots would be 20.
- If there's 1 reservation in the `opend_reservations` table, the reservation count would be 1.
- The final available slots would be 19 (20 - 1), even though the database shows 20 available slots.

## Solution

We'll modify `courseExperienceService.js` to not subtract reservation counts from the already-calculated available slots, since they're already accounted for in the `current_participants` field.

### Implementation

1. Locate the code in `courseExperienceService.js` around line 560 that adjusts the available slots:
   ```javascript
   slot.available = Math.max(0, originalAvailable - reservationCount);
   ```

2. Replace it with:
   ```javascript
   slot.available = originalAvailable;
   ```

3. Update the logging statement to reflect the change:
   ```javascript
   logger.info(`Slot ${directKey} (or ${key}): available=${slot.available}, reservations=${reservationCount} (already accounted for in current_participants)`);
   ```

## Implementation Script

Here's a script that can be used to patch the `courseExperienceService.js` file:

```javascript
/**
 * Script to fix the slot calculation double-counting issue in courseExperienceService.js
 */
const fs = require('fs');
const path = require('path');

console.log('Patching courseExperienceService.js to fix slot calculation double-counting issue...');

// Read the original file
const filePath = path.join(__dirname, 'courseExperienceService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the section where the available slots are adjusted
const searchPattern = /slot\.available = Math\.max\(0, originalAvailable - reservationCount\);/;
const replacementPattern = `// Don't subtract reservation count as it's already accounted for in current_participants
                                                        slot.available = originalAvailable;`;

// Replace the available slots adjustment
content = content.replace(searchPattern, replacementPattern);

// Find the section where the slot is logged
const searchPattern2 = /logger\.info\(`Slot \${directKey} \(or \${key}\): original=\${originalAvailable}, reservations=\${reservationCount}, available=\${slot\.available}\`\);/;
const replacementPattern2 = `logger.info(\`Slot \${directKey} (or \${key}): available=\${slot.available}, reservations=\${reservationCount} (already accounted for in current_participants)\`);`;

// Replace the logging section
content = content.replace(searchPattern2, replacementPattern2);

// Write the modified content back to the file
fs.writeFileSync(filePath, content);

console.log('Successfully patched courseExperienceService.js to fix slot calculation double-counting issue.');
```

## Verification

After implementing the fix:
1. Check that experience ID 71 shows 20 available slots in the frontend
2. Verify that other experiences show the correct number of available slots
3. Test making a reservation to ensure the count updates correctly

## Next Steps

To implement this fix:
1. Save the script above as `fix_slot_calculation.js`
2. Run the script with `node fix_slot_calculation.js`
3. Restart the server to apply the changes
4. Verify that the issue is fixed