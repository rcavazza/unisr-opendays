# Reservation System Architecture

## Updated Understanding

Based on the latest information, `reservationOptions.json` is outdated and no longer used in the system. This document provides an updated understanding of how the reservation system works, particularly focusing on how available spots are tracked and calculated.

## Current Architecture

### 1. Experience and Time Slot Definition

Without `reservationOptions.json`, the maximum capacity for experiences and time slots is likely defined in:

- The database itself, specifically in tables related to experiences and time slots
- The maximum capacity is probably stored as a field in the experiences or time slots table
- This would be the source of truth for how many spots are available for each experience/time slot

### 2. Reservation Storage

- Reservations are stored in the `opend_reservations` table in the SQLite database
- Each reservation record includes:
  - `contact_id`: The ID of the user making the reservation
  - `experience_id`: The ID of the experience
  - `time_slot_id`: The ID of the specific time slot
  - `created_at`: When the reservation was made
  - `qr_code_url`: URL to the QR code (can be null)

### 3. Available Spots Calculation

The available spots shown in the UI are calculated dynamically by:

1. Starting with the maximum capacity stored in the database for each experience/time slot
2. Subtracting the count of reservations from the `opend_reservations` table
3. This calculation likely happens in `courseExperienceService.js` when fetching experiences

The code might look something like:

```javascript
// Get all experiences with their maximum capacity
db.all("SELECT * FROM experiences", (err, experiences) => {
  if (err) {
    // Handle error
  } else {
    // For each experience, get its time slots
    experiences.forEach(experience => {
      db.all("SELECT * FROM time_slots WHERE experience_id = ?", 
        [experience.id], 
        (err, timeSlots) => {
          if (err) {
            // Handle error
          } else {
            // For each time slot, count reservations
            timeSlots.forEach(slot => {
              db.get("SELECT COUNT(*) as count FROM opend_reservations WHERE experience_id = ? AND time_slot_id = ?",
                [experience.id, slot.id],
                (err, row) => {
                  if (err) {
                    // Handle error
                  } else {
                    // Calculate available spots
                    slot.available = slot.max_capacity - row.count;
                  }
                });
            });
          }
        });
    });
  }
});
```

### 4. Data Flow

- When the frontend loads experiences, it calls `/api/get_experiences`
- The server queries the database for experiences and their time slots, including maximum capacity
- It then calculates available spots by counting reservations
- The frontend displays this calculated number

## Why the Discrepancy Exists

The discrepancy between `manage_experiences.js` and the UI likely exists because:

1. **Different Calculation Methods**:
   - The UI is calculating available spots by subtracting reservations from maximum capacity
   - The `manage_experiences.js` tool might not be performing this calculation

2. **Database Access**:
   - The UI and `manage_experiences.js` might be accessing different parts of the database
   - `manage_experiences.js` might be showing raw data without processing

## How to Resolve the Discrepancy

To align what's shown in `manage_experiences.js` with the UI:

1. Update `manage_experiences.js` to:
   - Use the same database queries and calculation methods as the frontend
   - Show both maximum capacity and available spots

2. Ensure consistent data access:
   - Both systems should read the maximum capacity from the same database tables
   - Both should count reservations from the `opend_reservations` table

## Next Steps

1. **Identify the Source of Truth**:
   - Determine exactly which database tables and fields store the maximum capacity for experiences/time slots
   - Confirm how the UI is calculating available spots

2. **Update manage_experiences.js**:
   - Modify it to use the same calculation method as the UI
   - Display both maximum capacity and available spots

3. **Consider Database Optimization**:
   - If performance is an issue, consider adding indexes or denormalized fields to speed up calculations
   - For example, a cached "available_spots" field that's updated when reservations are made or cancelled