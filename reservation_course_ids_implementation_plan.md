# Plan for Implementing Course ID Submission to API

Based on my analysis of the codebase and your requirements, I'll create a plan to pass the filtered list of course IDs (matchingCourseIds) to the `/api/update-selected-experiences` endpoint while preserving all existing functionality.

## Current System Understanding

### Frontend Flow
1. The OpenDayRegistration component fetches experiences and matchingCourseIds from the API
2. User selects experiences/time slots
3. On submit, the selected experiences are sent to `/api/update-selected-experiences`
4. The matchingCourseIds are passed to the confirmation page via React Router state

### Backend Flow
1. The `/api/update-selected-experiences` endpoint receives contactID and experienceIds
2. It updates a HubSpot contact property with the selected experience IDs
3. It sends an email with the selected experiences and courses

## Implementation Plan

### 1. Modify the Frontend Service

We need to update the `updateSelectedExperiences` function in `experienceService.ts` to include the matchingCourseIds in the request:

```typescript
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[],
  matchingCourseIds: string[] = [], // Add this parameter
  lang: string = 'en'
): Promise<{ success: boolean, error?: string }> => {
  try {
    // Ensure we're using a simple language code (en or it)
    const simpleLang = lang.startsWith('en') ? 'en' : lang.startsWith('it') ? 'it' : 'en';
    
    console.log('Updating selected experiences:', { contactID, experienceIds, matchingCourseIds, language: simpleLang });
    
    // Log the request details
    const requestBody = {
      contactID,
      experienceIds,
      matchingCourseIds // Add this field
    };
    console.log('Request body:', JSON.stringify(requestBody));
    
    // Add language as a query parameter
    const response = await fetch(` /api/update-selected-experiences?lang=${simpleLang}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.json();
    console.log('Update response data:', data);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText, data);
      return {
        success: false,
        error: data.error || 'Failed to update selected experiences'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating selected experiences:', error);
    throw error;
  }
};
```

### 2. Modify the handleSubmit Function in OpenDayRegistration

Update the `handleSubmit` function in `OpenDayRegistration.tsx` to pass the matchingCourseIds to the API:

```typescript
const handleSubmit = async () => {
  console.log('handleSubmit called - this should appear in the console when the submit button is clicked');
  // Set submitting state
  setSubmitting(true);
  setReservationError(null);
  
  try {
    console.log('Starting to reset existing reservations and make new ones');
    
    // Reset all existing reservations first
    console.log('Resetting all existing reservations for contact:', contactID);
    const resetResult = await resetReservations(contactID);
    
    if (!resetResult.success) {
      console.error('Failed to reset reservations:', resetResult.error);
      setReservationError('Failed to reset existing reservations');
      setSubmitting(false);
      return;
    }
    
    console.log('Successfully reset all existing reservations');
    
    // Make reservations for all selected time slots
    const selectedSlots = Object.entries(selectedTimeSlots);
    
    // Verifica se ci sono slot selezionati
    if (selectedSlots.length > 0) {
      console.log(`Processing ${selectedSlots.length} selected slots`);
      
      for (let i = 0; i < selectedSlots.length; i++) {
        const [activityId, timeSlotId] = selectedSlots[i];
        console.log(`Making reservation for activity ${activityId}, time slot ${timeSlotId}`);
        
        // Trovare l'attività e lo slot selezionato
        const activity = activities.find(a => String(a.id) === String(activityId));
        const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
        
        // Ottenere l'ID della riga
        const dbId = timeSlot?.dbId;
        
        // Verificare che dbId sia presente
        if (!dbId) {
          console.error(`dbId not found for activity ${activityId}, slot ${timeSlotId}`);
          setReservationError(`Failed to make reservation for ${activity?.title || 'activity'}`);
          setSubmitting(false);
          return;
        }
        
        console.log(`Submitting reservation for activity ${activityId}, slot ${timeSlotId}, dbId: ${dbId}`);
        
        // Make the reservation with dbId (no need for replaceAll since we've already reset all reservations)
        const result = await makeReservation(contactID, activityId, timeSlotId, dbId, false);
        console.log(`Reservation result for ${activityId}:`, result);
        
        if (!result.success) {
          // Check if this is a "no spots available" error
          if (result.errorCode === 'NO_SPOTS_AVAILABLE') {
            const activity = activities.find(a => String(a.id) === String(activityId));
            const activityTitle = activity?.title || 'activity';
            
            setReservationError(t('noSpotsAvailableForActivity', { activity: activityTitle }));
            
            // Refresh the experiences data to get updated availability
            const language = lang || 'en';
            const updatedResponse = await fetchExperiences(contactID, language);
            setActivities(updatedResponse.experiences);
            setMatchingCourseIds(updatedResponse.matchingCourseIds);
            
            // Clear the selection for this activity
            const newSelectedTimeSlots = { ...selectedTimeSlots };
            delete newSelectedTimeSlots[activityId];
            setSelectedTimeSlots(newSelectedTimeSlots);
            
            setSubmitting(false);
            return;
          } else {
            // For other errors
            setReservationError(`Failed to make reservation for ${
              activities.find(a => String(a.id) === String(activityId))?.title || 'activity'
            }`);
            setSubmitting(false);
            return;
          }
        }
      }
      
      console.log('All reservations completed successfully');
    } else {
      console.log('No slots selected, proceeding without making reservations');
    }
    
    // All reservations successful or no reservations needed
    
    // Extract just the activity IDs from the selected time slots (empty array if none selected)
    const selectedActivityIds = Object.keys(selectedTimeSlots);
    console.log('Selected activity IDs for HubSpot update:', selectedActivityIds);
    console.log('Contact ID for HubSpot update:', contactID);
    console.log('Matching course IDs for HubSpot update:', matchingCourseIds);
    
    // Prepare data for confirmation page
    const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
      // Use String comparison to handle both string and number IDs
      const activity = activities.find(a => String(a.id) === String(activityId));
      const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
      return {
        activity: activity?.title,
        course: activity?.course,
        time: timeSlot?.time,
        location: activity?.location,  // Add location
        duration: activity?.duration   // Add duration
      };
    });
    
    // Update the HubSpot contact with the selected experience IDs and matching course IDs
    console.log('Now updating HubSpot contact with selected experiences');
    try {
      // Get the current language from URL parameters
      const language = lang || 'en';
      console.log('Calling updateSelectedExperiences with:', { contactID, selectedActivityIds, matchingCourseIds, language });
      const result = await updateSelectedExperiences(contactID, selectedActivityIds, matchingCourseIds, language);
      console.log('Result from updateSelectedExperiences:', result);
      console.log('Successfully updated HubSpot contact with selected experiences');
    } catch (updateError) {
      console.error('Error updating HubSpot contact with selected experiences:', updateError);
      if (updateError instanceof Error) {
        console.error('Error details:', updateError.message);
      }
      // Continue with the flow even if this update fails
    }
    
    // Refresh the experiences data to get updated availability
    const language = lang || 'en';
    const finalResponse = await fetchExperiences(contactID, language);
    
    // Update matching course IDs one last time
    setMatchingCourseIds(finalResponse.matchingCourseIds);
    
    // Navigate to the confirmation page with the selected activities and matching course IDs
    console.log('Navigation to confirmation page with contactID:', contactID);
    console.log('Matching course IDs:', matchingCourseIds);
    navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, {
      state: {
        activities: selectedActivities,
        matchingCourseIds: matchingCourseIds
      }
    });
  } catch (error) {
    console.error('Error making reservations:', error);
    setReservationError('An error occurred while making the reservations');
    setSubmitting(false);
  }
};
```

### 3. Modify the Backend API Endpoint

Update the `/api/update-selected-experiences` endpoint in `server.js` to handle the matchingCourseIds:

```javascript
app.post('/api/update-selected-experiences', async (req, res) => {
  console.log('Endpoint /api/update-selected-experiences hit - this should appear in the server logs when the endpoint is called');
  console.log('Request body:', req.body);
  logger.info('Endpoint /api/update-selected-experiences hit - this should appear in the server logs when the endpoint is called');
  logger.info('Request body:', req.body);
  const { contactID, experienceIds, matchingCourseIds } = req.body;
  
  if (!contactID || !experienceIds) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }
  
  try {
    // Log the received experienceIds to verify format
    logger.info(`Received experienceIds: ${JSON.stringify(experienceIds)}`);
    logger.info(`experienceIds is array: ${Array.isArray(experienceIds)}`);
    if (Array.isArray(experienceIds)) {
      logger.info(`Number of experienceIds: ${experienceIds.length}`);
    }
    
    // Log the received matchingCourseIds if provided
    if (matchingCourseIds) {
      logger.info(`Received matchingCourseIds: ${JSON.stringify(matchingCourseIds)}`);
      logger.info(`matchingCourseIds is array: ${Array.isArray(matchingCourseIds)}`);
      if (Array.isArray(matchingCourseIds)) {
        logger.info(`Number of matchingCourseIds: ${matchingCourseIds.length}`);
      }
    }
    
    // Format the experience IDs as a semicolon-separated string
    const experiencesString = Array.isArray(experienceIds)
      ? experienceIds.join(';')
      : experienceIds;
    
    logger.info(`Updating HubSpot contact ${contactID} with selected experiences: ${experiencesString}`);
    
    // Verifica se uno degli experienceIds è un workshop genitori (10026 o 10027)
    const WORKSHOP_GENITORI_IDS = ['10026', '10027'];
    const isWorkshopGenitori = Array.isArray(experienceIds)
      ? experienceIds.some(id => WORKSHOP_GENITORI_IDS.includes(id))
      : WORKSHOP_GENITORI_IDS.includes(experienceIds);
    
    // Determina quale campo HubSpot aggiornare in base all'ID dell'esperienza
    let hubspotField = 'open_day__iscrizione_esperienze_10_05_2025';
    if (isWorkshopGenitori) {
      hubspotField = 'slot_prenotazione_workshop_genitori_open_day_2025';
      logger.info(`Using workshop genitori field: ${hubspotField}`);
    }
    
    // Log the request details
    const requestData = {
      properties: {
        [hubspotField]: experiencesString
      }
    };
    logger.info('HubSpot update request data:', JSON.stringify(requestData, null, 2));
    logger.info(`Final property value being sent to HubSpot: "${experiencesString}"`);
    logger.info(`Using HubSpot field: ${hubspotField} (isWorkshopGenitori: ${isWorkshopGenitori})`);
    
    // Log the API key being used (without showing the full key)
    const apiKeyPrefix = apiKey.substring(0, 10);
    logger.info(`Using API key with prefix: ${apiKeyPrefix}...`);
    
    // Update the HubSpot contact property
    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}`,
      requestData
    );
    
    // Log the response
    logger.info('HubSpot update response:', {
      status: response.status,
      statusText: response.statusText,
      data: JSON.stringify(response.data)
    });
    
    // ===== START OF NEW CODE FOR EMAIL SENDING =====
    
    // Extract language from request headers or query parameters
    // Default to English if not specified
    logger.info(`Request query parameters: ${JSON.stringify(req.query)}`);
    logger.info(`Request query lang parameter: ${req.query.lang}`);
    
    const language = req.query.lang === 'it' ? 'it' : 'en';
    logger.info(`Using language: ${language} for email`);
    
    // Log SENDMAIL value to verify if email sending is enabled
    logger.info(`SENDMAIL environment variable value: ${SENDMAIL}`);
    
    // Log email transporter configuration (without sensitive data)
    logger.info(`Email transporter configuration: host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT}, secure=${process.env.SMTP_SECURE}`);
    
    // Function to get matching courses from corsi.json
    function getMatchingCourses(courseTypes, returnAllCourses = false) {
      try {
        logger.info(`Attempting to read corsi.json file...`);
        logger.info(`Current directory: ${__dirname}`);
        const coursesPath = path.join(__dirname, 'corsi.json');
        logger.info(`Full path to corsi.json: ${coursesPath}`);
        logger.info(`File exists: ${fs.existsSync(coursesPath)}`);
        
        const coursesData = fs.readFileSync(coursesPath, 'utf8');
        logger.info(`Successfully read corsi.json file`);
        logger.info(`Courses data length: ${coursesData.length} characters`);
        
        const allCourses = JSON.parse(coursesData);
        logger.info(`Parsed ${allCourses.length} courses from corsi.json`);
        
        // Se returnAllCourses è true, restituisci tutti i corsi senza filtrare
        if (returnAllCourses) {
          logger.info(`Returning all ${allCourses.length} courses from corsi.json without filtering`);
          return allCourses;
        }
        
        logger.info(`Looking for courses with course types: ${courseTypes.join(', ')}`);
        
        // Filter courses by matching course types
        const matchingCourses = allCourses.filter(course =>
          courseTypes.includes(course.id)
        );
        
        logger.info(`Found ${matchingCourses.length} matching courses`);
        logger.info(`Matching courses: ${JSON.stringify(matchingCourses)}`);
        
        return matchingCourses;
      } catch (error) {
        logger.error('Error reading courses data:', error);
        logger.error('Error stack:', error.stack);
        return [];
      }
    }
    
    try {
      // Fetch contact details from HubSpot
      logger.info(`Fetching contact details for ${contactID}`);
      const contactResponse = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}?properties=email,firstname,lastname`
      );
      const contact = contactResponse.data.properties;
      logger.info(`Contact details retrieved: ${contact.email}`);
      
      // Parse experienceIds to ensure it's an array
      const expIds = Array.isArray(experienceIds) ? experienceIds : experiencesString.split(';');
      logger.info(`Fetching experience details for IDs: ${expIds.join(', ')}`);
      
      // Get experience details from the database
      const experiences = await Promise.all(
        expIds.map(async (expId) => {
          try {
            // Query the database to get experience details
            const experience = await new Promise((resolve, reject) => {
              db.get(
                "SELECT * FROM experiences WHERE experience_id = ?",
                [expId],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            
            if (!experience) {
              logger.warn(`Experience ${expId} not found in database`);
              return null;
            }
            
            return {
              title: experience.title,
              date: "May 10, 2025", // Fixed date for Open Day
              location: experience.location || "Main Campus",
              time: experience.ora_inizio || ""
            };
          } catch (error) {
            logger.error(`Error fetching details for experience ${expId}: ${error.message}`);
            return null;
          }
        })
      );
      
      // Filter out null values and log the results
      const validExperiences = experiences.filter(exp => exp !== null);
      logger.info(`Retrieved ${validExperiences.length} valid experiences for email`);
      
      // Generate QR code if needed
      // For this implementation, we'll reuse the existing QR code generation logic
      const text2encode = contact.email + '**' + contactID;
      const encoded = xorCipher.encode(text2encode, xorKey);
      
      // Use matchingCourseIds if provided, otherwise get course_types from experiences
      let courseTypes = [];
      if (matchingCourseIds && Array.isArray(matchingCourseIds) && matchingCourseIds.length > 0) {
        // Use the provided matchingCourseIds
        courseTypes = matchingCourseIds;
        logger.info(`Using provided matchingCourseIds for courses: ${courseTypes.join(', ')}`);
      } else {
        // Fall back to getting course_types from experiences
        logger.info(`Getting course_types for experiences with IDs: ${expIds.join(', ')}`);
        courseTypes = await new Promise((resolve, reject) => {
          const placeholders = expIds.map(() => '?').join(',');
          db.all(
            `SELECT DISTINCT course_type FROM experiences WHERE experience_id IN (${placeholders})`,
            expIds,
            (err, rows) => {
              if (err) {
                logger.error(`Error fetching course_types: ${err.message}`);
                reject(err);
              } else {
                const types = rows.map(row => row.course_type).filter(type => type !== null);
                resolve(types);
              }
            }
          );
        });
      }
      
      logger.info(`Retrieved ${courseTypes.length} course types: ${courseTypes.join(', ')}`);
      
      // Get matching courses from corsi.json based on courseTypes
      const matchingCourses = getMatchingCourses(courseTypes, false);
      logger.info(`Retrieved ${matchingCourses.length} courses for email`);
      logger.info(`Matching courses details: ${JSON.stringify(matchingCourses)}`);
      
      // Rest of the existing email sending code...
      
    } catch (error) {
      // Log the error but don't fail the request
      logger.error('Error sending confirmation email:', error);
      logger.error('Error details:', error.message);
      logger.error('Error stack:', error.stack);
      
      // Continue with the success response even if email fails
    }
    
    // ===== END OF NEW CODE FOR EMAIL SENDING =====
    
    // Return success
    res.json({
      success: true
    });
  } catch (error) {
    // Error handling...
  }
});
```

## Implementation Sequence

1. **First, modify the frontend service** (`experienceService.ts`) to accept and send matchingCourseIds
2. **Then, update the OpenDayRegistration component** to pass matchingCourseIds to the service
3. **Finally, update the backend endpoint** to handle the matchingCourseIds parameter

## Testing Strategy

1. Test the frontend changes by:
   - Verifying that the matchingCourseIds are correctly passed to the API
   - Checking browser network requests to confirm the data is sent correctly

2. Test the backend changes by:
   - Verifying that the server logs show the received matchingCourseIds
   - Confirming that the correct courses are included in the email

3. End-to-end testing:
   - Complete a full reservation flow and verify that the correct courses appear in the confirmation page
   - Verify that the HubSpot contact is updated correctly

## Risks and Mitigations

1. **Risk**: Breaking existing functionality
   **Mitigation**: Make the matchingCourseIds parameter optional in all functions

2. **Risk**: Inconsistent data if matchingCourseIds are not properly passed
   **Mitigation**: Add validation and fallback logic in the backend

3. **Risk**: Performance impact from additional data
   **Mitigation**: Monitor API response times during testing

This plan ensures that we add the new functionality to pass matchingCourseIds to the backend API while preserving all existing features and being conservative with code changes.