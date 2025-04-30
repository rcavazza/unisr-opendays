# Frontali Experiences Implementation

This document provides detailed implementation instructions for adding "frontali" experiences to the QR code recap page.

## 1. Add New Function to `courseExperienceService.js`

Add the following function to retrieve frontali experiences:

```javascript
/**
 * Retrieves frontali experiences for a contact
 * @param {string} contactId - The HubSpot contact ID
 * @returns {Promise<Array<Object>>} - Array of frontali experience objects
 */
async function getFrontaliExperiences(contactId) {
    try {
        logger.info(`Retrieving frontali experiences for contact ID: ${contactId}`);
        
        // Load the list of course IDs and names from corsi.json
        const courses = require('./corsi.json');
        const courseIds = courses.map(course => course.id);
        
        // Get all custom objects associated with the contact
        const customObjects = await require('./hubspot_experience_service').getAllCustomObjects(contactId);
        
        if (customObjects.error) {
            logger.error(`Error getting custom objects: ${customObjects.error}`);
            return [];
        }
        
        // Extract IDs from custom objects
        const customObjectIds = customObjects.map(obj => obj.id);
        
        // Filter IDs to only include those in our corsi.json file
        const filteredObjectIds = customObjectIds.filter(id => courseIds.includes(id));
        
        // If no matching custom objects found, return an empty array
        if (filteredObjectIds.length === 0) {
            logger.info(`No matching frontali experiences found for contact ID: ${contactId}`);
            return [];
        }
        
        // Map the filtered IDs to their corresponding courses from corsi.json
        const frontaliExperiences = filteredObjectIds.map(id => {
            const course = courses.find(c => c.id === id);
            return {
                id: course.id,
                title: course.name,
                date: course.orario_inizio ? `${course.orario_inizio} - ${course.orario_fine}` : '',
                location: course.location || ''
            };
        });
        
        logger.info(`Found ${frontaliExperiences.length} frontali experiences for contact ID: ${contactId}`);
        return frontaliExperiences;
    } catch (error) {
        logger.error('Error retrieving frontali experiences:', error);
        return [];
    }
}
```

Then update the module exports to include the new function:

```javascript
module.exports = {
    getContactDetails,
    saveConfirmedCourses,
    formatTime,
    getAvailableExperiences,
    saveSelectedExperiences,
    getConfirmedCourses,
    getSelectedExperiences,
    getExperiencesByCustomObjectIds,
    getFrontaliExperiences  // Add this line
};
```

## 2. Modify the `/submit-experiences` Route in `server.js`

Update the route to retrieve and include the "frontali" experiences:

