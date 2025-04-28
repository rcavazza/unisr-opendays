# Understanding the Available Spots Discrepancy

## Overview of the Issue

There appears to be a discrepancy between the number of available spots shown in the UI and what's seen when using `manage_experiences.js`. This document explains how the available spots system works and why this discrepancy exists.

## How Available Spots Are Managed

The available spots for experiences are managed through several components:

### 1. Initial Configuration

- In `reservationOptions.json`, we define the maximum number of spots for each experience/time slot combination:
  ```json
  {
    "limits": {
      "imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-1": 20,
      "odontoiatria-visita-guidata-ai_odontoiatria-visita-guidata-ai-1": 20,
      "ostetricia-simulazione-assisti_ostetricia-simulazione-assisti-1": 20
    }
  }
  ```
- These are the total spots available before any reservations are made
- This file serves as the source of truth for the maximum capacity of each slot

### 2. Reservation Storage

- When users make reservations, they're stored in the `opend_reservations` table in the SQLite database
- Each reservation record includes:
  - `contact_id`: The ID of the user making the reservation
  - `experience_id`: The ID of the experience
  - `time_slot_id`: The ID of the specific time slot
  - `created_at`: When the reservation was made
  - `qr_code_url`: URL to the QR code (can be null)

### 3. Available Spots Calculation

The available spots shown in the UI are calculated dynamically by:

1. Starting with the maximum spots from `reservationOptions.json`
2. Subtracting the count of reservations from the `opend_reservations` table
3. This calculation happens in `courseExperienceService.js` when fetching experiences:

```javascript
// Get reservation counts for all time slots
reservationService.getReservationCounts(db)
  .then(reservationCounts => {
    // Update the available slots for each time slot based on reservation counts
    experiences.forEach((experience) => {
      if (experience.timeSlots && experience.timeSlots.length > 0) {
        experience.timeSlots.forEach((slot) => {
          const key = `${experience.id}_${slot.id}`;
          const reservationCount = reservationCounts[key] || 0;
          // Calculate available slots (max - current)
          const originalAvailable = slot.available;
          slot.available = Math.max(0, originalAvailable - reservationCount);
        });
      }
    });
  });
```

### 4. Data Flow

- When the frontend loads experiences, it calls `/api/get_experiences`
- The server queries the database for experiences and their time slots
- It then calculates available spots by counting reservations
- The frontend displays this calculated number

## Why the Discrepancy Exists

The discrepancy between `manage_experiences.js` and the UI likely exists because:

1. **Different Data Sources**:
   - The UI is showing the **available** spots (maximum minus reservations)
   - The `manage_experiences.js` tool might be showing the **maximum** spots from the database or configuration, not accounting for reservations

2. **Calculation Timing**:
   - The UI calculates available spots at the time of the API request
   - The `manage_experiences.js` tool might be using cached data or not performing the same calculation

3. **Database Structure**:
   - The experiences table in the database likely stores the maximum capacity
   - The actual available spots are calculated at runtime by counting reservations

## How to Resolve the Discrepancy

To align what's shown in `manage_experiences.js` with the UI:

1. Update `manage_experiences.js` to:
   - Show both maximum spots and available spots
   - Use the same calculation method as the frontend (maximum minus reservations)

2. Ensure consistent data access:
   - Both systems should read the maximum spots from the same source
   - Both should count reservations from the `opend_reservations` table

3. Consider adding a caching mechanism:
   - To improve performance, calculated available spots could be cached
   - The cache would need to be invalidated when new reservations are made

## Recommendation

The most straightforward solution would be to modify `manage_experiences.js` to:

1. Display both the maximum capacity and the current available spots
2. Use the same calculation logic as the frontend
3. Clearly label both values to avoid confusion

This would provide administrators with a complete view of the reservation status while maintaining consistency with what users see in the frontend.