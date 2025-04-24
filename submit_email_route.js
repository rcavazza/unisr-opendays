app.post('/submit-email', async (req, res) => {
    const { email, lang } = req.body;
    const language = lang === 'en' ? 'en' : 'it';
    
    // Basic validation
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Please enter a valid email address' : 'Inserisci un indirizzo email valido',
            contactID: ''
        });
    }
    
    try {
        // Check if email exists in HubSpot
        logger.info(`Checking if email exists in HubSpot: ${email}`);
        
        // Search for the contact in HubSpot using the Search API
        const searchResponse = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts/search', {
            filterGroups: [
                {
                    filters: [
                        {
                            propertyName: "email",
                            operator: "EQ",
                            value: email
                        }
                    ]
                }
            ],
            properties: ["email", "firstname", "lastname"]
        });
        
        // Check if any contacts were found
        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
            // Contact found - log the information to the console
            const contact = searchResponse.data.results[0];
            console.log('HubSpot contact found:', JSON.stringify(contact, null, 2));
            logger.info(`HubSpot contact found for email: ${email}`);
            
            // Get the custom object type ID from environment variables
            const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
            
            if (!customObjectTypeId) {
                logger.error('HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables');
                return res.render(`${language}/error`, {
                    message: language === 'en'
                        ? 'Server configuration error. Please contact support.'
                        : 'Errore di configurazione del server. Contattare il supporto.',
                    contactID: ''
                });
            }
            
            // Check if the contact has an associated custom object
            logger.info(`Checking for custom object associations for contact ID: ${contact.id}`);
            
            try {
                const associationsResponse = await axios.get(
                    `https://api.hubapi.com/crm/v4/objects/contact/${contact.id}/associations/${customObjectTypeId}`
                );
                
                // Check if any associations were found
                if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
                    // Custom object association found
                    logger.info(`Custom object association found for contact ID: ${contact.id}`);
                    
                    // Get the first associated custom object
                    const customObjectId = associationsResponse.data.results[0].toObjectId;
                    
                    // Fetch the custom object details to get the location property
                    logger.info(`Fetching custom object details for ID: ${customObjectId}`);
                    
                    try {
                        const customObjectResponse = await axios.get(
                            `https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}?properties=location`
                        );
                        
                        // Extract the location property
                        const location = customObjectResponse.data.properties.location || '';
                        logger.info(`Custom object location: ${location}`);
                        
                        // Redirect to the confirm-courses page with the location parameter
                        res.redirect(`/confirm-courses?contactID=${contact.id}&lang=${language}&location=${encodeURIComponent(location)}`);
                    } catch (customObjectError) {
                        logger.error('Error fetching custom object details:', customObjectError);
                        return res.render(`${language}/error`, {
                            message: language === 'en'
                                ? 'Error retrieving registration details. Please try again.'
                                : 'Errore nel recupero dei dettagli di registrazione. Riprova.',
                            contactID: contact.id
                        });
                    }
                } else {
                    // No custom object association found
                    logger.info(`No custom object association found for contact ID: ${contact.id}`);
                    const errorCode = 1002; // Error code for "no custom object association"
                    const errorMessage = language === 'en'
                        ? `Your account is not eligible for registration. Please contact support for assistance. Error code: ${errorCode}`
                        : `Il tuo account non è idoneo per la registrazione. Contatta il supporto per assistenza. Codice errore: ${errorCode}`;
                    
                    return res.render(`${language}/error`, {
                        message: errorMessage,
                        contactID: contact.id
                    });
                }
            } catch (associationError) {
                logger.error('Error checking custom object associations:', associationError);
                return res.render(`${language}/error`, {
                    message: language === 'en'
                        ? 'Error checking registration eligibility. Please try again.'
                        : 'Errore nel controllo dell\'idoneità alla registrazione. Riprova.',
                    contactID: contact.id
                });
            }
        } else {
            // Contact not found - show error page with code
            logger.info(`No HubSpot contact found for email: ${email}`);
            const errorCode = 1001; // Error code for "user does not exist"
            const errorMessage = language === 'en'
                ? `Email not found in our system. Please check your email or contact support. Error code: ${errorCode}`
                : `Email non trovato nel nostro sistema. Controlla l'email o contatta il supporto. Codice errore: ${errorCode}`;
            
            return res.render(`${language}/error`, {
                message: errorMessage,
                contactID: ''
            });
        }
    } catch (error) {
        logger.error('Error checking email in HubSpot:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error processing your registration. Please try again.'
                : 'Errore nell\'elaborazione della registrazione. Riprova.',
            contactID: ''
        });
    }
});