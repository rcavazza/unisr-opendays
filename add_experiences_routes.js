// Import the experiencesService module
const experiencesService = require('./experiencesService');

// Add the admin panel route
app.get('/admin/experiences', async (req, res) => {
  try {
    const experiences = await experiencesService.getAllExperiences(db);
    res.render('manageExperiences', { experiences });
  } catch (error) {
    logger.error('Error loading experiences admin panel:', error);
    res.status(500).send('Error loading experiences admin panel');
  }
});

// API routes for CRUD operations
// GET all experiences
app.get('/api/experiences', async (req, res) => {
  try {
    const { language, orderBy } = req.query;
    const experiences = await experiencesService.getAllExperiences(db, language, orderBy);
    res.json(experiences);
  } catch (error) {
    logger.error('Error getting experiences:', error);
    res.status(500).json({ error: 'Error getting experiences' });
  }
});

// GET a single experience
app.get('/api/experiences/:id', async (req, res) => {
  try {
    const experience = await experiencesService.getExperienceById(db, req.params.id);
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    res.json(experience);
  } catch (error) {
    logger.error('Error getting experience:', error);
    res.status(500).json({ error: 'Error getting experience' });
  }
});

// POST a new experience
app.post('/api/experiences', async (req, res) => {
  try {
    const result = await experiencesService.createExperience(db, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating experience:', error);
    res.status(500).json({ error: 'Error creating experience' });
  }
});

// PUT (update) an experience
app.put('/api/experiences/:id', async (req, res) => {
  try {
    const result = await experiencesService.updateExperience(db, req.params.id, req.body);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error('Error updating experience:', error);
    res.status(500).json({ error: 'Error updating experience' });
  }
});

// DELETE an experience
app.delete('/api/experiences/:id', async (req, res) => {
  try {
    const result = await experiencesService.deleteExperience(db, req.params.id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error('Error deleting experience:', error);
    res.status(500).json({ error: 'Error deleting experience' });
  }
});