```javascript
// Elaborazione della selezione delle esperienze
app.post('/submit-experiences', async (req, res) => {
    const { contactID, experiences, confirmedCourses, lang } = req.body;
    const language = lang === 'en' ? 'en' : 'it';
    
    if (!contactID) {
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Contact ID is required' : 'ID contatto richiesto',
            contactID: ''
        });
    }
    
    try {
        logger.info(`Elaborazione selezione esperienze per contatto ID: ${contactID}`);
        
        // Converti experiences in array se non è vuoto e non è già un array
        const experienceIds = experiences ? (Array.isArray(experiences) ? experiences : [experiences]) : [];
        
        // Converti confirmedCourses in array se non è vuoto e non è già un array
        const courseIds = confirmedCourses ? (Array.isArray(confirmedCourses) ? confirmedCourses : [confirmedCourses]) : [];
        
        // Salva le esperienze selezionate nel database
        await courseExperienceService.saveSelectedExperiences(db, contactID, experienceIds);
        
        // Recupera i dettagli dei corsi confermati
        const coursesDetails = await courseExperienceService.getConfirmedCourses(db, contactID);
        
        // Recupera i dettagli delle esperienze selezionate
        const experiencesDetails = await courseExperienceService.getSelectedExperiences(db, contactID);
        
        // Recupera i dettagli delle esperienze "frontali"
        const frontaliExperiences = await courseExperienceService.getFrontaliExperiences(contactID);
        
        // Recupera i dettagli del contatto
        const contact = await courseExperienceService.getContactDetails(contactID);
        
        // Genera QR code
        const text2encode = contact.email + '**' + contactID;
        const encoded = xorCipher.encode(text2encode, xorKey);
        
        QRCode.toDataURL(encoded, (err, qrCode) => {
            if (err) {
                logger.error('Errore nella generazione del QR code:', err);
                return res.render(`${language}/error`, {
                    message: language === 'en'
                        ? 'Error generating QR code. Please try again.'
                        : 'Errore nella generazione del codice QR. Riprova.',
                    contactID: contactID
                });
            }
            
            // Renderizza la pagina di riepilogo
            res.render(`${language}/registrationSummary`, {
                contactId: contactID,
                courses: coursesDetails,
                experiences: experiencesDetails,
                frontali: frontaliExperiences,  // Add frontali experiences
                qrCode: qrCode
            });
            
            // Se SENDMAIL è abilitato, invia l'email di conferma
            if (process.env.SENDMAIL == 1) {
                // Genera QR code file
                const qrFileName = `${uuidv4()}.png`;
                const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
                const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
                
                fs.writeFile(qrFilePath, qrBuffer, (err) => {
                    if (err) {
                        logger.error('Errore nel salvataggio del QR code:', err);
                        return;
                    }
                    
                    const qrCodeUrl = `/qrimg/${qrFileName}`;
                    
                    // Prepara i dati per il template email
                    const fieldData = {
                        courses: coursesDetails,
                        experiences: experiencesDetails,
                        frontali: frontaliExperiences  // Add frontali experiences
                    };
                    
                    // Renderizza il template email
                    ejs.renderFile(path.join(__dirname, 'views', language, 'email.ejs'), {
                        email: contact.email,
                        name: contact.firstname,
                        fieldData: fieldData,
                        qrCode: qrCodeUrl,
                        type: 2 // Tipo 2 per la nuova modalità di registrazione
                    }, (err, htmlContent) => {
                        if (err) {
                            logger.error('Errore nella renderizzazione del template email:', err);
                            return;
                        }
                        
                        let thisemail = contact.email;
                        if (HUBSPOT_DEV === 1) {
                            thisemail = "phantomazzz@gmail.com";
                        }
                        
                        const mailOptions = {
                            from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
                            to: thisemail,
                            subject: language === 'en'
                                ? `${contact.firstname}, your UniSR Open Day registration is confirmed`
                                : `${contact.firstname}, la tua registrazione all'Open Day UniSR è confermata`,
                            replyTo: 'info.unisr@unisr.it',
                            html: htmlContent
                        };
                        
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                logger.error('Errore nell\'invio dell\'email:', error);
                            } else {
                                logger.info('Email inviata:', info.response);
                            }
                        });
                    });
                });
            }
        });
    } catch (error) {
        logger.error('Errore nella selezione delle esperienze:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error selecting experiences. Please try again.'
                : 'Errore nella selezione delle esperienze. Riprova.',
            contactID: contactID
        });
    }
});
```

## 3. Update the Italian Registration Summary Template (`views/it/registrationSummary.ejs`)

Add the following section for "frontali" experiences before the "Esperienze selezionate" section:

```html
<div class="summary-section">
    <h2>Esperienze Frontali</h2>
    <% if (frontali && frontali.length > 0) { %>
        <% frontali.forEach(exp => { %>
            <div class="summary-card">
                <h3><%= exp.title %></h3>
                <div class="summary-info">
                    <% if (exp.date) { %>
                        <p><strong>Data:</strong> <%= exp.date %></p>
                    <% } %>
                    <% if (exp.location) { %>
                        <p><strong>Luogo:</strong> <%= exp.location %></p>
                    <% } %>
                </div>
            </div>
        <% }); %>
    <% } else { %>
        <div class="empty-state">
            <p>Nessuna esperienza frontale disponibile.</p>
        </div>
    <% } %>
</div>
```

## 4. Update the English Registration Summary Template (`views/en/registrationSummary.ejs`)

Add the following section for "frontali" experiences before the "Selected Experiences" section:

```html
<div class="summary-section">
    <h2>Lecture Experiences</h2>
    <% if (frontali && frontali.length > 0) { %>
        <% frontali.forEach(exp => { %>
            <div class="summary-card">
                <h3><%= exp.title %></h3>
                <div class="summary-info">
                    <% if (exp.date) { %>
                        <p><strong>Date:</strong> <%= exp.date %></p>
                    <% } %>
                    <% if (exp.location) { %>
                        <p><strong>Location:</strong> <%= exp.location %></p>
                    <% } %>
                </div>
            </div>
        <% }); %>
    <% } else { %>
        <div class="empty-state">
            <p>No lecture experiences available.</p>
        </div>
    <% } %>
</div>
```

## 5. Update the Email Templates

Similarly, update the email templates (`views/it/email.ejs` and `views/en/email.ejs`) to include the "frontali" experiences in the same format.

## Implementation Notes

1. The implementation retrieves "frontali" experiences by cross-referencing the IDs in `corsi.json` with the custom objects associated with the user's contact in HubSpot.
2. The "frontali" experiences are displayed before the selected experiences in the same format.
3. The email template is also updated to include the "frontali" experiences.

## Testing

After implementing these changes, test the functionality by:

1. Going through the registration flow with a valid contact ID
2. Verifying that the "frontali" experiences are correctly displayed on the QR code recap page
3. Checking that the email contains the "frontali" experiences