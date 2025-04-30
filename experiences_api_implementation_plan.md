# Experiences API Implementation Plan

## Problem

When creating a new experience from `/admin/experiences/simple`, the save button causes an error and doesn't work. This is because the necessary API endpoints to handle CRUD operations for experiences are missing.

## Analysis

1. The `/admin/experiences/simple` route renders a template with a form for managing experiences.
2. The JavaScript in this template attempts to make API calls to:
   - POST to `/api/experiences` to create a new experience
   - PUT to `/api/experiences/:id` to update an experience
   - DELETE to `/api/experiences/:id` to delete an experience

3. However, these API endpoints are not defined in the server, causing the save button to fail with an error.

4. The `experiencesService.js` file already contains the necessary functions to interact with the database:
   - `createExperience()`
   - `updateExperience()`
   - `deleteExperience()`

## Solution

We need to add the missing API routes to handle the CRUD operations for experiences.

### Implementation Steps

1. Create a new file called `add_experiences_api.js` that will define the API routes for experiences.
2. Add the routes for creating, updating, and deleting experiences.
3. Import and use this file in `server.js`.

## Detailed Implementation

### 1. Create `add_experiences_api.js`

```javascript
/**
 * API routes for experiences CRUD operations
 */
const experiencesService = require('./experiencesService');
const logger = require('./logger');

/**
 * Add API routes for experiences CRUD operations
 * @param {Object} app - Express app
 * @param {Object} db - Database instance
 */
module.exports = function(app, db) {
  // Create a new experience
  app.post('/api/experiences', async (req, res) => {
    try {
      const experienceData = req.body;
      logger.info('Creating new experience:', experienceData);
      
      const result = await experiencesService.createExperience(db, experienceData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error creating experience:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  
  // Update an existing experience
  app.put('/api/experiences/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const experienceData = req.body;
      logger.info(`Updating experience with ID: ${id}`, experienceData);
      
      const result = await experiencesService.updateExperience(db, id, experienceData);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error('Error updating experience:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  
  // Delete an experience
  app.delete('/api/experiences/:id', async (req, res) => {
    try {
      const id = req.params.id;
      logger.info(`Deleting experience with ID: ${id}`);
      
      const result = await experiencesService.deleteExperience(db, id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error('Error deleting experience:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
};
```

### 2. Update `server.js`

Add the following code to `server.js` after the line that initializes the simplified experiences admin panel routes:

```javascript
// Import and initialize the experiences API routes
const addExperiencesApiRoutes = require('./add_experiences_api');
addExperiencesApiRoutes(app, db);
```

This should be added after line 230 in server.js, which is:
```javascript
addExperiencesRoutes(app, db);
```

## Testing

After implementing these changes:

1. Restart the server
2. Navigate to `/admin/experiences/simple`
3. Try to create a new experience by filling out the form and clicking the save button
4. Verify that the experience is created successfully and appears in the list
5. Try to edit an existing experience and verify that the changes are saved
6. Try to delete an experience and verify that it is removed from the list

## Expected Outcome

The save button in the `/admin/experiences/simple` page should now work correctly, allowing users to create, update, and delete experiences without errors.