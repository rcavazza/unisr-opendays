# Detailed Analysis of Slot Availability Calculation

## Overview

I've analyzed how available slots are calculated in different parts of the system, specifically comparing the front-end calculation versus the calculation in `manage_experiences.js`. This explains why you're seeing different numbers of available slots for the "imdp-e-medicina-chirurgia-mani" experience.

## Front-end Calculation

The front-end receives experience data from the `/api/get_experiences` endpoint, which uses `courseExperienceService.getExperiencesByCustomObjectIds()` to fetch and format the data.

### In `courseExperienceService.js`:

```javascript
// Line ~490
experience.timeSlots.push({
    id: `${row.experience_id}-${experience.timeSlots.length + 1}`,
    time: formatTime(row.ora_inizio),
    endTime: formatTime(row.ora_fine),
    available: Math.max(0, row.max_participants - row.current_participants)
});
```

Key points:
1. Available slots = `max_participants - current_participants`
2. Uses the `current_participants` field directly from the `experiences` table
3. Time slot IDs are generated in the format `${row.experience_id}-${experience.timeSlots.length + 1}`

## manage_experiences.js Calculation

In `manage_experiences.js`, the calculation is done differently:

```javascript
// Lines ~58-92
const experiencesWithRemainingSpots = experiences.map(exp => {
  // Extract the base experience ID
  const baseExperienceId = exp.experience_id.replace(/-\d+$/, '');
  
  // Try different key formats to find a match
  let reservationCount = 0;
  let matchedKey = null;
  
  // First try the exact key format
  const exactKey = `${baseExperienceId}_${exp.experience_id}`;
  if (reservationCounts[exactKey]) {
    reservationCount = reservationCounts[exactKey];
    matchedKey = exactKey;
  } else {
    // Try all possible keys with this base ID
    for (const [key, count] of Object.entries(reservationCounts)) {
      if (key.startsWith(`${baseExperienceId}_`)) {
        reservationCount = count;
        matchedKey = key;
        break;
      }
    }
  }
  
  // Calculate remaining spots
  const remainingSpots = Math.max(0, exp.max_participants - reservationCount);
  
  return {
    ...exp,
    reservationCount,
    remainingSpots
  };
});
```

Key points:
1. Available slots = `max_participants - reservationCount`
2. The `reservationCount` comes from `reservationService.getReservationCounts()`
3. It tries different key formats to find a match in the reservation counts:
   - First tries `${baseExperienceId}_${exp.experience_id}`
   - Then tries any key that starts with `${baseExperienceId}_`

## Reservation Counts in reservationService.js

The `getReservationCounts` function in `reservationService.js` counts reservations by grouping them by experience_id and time_slot_id:

```javascript
// Lines ~114-142
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
```

Key points:
1. Counts are stored with keys in the format `${row.experience_id}_${row.time_slot_id}`
2. Counts are based on actual reservations in the `opend_reservations` table

## remainingSlots.js Calculation

There's a third calculation in `remainingSlots.js`:

```javascript
// Lines ~10-103
async function getRemainingSlots(db) {
    // Crea un oggetto per memorizzare i posti rimanenti
    const remainingSlots = {};
    
    // Ottieni i limiti dalle esperienze nel database
    try {
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, max_participants FROM experiences",
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        });
        
        // Inizializza i posti rimanenti con i limiti totali
        for (const exp of experiences) {
            // Crea chiavi per ogni time slot dell'esperienza
            // Assumiamo che ci siano fino a 5 time slot per esperienza
            for (let i = 1; i <= 5; i++) {
                const key = `${exp.experience_id}_${exp.experience_id}-${i}`;
                remainingSlots[key] = exp.max_participants;
            }
        }
    } catch (error) {
        console.error('Errore nel recupero dei limiti dalle esperienze:', error);
    }
    
    // Process the counts from opend_reservations
    db.all(
        `SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations GROUP BY experience_id, time_slot_id`,
        (err, openDayRows) => {
            // Process the counts from opend_reservations
            openDayRows.forEach(row => {
                const key = `${row.experience_id}_${row.time_slot_id}`;
                
                // If we have a limit for this key, subtract the count
                if (remainingSlots[key] !== undefined) {
                    remainingSlots[key] -= row.count;
                    
                    // Ensure the value is not negative
                    if (remainingSlots[key] < 0) {
                        remainingSlots[key] = 0;
                    }
                }
            });
        }
    );
}
```

Key points:
1. Initializes slots with `max_participants` for each experience and time slot
2. Creates keys in the format `${exp.experience_id}_${exp.experience_id}-${i}`
3. Subtracts counts from the `opend_reservations` table using keys in the format `${row.experience_id}_${row.time_slot_id}`

## The Root of the Discrepancy

The discrepancy occurs because:

1. **Different Data Sources**:
   - Front-end: Uses the `current_participants` field in the `experiences` table
   - manage_experiences.js: Counts actual reservations in the `opend_reservations` table

2. **Key Format Inconsistencies**:
   - In the front-end, time slot IDs are in the format `${row.experience_id}-${index+1}`
   - In reservationService.js, keys are in the format `${row.experience_id}_${row.time_slot_id}`
   - In remainingSlots.js, keys are in the format `${exp.experience_id}_${exp.experience_id}-${i}`

3. **Synchronization Issues**:
   - The `current_participants` field in the `experiences` table may not be consistently updated when reservations are made or canceled
   - This would cause the front-end calculation to be out of sync with the actual reservation counts

## Specific Issue with "imdp-e-medicina-chirurgia-mani"

For this specific experience:
- In the front-end, you see 19 spots available in one slot and 20 in others
- In manage_experiences.js, you see one slot with 20 spots available and 19 for others

This suggests that:
1. The `current_participants` field in the database might be out of sync with the actual reservation counts
2. The key formats used to look up reservation counts might be inconsistent
3. The time slot IDs might be different between the front-end and backend

To fix this issue, we would need to standardize how slots are calculated and ensure that all parts of the system use the same method and key formats.