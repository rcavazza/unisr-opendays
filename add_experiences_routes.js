/**
 * Routes for the simplified experiences admin panel
 */
const experiencesService = require('./experiencesService');
const logger = require('./logger');

// Configuration for the fields to display in the simplified admin panel
// By default, all fields are included
const EXPERIENCE_DISPLAY_FIELDS = [
  'id', 
  'experience_id', 
  'title', 
  'course', 
  'location', 
  'date', 
  'duration', 
  'desc', 
  'language',
  'course_type', 
  'max_participants', 
  'current_participants', 
  'ora_inizio', 
  'ora_fine'
];

/**
 * Add simplified experiences admin panel route to the Express app
 * @param {Object} app - Express app
 * @param {Object} db - Database instance
 */
module.exports = function(app, db) {
  // Add the simplified admin panel route
  app.get('/admin/experiences/simple', async (req, res) => {
    try {
      const experiences = await experiencesService.getAllExperiences(db);
      res.render('manageExperiencesSimple', { 
        experiences,
        displayFields: EXPERIENCE_DISPLAY_FIELDS
      });
    } catch (error) {
      logger.error('Error loading simplified experiences admin panel:', error);
      res.status(500).send('Error loading simplified experiences admin panel');
    }
  });
};