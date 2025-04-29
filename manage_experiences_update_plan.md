# Implementation Plan: Update manage_experiences.js to Use the Same API as Front-end

## Overview

Currently, manage_experiences.js calculates available slots differently from the front-end, leading to discrepancies in the displayed number of available slots. The goal is to modify manage_experiences.js to use the same API and calculation method as the front-end.

## Current Implementation

### Front-end (/front)
- Uses the `/api/get_experiences` endpoint
- This endpoint uses `courseExperienceService.getExperiencesByCustomObjectIds()`
- Available slots are calculated as: `available: Math.max(0, row.max_participants - row.current_participants)`

### manage_experiences.js
- Gets all experiences using `experiencesService.getAllExperiences()`
- Gets reservation counts using `reservationService.getReservationCounts()`
- Calculates remaining spots as: `const remainingSpots = Math.max(0, exp.max_participants - reservationCount)`

## Implementation Steps

### 1. Create a New API Endpoint for manage_experiences.js

Add a new endpoint in server.js that will be used by manage_experiences.js:

```javascript
// Add to server.js
app.get('/api/manage_experiences', async (req, res) => {
  const language = req.query.lang || 'it'; // Default to Italian
  
  try {
    // Get all custom object IDs (course types)
    const courses = require('./corsi.json');
    const courseIds = courses.map(course => course.id);
    
    // Get experiences using the same function as the front-end
    const experiences = await courseExperienceService.getExperiencesByCustomObjectIds(db, courseIds, language);
    
    res.json(experiences);
  } catch (error) {
    logger.error('Error in /api/manage_experiences:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});
```

### 2. Modify manage_experiences.js to Use the New API

Replace the current experience fetching logic in manage_experiences.js with a call to the new API:

```javascript
// Replace in manage_experiences.js
app.get('/', async (req, res) => {
  const language = req.query.lang || 'it'; // Default to Italian
  
  try {
    // Use the same API as the front-end
    const response = await axios.get(` /api/manage_experiences?lang=${language}`);
    const experiences = response.data;
    
    // Transform the experiences to match the expected format for the template
    const experiencesForTemplate = experiences.map(exp => {
      // Extract the base experience ID
      const baseExperienceId = exp.id;
      
      // Calculate total remaining spots across all time slots
      const totalRemainingSpots = exp.timeSlots.reduce((total, slot) => total + slot.available, 0);
      
      // Format the experience for the template
      return {
        id: baseExperienceId,
        experience_id: baseExperienceId,
        title: exp.title,
        course: exp.course,
        location: exp.location,
        desc: exp.desc,
        language: language,
        max_participants: exp.timeSlots.length > 0 ? exp.timeSlots[0].available + exp.timeSlots[0].reserved : 0,
        remainingSpots: totalRemainingSpots,
        timeSlots: exp.timeSlots
      };
    });
    
    res.render('manageExperiences', {
      experiences: experiencesForTemplate,
      language,
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    console.error('Errore nel recupero delle esperienze:', error.message);
    logger.error('Errore nel recupero delle esperienze:', error);
    return res.status(500).send('Errore nel recupero delle esperienze');
  }
});
```

### 3. Update the manageExperiences.ejs Template

Modify the template to display time slots and their availability:

```html
<!-- Add to views/manageExperiences.ejs -->
<% if (experience.timeSlots && experience.timeSlots.length > 0) { %>
  <div class="time-slots">
    <h4>Time Slots:</h4>
    <ul>
      <% experience.timeSlots.forEach(slot => { %>
        <li>
          <%= slot.time %><% if (slot.endTime) { %> - <%= slot.endTime %><% } %>: 
          <%= slot.available %> spots available
        </li>
      <% }); %>
    </ul>
  </div>
<% } %>
```

### 4. Add a New Field to the Experience Model

To track both available and reserved spots, add a 'reserved' field to the time slot object in courseExperienceService.js:

```javascript
// Modify in courseExperienceService.js (around line 490)
experience.timeSlots.push({
  id: `${row.experience_id}-${experience.timeSlots.length + 1}`,
  time: formatTime(row.ora_inizio),
  endTime: formatTime(row.ora_fine),
  available: Math.max(0, row.max_participants - row.current_participants),
  reserved: row.current_participants // Add this line
});
```

### 5. Update the API Endpoints for Reservations

Ensure that when a reservation is made or canceled, the current_participants field is properly updated:

```javascript
// Modify in server.js (around line 306)
app.post('/api/reserve', async (req, res) => {
  const { contactID, experienceId, timeSlotId } = req.body;
  
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
    await reservationService.saveReservation(db, contactID, experienceId, timeSlotId);
    
    // Update the current_participants field in the experiences table
    // Extract the base experience ID
    const baseExperienceId = experienceId.replace(/-\d+$/, '');
    
    // Increment the current_participants field
    await db.run(
      "UPDATE experiences SET current_participants = current_participants + 1 WHERE experience_id LIKE ?",
      [`${baseExperienceId}%`]
    );
    
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

### 6. Add a Cancel Reservation Endpoint

Add an endpoint to cancel reservations and update the current_participants field:

```javascript
// Add to server.js
app.post('/api/cancel-reservation', async (req, res) => {
  const { contactID, experienceId, timeSlotId } = req.body;
  
  if (!contactID || !experienceId || !timeSlotId) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }
  
  try {
    // Delete the reservation
    await db.run(
      "DELETE FROM opend_reservations WHERE contact_id = ? AND experience_id = ? AND time_slot_id = ?",
      [contactID, experienceId, timeSlotId]
    );
    
    // Update the current_participants field in the experiences table
    // Extract the base experience ID
    const baseExperienceId = experienceId.replace(/-\d+$/, '');
    
    // Decrement the current_participants field
    await db.run(
      "UPDATE experiences SET current_participants = MAX(0, current_participants - 1) WHERE experience_id LIKE ?",
      [`${baseExperienceId}%`]
    );
    
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

## Testing Plan

1. **Test the New API Endpoint**:
   - Make a GET request to `/api/manage_experiences?lang=it`
   - Verify that the response contains experiences with time slots and available spots

2. **Test manage_experiences.js**:
   - Open the manage experiences page
   - Verify that the displayed available slots match those shown in the front-end

3. **Test Reservation Flow**:
   - Make a reservation through the front-end
   - Verify that the available slots are updated correctly in both the front-end and manage experiences page

4. **Test Cancellation Flow**:
   - Cancel a reservation
   - Verify that the available slots are updated correctly in both the front-end and manage experiences page

## Rollback Plan

If issues arise after implementation:

1. Revert the changes to manage_experiences.js
2. Revert the changes to server.js
3. Revert the changes to courseExperienceService.js
4. Revert the changes to the manageExperiences.ejs template

## Conclusion

By implementing these changes, manage_experiences.js will use the same API and calculation method as the front-end, ensuring consistency in the displayed number of available slots across the system.