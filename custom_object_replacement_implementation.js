/**
 * Direct implementation of the custom object replacement functionality
 * 
 * This file contains the modified code for the /api/get_experiences endpoint
 * in server.js. The changes replace specific custom object IDs with 25326449768
 * and remove duplicates of this ID.
 * 
 * Instructions:
 * 1. Locate the /api/get_experiences endpoint in server.js (around line 617)
 * 2. Replace the code inside the try block with the code below
 */

// Endpoint to get experiences based on contactID and language
app.get('/api/get_experiences', async (req, res) => {
    const { contactID, lang } = req.query;
    
    // Default to Italian if no language specified
    const language = lang === 'en' ? 'en' : 'it';
    
    if (!contactID) {
        return res.status(400).json({
            error: language === 'en' ? 'Contact ID is required' : 'ID contatto richiesto'
        });
    }
    
    try {
        logger.info(`Getting experiences for contact ID: ${contactID} in language: ${language}`);
        
        // Load the list of course IDs and names
        const courses = require('./corsi.json');
        const courseIds = courses.map(course => course.id);
        
        // Log the types of IDs in corsi.json
        courses.forEach(course => {
            logger.info(`Course ID: ${course.id}, Type: ${typeof course.id}`);
        });
        
        // Get all custom objects associated with the contact
        const customObjects = await hubspotExperienceService.getAllCustomObjects(contactID);
        
        if (customObjects.error) {
            logger.error(`Error getting custom objects: ${customObjects.error}`);
            return res.status(500).json({
                error: language === 'en' ? 'Error retrieving custom objects' : 'Errore nel recupero degli oggetti personalizzati'
            });
        }
        
        // Extract IDs from custom objects and log their types
        const customObjectIds = customObjects.map(obj => {
            logger.info(`Custom object ID: ${obj.id}, Type: ${typeof obj.id}`);
            return obj.id;
        });
        
        // MODIFICATION: Replace specific custom object IDs with 25326449768
        const targetIds = ['25417865498', '25417865493', '25417865392'];
        const replacementId = '25326449768';
        
        // Convert all IDs to strings for consistent comparison
        const processedCustomObjectIds = customObjectIds.map(id => {
            const strId = String(id);
            // If the ID is one of the target IDs, replace it with the replacement ID
            if (targetIds.includes(strId)) {
                logger.info(`Replacing custom object ID ${strId} with ${replacementId}`);
                return replacementId;
            }
            return strId;
        });
        
        // Remove duplicates of the replacement ID
        const uniqueCustomObjectIds = [];
        const replacementIdCount = {};
        
        processedCustomObjectIds.forEach(id => {
            // If it's the replacement ID, check if we've already added it
            if (id === replacementId) {
                if (!replacementIdCount[replacementId]) {
                    replacementIdCount[replacementId] = 0;
                    uniqueCustomObjectIds.push(id);
                }
                replacementIdCount[replacementId]++;
                logger.info(`Found ${replacementId} (count: ${replacementIdCount[replacementId]})`);
            } else {
                // For other IDs, always add them
                uniqueCustomObjectIds.push(id);
            }
        });
        
        logger.info(`Original custom object IDs: ${customObjectIds.join(', ')}`);
        logger.info(`Processed custom object IDs: ${processedCustomObjectIds.join(', ')}`);
        logger.info(`Unique custom object IDs: ${uniqueCustomObjectIds.join(', ')}`);
        
        // Try both string and number comparisons for filtering
        const filteredObjectIds = [];
        for (const customId of uniqueCustomObjectIds) {
            for (const courseId of courseIds) {
                // Try string comparison
                if (String(customId) === String(courseId)) {
                    logger.info(`Match found: ${customId} (${typeof customId}) matches ${courseId} (${typeof courseId})`);
                    filteredObjectIds.push(customId);
                    break;
                }
                // Try number comparison if both can be converted to numbers
                else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
                    logger.info(`Numeric match found: ${customId} (${typeof customId}) matches ${courseId} (${typeof courseId})`);
                    filteredObjectIds.push(customId);
                    break;
                }
            }
        }
        
        // If no matching custom objects found, return an empty response
        if (filteredObjectIds.length === 0) {
            logger.info(`No matching custom objects found for contact ID: ${contactID}`);
            return res.json({
                experiences: [],
                matchingCourseIds: []
            });
        }
        
        // Get experiences from the database based on the filtered IDs, language, and contactID
        const experiences = await courseExperienceService.getExperiencesByCustomObjectIds(db, filteredObjectIds, language, contactID);
        
        // Log the experiences for debugging
        logger.info(`Returning ${experiences.length} experiences to frontend`);
        experiences.forEach((exp, index) => {
            logger.info(`Experience ${index + 1}: ID=${exp.id}, Title=${exp.title}`);
            if (exp.timeSlots && exp.timeSlots.length > 0) {
                exp.timeSlots.forEach((slot, slotIndex) => {
                    logger.info(`- Slot ${slotIndex + 1}: ID=${slot.id}, Time=${slot.time}, Available=${slot.available}, Type=${typeof slot.available}`);
                });
            }
        });
        
        // Return the experiences and matching course IDs as JSON
        res.json({
            experiences: experiences,
            matchingCourseIds: filteredObjectIds
        });
    } catch (error) {
        logger.error('Error in /api/get_experiences:', error);
        res.status(500).json({
            error: language === 'en' ? 'Internal server error' : 'Errore interno del server'
        });
    }
});