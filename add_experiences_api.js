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