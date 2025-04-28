const path = require('path');
const express = require('express');
const reservationOptions = require('./reservationOptions.json');
const { getRemainingSlots } = require('./remainingSlots');
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Variabile globale per memorizzare i posti rimanenti
let globalRemainingSlots = {};

// Configure view engine and paths
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Serve static assets from the frontend build
app.use('/assets', express.static(path.join(__dirname, 'front/dist/assets')));

// Handle missing SVG files
const handleMissingSvg = (req, res) => {
    // Send an empty SVG as fallback
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
};

// app.use('/vite.svg', handleMissingSvg);
// app.use('/Group_96.svg', handleMissingSvg);
// app.use('/Frame_94-3.svg', handleMissingSvg);
// app.use('/Frame_94-2.svg', handleMissingSvg);

// Serve the frontend app for language-specific routes and root
app.get(['/en/front', '/it/front', '/front'], (req, res) => {
    if (req.path === '/front') {
        return res.redirect('/en/front');
    }
    res.sendFile(path.join(__dirname, 'front/dist/index.html'));
});
const fs = require('fs');
const https = require('https');
require('dotenv').config();
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const sqlite3 = require("sqlite3").verbose();

var MAIN_CONTENT = "image";

const HUBSPOT_DEV = process.env.HUBSPOT_DEV;
var QRCode = require('qrcode');

const axios = require('axios');
var apiKey = "";
var groupKey = process.env.GROUPKEY;
var groupKey_fcfs = "posto_prenotato";
if(HUBSPOT_DEV == 0) {
    apiKey = process.env.HUBSPOT_APIKEY_PROD;
} else {
    apiKey = process.env.HUBSPOT_APIKEY_SAND;
}

const apiHeader = "Bearer " + apiKey;
axios.defaults.headers.common['Authorization'] = apiHeader;

axios.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2))
  return request
})

const xorCipher = require('./xorCipher');
const xorKey = process.env.XOR_SECRET;
const port = process.env.PORT || 3000; // Use port 3001 as fallback
const siteName = process.env.SITE_NAME;
const courseExperienceService = require('./courseExperienceService');

const SENDMAIL = process.env.SENDMAIL;
var placeavailable = process.env.PLACEAVAILABLE;

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Funzione per aggiornare i posti rimanenti
async function updateRemainingSlots() {
    try {
        globalRemainingSlots = await getRemainingSlots(db, reservationOptions);
        
        // Assicurati che nessun valore sia negativo
        for (const key in globalRemainingSlots) {
            if (globalRemainingSlots[key] < 0) {
                globalRemainingSlots[key] = 0;
            }
        }
        
        console.log('Posti rimanenti aggiornati:', JSON.stringify(globalRemainingSlots));
    } catch (error) {
        console.error('Errore nell\'aggiornamento dei posti rimanenti:', error);
    }
}

const ISOPEN = false;
console.log("--- STARTING UNISR SERVER ON PORT " + port);

const db = new sqlite3.Database("fcfs.sqlite", (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Setup del database fcfs.sqlite`);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS fcfs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user INTEGER
            )`);
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            day TEXT,
            custom_object_location TEXT
            )`);
    db.run(`CREATE TABLE IF NOT EXISTS email_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
    db.get(`SELECT COUNT(*) AS count FROM fcfs`, (err, row) => {
        if (err) {
            console.error("Errore nel conteggio delle righe:", err.message);
        } else {
            placeavailable = placeavailable - row.count;
            console.log(`Numero di righe nella tabella fcfs: ${row.count}`);
        }
    });
    
    // Calcola i posti rimanenti all'avvio del server
    updateRemainingSlots();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger.middleware());

// Import the HubSpot experience service
const hubspotExperienceService = require('./hubspot_experience_service');

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
        
        // Get all custom objects associated with the contact
        const customObjects = await hubspotExperienceService.getAllCustomObjects(contactID);
        
        if (customObjects.error) {
            logger.error(`Error getting custom objects: ${customObjects.error}`);
            return res.status(500).json({
                error: language === 'en' ? 'Error retrieving custom objects' : 'Errore nel recupero degli oggetti personalizzati'
            });
        }
        
        // Extract IDs from custom objects
        const customObjectIds = customObjects.map(obj => obj.id);
        
        // Filter IDs to only include those in our corsi.json file
        const filteredObjectIds = customObjectIds.filter(id => courseIds.includes(id));
        
        // If no matching custom objects found, return an empty array
        if (filteredObjectIds.length === 0) {
            logger.info(`No matching custom objects found for contact ID: ${contactID}`);
            return res.json([]);
        }
        
        // Get experiences from the database based on the filtered IDs and language
        const experiences = await courseExperienceService.getExperiencesByCustomObjectIds(db, filteredObjectIds, language);
        
        // Return the experiences as JSON
        res.json(experiences);
    } catch (error) {
        logger.error('Error in /api/get_experiences:', error);
        res.status(500).json({
            error: language === 'en' ? 'Internal server error' : 'Errore interno del server'
        });
    }
});

// Test endpoint to reset database (only in development)
app.post('/reset-database', async (req, res) => {
    if (process.env.RUNLOCAL !== '1') {
        return res.status(403).send('This endpoint is only available in development mode');
    }

    try {
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM reservations", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        logger.info('Database reset successful');
        res.send('Database reset successful');
    } catch (error) {
        logger.error('Error resetting database:', error);
        res.status(500).send('Error resetting database');
    }
});

app.get('/selection', async (req, res) => {
    const { contactID, lang, location } = req.query;
    
    // Default to Italian if no language specified
    const language = lang === 'en' ? 'en' : 'it';
    
    if (!contactID) {
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Contact ID is required' : 'ID contatto richiesto',
            contactID: ''
        });
    }
    
    try {
        // Usa la variabile globale invece di chiamare getRemainingSlots
        logger.info(`Posti rimanenti: ${JSON.stringify(globalRemainingSlots)}`);
        
        // Render the language-specific template if it exists, otherwise fall back to the default
        const templatePath = `${language}/selection`;
        
        res.render(templatePath, {
            options: reservationOptions,
            contactId: contactID,
            location: location || '', // Pass the location to the template
            language: language, // Pass the language to the template
            remainingSlots: globalRemainingSlots // Pass the remaining slots to the template
        });
    } catch (error) {
        logger.error('Errore nel recupero dei posti rimanenti:', error);
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Error loading available slots' : 'Errore nel caricamento degli slot disponibili',
            contactID: contactID
        });
    }
});

app.post('/submit-reservation', async (req, res) => {
    const { contactID: contactId, lang, customObjectLocation, ...fieldValues } = req.body;
    
    // Log the custom object location
    logger.info(`Custom object location from form: ${customObjectLocation}`);
    
    // Default to Italian if no language specified
    const language = lang === 'en' ? 'en' : 'it';
    
    if (!contactId) {
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Contact ID is required' : 'ID contatto richiesto',
            contactID: ''
        });
    }

    try {
        logger.info(`Starting reservation process for contactId: ${contactId}`);
        logger.info(`Reservation details:`, fieldValues);

        // Check if user has already reserved
        const existingReservation = await new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM reservations WHERE user_id = ?",
                [contactId],
                (err, row) => {
                    if (err) {
                        logger.error(`Database error checking existing reservation: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Existing reservation check result: ${row ? 'Found' : 'Not found'}`);
                        resolve(row);
                    }
                }
            );
        });

        if (existingReservation) {
            // Delete the existing reservation
            await new Promise((resolve, reject) => {
                db.run(
                    "DELETE FROM reservations WHERE user_id = ?",
                    [contactId],
                    (err) => {
                        if (err) {
                            logger.error(`Database error deleting existing reservation: ${err.message}`);
                            reject(err);
                        } else {
                            logger.info(`Deleted existing reservation for user: ${contactId}`);
                            resolve();
                        }
                    }
                );
            });
            
            // Aggiorna i posti rimanenti dopo aver eliminato la prenotazione
            await updateRemainingSlots();
            
            // Log the update action
            logger.info(`Updating reservation for contactId: ${contactId} with new date`);
            // Continue with the normal flow (no return statement)
        }

        // Get contact information from HubSpot
        logger.info(`Fetching contact information from HubSpot for ID: ${contactId}`);
        const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts/' + contactId + '?properties=email,firstname,lastname,ischeckin,isregistered,eventdate');
        const contact = response.data.properties;
        logger.info(`Successfully retrieved HubSpot contact: ${contact.email}`);
        
        // Verify that all required fields are present
        const requiredFields = reservationOptions.fields.map(f => f.id);
        const missingFields = requiredFields.filter(field => !fieldValues[field]);
        
        if (missingFields.length > 0) {
            return res.render(`${language}/error`, {
                message: language === 'en'
                    ? `Missing required fields: ${missingFields.join(', ')}`
                    : `Campi obbligatori mancanti: ${missingFields.join(', ')}`,
                contactID: contactId
            });
        }
        
        // Build the query dynamically based on the fields
        const fields = Object.keys(fieldValues);
        const placeholders = fields.map(() => '?').join(' AND ');
        const values = Object.values(fieldValues);
        
        // Check if slot is available
        const reservationCount = await new Promise((resolve, reject) => {
            // Add custom_object_location to the WHERE clause
            const locationFilter = "custom_object_location = ?";
            const whereClause = fields.map(f => `${f} = ?`).join(' AND ');
            const fullWhereClause = whereClause + (whereClause ? ' AND ' : '') + locationFilter;
            
            db.get(
                `SELECT COUNT(*) as count FROM reservations WHERE ${fullWhereClause}`,
                [...values, customObjectLocation], // Add customObjectLocation to the values array
                (err, row) => {
                    if (err) {
                        logger.error(`Database error checking slot availability: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Current reservation count for slot: ${row.count}`);
                        resolve(row.count);
                    }
                }
            );
        });

        // Generate key for limits check - include both day and location
        const key = `${Object.values(fieldValues).join('_')}_${customObjectLocation}`;
        // If no specific limit for this location, fall back to the default (empty location)
        const defaultKey = `${Object.values(fieldValues).join('_')}_`;
        const limit = reservationOptions.limits[key] !== undefined ?
                      reservationOptions.limits[key] :
                      reservationOptions.limits[defaultKey];
        logger.info(`Checking slot limit - Current: ${reservationCount}, Limit: ${limit}, Key: ${key}`);
        
        if (reservationCount < limit) {
            // Generate QR code
            const text2encode = contact.email + '**' + contactId;
            const encoded = xorCipher.encode(text2encode, xorKey);
            
            QRCode.toDataURL(encoded, async function (err, qrCode) {
                if (err) {
                    console.error('Error generating QR code:', err);
                    return res.render(`${language}/error`, {
                        message: language === 'en'
                            ? 'Error generating QR code. Please try again.'
                            : 'Errore nella generazione del codice QR. Riprova.',
                        contactID: contactId
                    });
                }

                try {
                    // Save reservation in database with dynamic fields
                    const fieldNames = Object.keys(fieldValues);
                    const placeholders = fieldNames.map(() => '?').join(', ');
                    const fieldValues2 = Object.values(fieldValues);
                    
                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT INTO reservations (user_id, custom_object_location, ${fieldNames.join(', ')}) VALUES (?, ?, ${placeholders})`,
                            [contactId, customObjectLocation, ...fieldValues2],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                    
                    // Aggiorna i posti rimanenti dopo aver salvato la prenotazione
                    await updateRemainingSlots();

                    // Commented out as per requirements to stop updating isregistered (2025-04-02 update)
                    // await axios.patch('https://api.hubapi.com/crm/v3/objects/contacts/' + contactId, {
                    //     properties: {
                    //         isregistered: true
                    //     }
                    // });

                    // Get the custom object type ID from environment variables
                    const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;

                    if (!customObjectTypeId) {
                        logger.error('HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables - cannot update data_ritiro_text');
                    } else {
                        try {
                            // Find associations between the contact and custom object
                            logger.info(`Checking for custom object associations for contact ID: ${contactId}`);
                            const associationsResponse = await axios.get(
                                `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${customObjectTypeId}`
                            );
                            
                            // Check if any associations were found
                            if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
                                // Get the first associated custom object
                                const customObjectId = associationsResponse.data.results[0].toObjectId;
                                logger.info(`Found custom object association: ${customObjectId}`);
                                
                                // Get the selected day value from the form
                                const selectedDay = fieldValues.day;
                                logger.info(`Selected day for data_ritiro_text update: ${selectedDay}`);
                                
                                // Update the custom object with the selected day
                                await axios.patch(`https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}`, {
                                    "properties": {
                                        data_ritiro_text: selectedDay
                                    }
                                });
                                
                                logger.info(`Successfully updated custom object ${customObjectId} with data_ritiro_text=${selectedDay}`);
                            } else {
                                // No custom object association found
                                logger.warn(`No custom object association found for contact ID: ${contactId} - data_ritiro_text not updated`);
                            }
                        } catch (error) {
                            logger.error(`Error updating custom object with data_ritiro_text: ${error.message}`);
                            logger.error('Full error:', error);
                            // Continue with the process even if updating the custom object fails
                        }
                    }

                    // Generate QR code file
                    const qrFileName = `${uuidv4()}.png`;
                    const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
                    const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');

                    if (SENDMAIL == 1) {
                        fs.writeFile(qrFilePath, qrBuffer, (err) => {
                            if (err) {
                                console.error('Error saving QR code image:', err);
                                return res.render(`${language}/error`, {
                                    message: language === 'en'
                                        ? 'Error saving QR code. Please try again.'
                                        : 'Errore nel salvataggio del codice QR. Riprova.',
                                    contactID: contactId
                                });
                            }

                            const qrCodeUrl = `/qrimg/${qrFileName}`;
                            // Use the language from the form submission, default to Italian
                            const lang = language;

                            // Send confirmation email
                            // Prepare field data for email template
                            const fieldData = {};
                            reservationOptions.fields.forEach(field => {
                                fieldData[field.id] = fieldValues[field.id] || '';
                            });
                            // Add custom object location to field data
                            fieldData.customObjectLocation = customObjectLocation;
                            
                            ejs.renderFile(path.join(__dirname, 'views', lang, 'email.ejs'), {
                                email: contact.email,
                                name: contact.firstname,
                                fieldData: fieldData,
                                qrCode: qrCodeUrl,
                                type: 1
                            }, (err, htmlContent) => {
                                if (err) {
                                    console.error('Error rendering email template:', err);
                                    return res.render(`${language}/error`, {
                                        message: language === 'en'
                                            ? 'Error generating email content. Please try again.'
                                            : 'Errore nella generazione del contenuto email. Riprova.',
                                        contactID: contactId
                                    });
                                }

                                let thisemail = contact.email;
                                if (HUBSPOT_DEV === 1) {
                                    thisemail = "phantomazzz@gmail.com";
                                }

                                const mailOptions = {
                                    from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
                                    to: thisemail,
                                    subject: language === 'en'
                                        ? `${contact.firstname}, come get your backpack`
                                        : `${contact.firstname}, vieni a ritirare il tuo zaino`,
                                    replyTo: 'info.unisr@unisr.it',
                                    html: htmlContent
                                };

                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.error('Error sending email:', error);
                                        return res.render(`${language}/error`, {
                                            message: language === 'en'
                                                ? 'Error sending confirmation email. Please try again.'
                                                : 'Errore nell\'invio dell\'email di conferma. Riprova.',
                                            contactID: contactId
                                        });
                                    }
                                    console.log('Email sent:', info.response);
                                });
                            });
                        });
                    }

                    // Prepare field data for success page
                    const fieldData = {};
                    reservationOptions.fields.forEach(field => {
                        fieldData[field.id] = fieldValues[field.id] || '';
                    });
                    // Add custom object location to field data
                    fieldData.customObjectLocation = customObjectLocation;
                    
                    // Render the language-specific template
                    res.render(`${language}/reservationsSuccess`, {
                        email: contact.email,
                        name: contact.firstname,
                        fieldData: fieldData,
                        qrCode: qrCode,
                        lang: language,
                        faction: '', // Required by the template
                        totem: ''
                    });

                } catch (error) {
                    logger.error('Error processing reservation:', error);
                    logger.error('Error details:', {
                        contactId,
                        day,
                        location,
                        errorMessage: error.message,
                        errorStack: error.stack
                    });
                    return res.render(`${language}/error`, {
                        message: language === 'en'
                            ? 'Error processing reservation. Please try again.'
                            : 'Errore nell\'elaborazione della prenotazione. Riprova.',
                        contactID: contactId
                    });
                }
            });
        } else {
            res.render(`${language}/full`, { 
                message: language === 'en' 
                    ? 'No places available for the selected option.' 
                    : 'Non ci sono posti disponibili per l\'opzione selezionata.'
            });
        }
    } catch (error) {
        console.error('Error fetching contact data:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error fetching contact data. Please try again.'
                : 'Errore nel recupero dei dati di contatto. Riprova.',
            contactID: contactId
        });
    }
});

// Management interface routes
app.get('/manage-reservations', (req, res) => {
    const { lang } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    
    res.render(`${language}/manageReservations`, { data: reservationOptions });
});

app.get('/reservations-success', (req, res) => {
    const { lang } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    
    res.render(`${language}/reservationsSuccess`);
});

app.get('/reservations-error', (req, res) => {
    const { lang, message } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    
    res.render(`${language}/reservationsError`, { 
        message: message || (language === 'en' ? 'Unknown error' : 'Errore sconosciuto')
    });
});

app.post('/api/reservation-options', (req, res) => {
    try {
        let newOptions = {};
        const language = req.body.lang === 'en' ? 'en' : 'it';
        
        console.log('Received reservation options submission with language:', language);
        console.log('Request body:', req.body);
        
        // Handle form submission with individual fields
        if (req.body.days && req.body.locations && req.body.limits) {
            try {
                console.log('Processing form submission with individual fields');
                newOptions.days = JSON.parse(req.body.days);
                newOptions.locations = JSON.parse(req.body.locations);
                newOptions.limits = JSON.parse(req.body.limits);
            } catch (parseError) {
                console.error('Error parsing form data:', parseError);
                const errorMessage = language === 'en' 
                    ? 'Invalid data format: Could not parse JSON' 
                    : 'Formato dati non valido: Impossibile analizzare JSON';
                return res.render(`${language}/reservationsError`, { 
                    message: errorMessage
                });
            }
        } 
        // Handle direct JSON submission (for AJAX)
        else if (typeof req.body.days === 'undefined') {
            console.log('Processing direct JSON submission');
            newOptions = req.body;
            
            // Remove the lang property before saving
            if (newOptions.lang) {
                delete newOptions.lang;
            }
        }
        // Handle malformed request
        else {
            console.error('Malformed request received');
            const errorMessage = language === 'en' 
                ? 'Invalid request format' 
                : 'Formato della richiesta non valido';
            return res.render(`${language}/reservationsError`, { 
                message: errorMessage
            });
        }
        
        // Basic validation for new format
        if (!Array.isArray(newOptions.fields) || typeof newOptions.limits !== 'object') {
            console.error('Invalid data format after parsing');
            const errorMessage = language === 'en'
                ? 'Invalid data format: fields must be an array and limits must be an object'
                : 'Formato dati non valido: fields deve essere un array e limits deve essere un oggetto';
                
            return res.render(`${language}/reservationsError`, {
                message: errorMessage
            });
        }
        
        // Validate each field has required properties
        for (const field of newOptions.fields) {
            if (!field.id || !field.name || !field.type || !Array.isArray(field.values)) {
                console.error('Invalid field format:', field);
                const errorMessage = language === 'en'
                    ? 'Invalid field format: each field must have id, name, type, and values array'
                    : 'Formato campo non valido: ogni campo deve avere id, name, type e un array values';
                    
                return res.render(`${language}/reservationsError`, {
                    message: errorMessage
                });
            }
        }

        // Save to file
        fs.writeFileSync(
            path.join(__dirname, 'reservationOptions.json'), 
            JSON.stringify(newOptions, null, 2)
        );

        // Update the in-memory options
        Object.assign(reservationOptions, newOptions);

        console.log('Reservation options saved successfully');
        
        // Render the success page directly instead of redirecting
        return res.render(`${language}/reservationsSuccess`);
    } catch (error) {
        console.error('Error saving reservation options:', error);
        
        const language = req.body.lang === 'en' ? 'en' : 'it';
        const errorMessage = language === 'en' 
            ? `Error saving changes: ${error.message}` 
            : `Errore nel salvare le modifiche: ${error.message}`;
        
        // Render the error page directly instead of redirecting
        return res.render(`${language}/reservationsError`, { 
            message: errorMessage
        });
    }
});

// Handle submission from the new registration form
app.post('/submit-registration', async (req, res) => {
    const { contactID, day, location, lang } = req.body;
    const language = lang === 'en' ? 'en' : 'it';
    
    // Redirect to the selection page with the contactID, language, and location
    res.redirect(`/selection?contactID=${contactID}&lang=${language}&location=${encodeURIComponent(location)}`);
});

// Migration endpoint to convert old format to new format
app.get('/migrate-data', (req, res) => {
    try {
        // Check if already migrated
        if (Array.isArray(reservationOptions.fields)) {
            return res.send('Data already in new format');
        }
        
        // Create new structure
        const newOptions = {
            fields: [],
            limits: {}
        };
        
        // Migrate days field
        if (Array.isArray(reservationOptions.days)) {
            newOptions.fields.push({
                id: 'day',
                name: 'Day',
                type: 'date',
                values: reservationOptions.days
            });
        }
        
        // Migrate locations field
        if (Array.isArray(reservationOptions.locations)) {
            newOptions.fields.push({
                id: 'location',
                name: 'Location',
                type: 'text',
                values: reservationOptions.locations
            });
        }
        
        // Migrate limits
        if (typeof reservationOptions.limits === 'object') {
            Object.assign(newOptions.limits, reservationOptions.limits);
        }
        
        // Save to file
        fs.writeFileSync(
            path.join(__dirname, 'reservationOptions.json'),
            JSON.stringify(newOptions, null, 2)
        );
        
        // Update in-memory options
        Object.assign(reservationOptions, newOptions);
        
        res.send('Migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
        res.status(500).send(`Error during migration: ${error.message}`);
    }
});

// Landing page and email form routes
app.get('/landing', (req, res) => {
    const { lang } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    res.render(`${language}/landing`);
});

app.get('/new-registration', (req, res) => {
    const { contactID, lang } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    
    // If no contactID is provided, redirect to the register page
    if (!contactID) {
        return res.redirect(`/register?lang=${language}`);
    }
    
    // Fetch reservation options for the form
    try {
        res.render(`${language}/newRegistration`, {
            contactId: contactID,
            options: reservationOptions
        });
    } catch (error) {
        logger.error('Error rendering new registration page:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error loading registration form. Please try again.'
                : 'Errore nel caricamento del modulo di registrazione. Riprova.',
            contactID: contactID
        });
    }
});

app.get('/register', (req, res) => {
    const { lang } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    res.render(`${language}/emailForm`);
});

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

// Pagina di conferma corsi
app.get('/confirm-courses', async (req, res) => {
    const { contactID, lang, location } = req.query;
    const language = lang === 'en' ? 'en' : 'it';
    
    if (!contactID) {
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Contact ID is required' : 'ID contatto richiesto',
            contactID: ''
        });
    }
    
    try {
        logger.info(`Mostrando pagina di conferma corsi per contatto ID: ${contactID}`);
        
        // Per ora, utilizziamo dati mock
        // In produzione, questi dati dovrebbero essere recuperati da HubSpot
        const mockCourses = [
            { id: 'course1', title: 'Introduzione alla Medicina', date: '2025-05-10 10:00', location: 'Aula Magna' },
            { id: 'course2', title: 'Biologia Cellulare', date: '2025-05-11 14:30', location: 'Laboratorio B' }
        ];
        
        res.render(`${language}/confirmCourses`, {
            contactId: contactID,
            courses: mockCourses
        });
    } catch (error) {
        logger.error('Errore nel caricamento della pagina di conferma corsi:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error loading course confirmation page. Please try again.'
                : 'Errore nel caricamento della pagina di conferma corsi. Riprova.',
            contactID: contactID
        });
    }
});

// Elaborazione della conferma dei corsi
app.post('/submit-course-confirmation', async (req, res) => {
    const { contactID, courses, lang } = req.body;
    const language = lang === 'en' ? 'en' : 'it';
    
    if (!contactID) {
        return res.render(`${language}/error`, {
            message: language === 'en' ? 'Contact ID is required' : 'ID contatto richiesto',
            contactID: ''
        });
    }
    
    try {
        logger.info(`Elaborazione conferma corsi per contatto ID: ${contactID}`);
        
        // Converti courses in array se non lo è già
        const courseIds = Array.isArray(courses) ? courses : [courses];
        
        // Salva i corsi confermati nel database
        await courseExperienceService.saveConfirmedCourses(db, contactID, courseIds);
        
        // Recupera le esperienze disponibili in base ai corsi confermati
        const availableExperiences = await courseExperienceService.getAvailableExperiences(db, courseIds);
        
        // Renderizza la pagina di selezione esperienze
        res.render(`${language}/selectExperiences`, {
            contactId: contactID,
            experiences: availableExperiences,
            confirmedCourses: courseIds
        });
    } catch (error) {
        logger.error('Errore nella conferma dei corsi:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error confirming courses. Please try again.'
                : 'Errore nella conferma dei corsi. Riprova.',
            contactID: contactID
        });
    }
});

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
                        experiences: experiencesDetails
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

app.post('/decodeqr', async (req, res) => {
    try {
        // Decodifica il contenuto del QR code
        let msg = xorCipher.decode(req.body.qrContent, xorKey);
        let contactID = msg.split("**")[1];
        let email = msg.split("**")[0];
        
        // Ottieni le informazioni di base del contatto
        const contactResponse = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts/' + contactID + '?properties=ischeckin,isregistered,firstname,lastname,email');
        console.log("Contatto recuperato:", JSON.stringify(contactResponse.data, null, 4));
        
        // Estrai le proprietà di base del contatto
        let isCheckIn = contactResponse.data.properties.ischeckin;
        let isRegistered = contactResponse.data.properties.isregistered;
        let firstname = contactResponse.data.properties.firstname;
        let lastname = contactResponse.data.properties.lastname;
        
        // Inizializza l'oggetto di risposta con le informazioni di base
        let datares = {
            id: contactID,
            firstname: firstname,
            lastname: lastname,
            email: email
        };
        
        // Rimossi i controlli su isCheckIn e isRegistered come richiesto
        
        // Ottieni l'ID del custom object type dalle variabili d'ambiente
        const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
        if (!customObjectTypeId) {
            logger.error('HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables');
            datares.error = "Errore di configurazione del server";
            return res.json(datares);
        }
        
        // Verifica se il contatto ha un custom object associato
        logger.info(`Checking for custom object associations for contact ID: ${contactID}`);
        const associationsResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactID}/associations/${customObjectTypeId}`
        );
        
        // Se ci sono associazioni, recupera i dettagli del custom object
        if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
            // Ottieni l'ID del primo custom object associato
            const customObjectId = associationsResponse.data.results[0].toObjectId;
            logger.info(`Found custom object association: ${customObjectId}`);
            
            // Recupera i campi specifici del custom object
            const customObjectResponse = await axios.get(
                `https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}?properties=location,ritiro_avvenuto,data_ritiro_text`
            );
            
            // Aggiungi i campi del custom object all'oggetto di risposta
            datares.location = customObjectResponse.data.properties.location || '';
            datares.ritiro_avvenuto = customObjectResponse.data.properties.ritiro_avvenuto || 'false';
            datares.data_ritiro_text = customObjectResponse.data.properties.data_ritiro_text || '';
            
            // Verifica se la data di ritiro corrisponde al giorno corrente
            const today = new Date();
            const formattedToday = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            if (datares.data_ritiro_text && datares.data_ritiro_text !== formattedToday) {
                // Imposta come errore invece che come avviso
                datares.error = "data errata";
            }
            
            logger.info(`Custom object details: ${JSON.stringify(customObjectResponse.data.properties)}`);
        } else {
            // Nessun custom object associato trovato
            logger.info(`No custom object association found for contact ID: ${contactID}`);
            // Imposta come errore invece che come avviso
            datares.error = "utente non invitato";
        }
        
        console.log("Risposta finale:", datares);
        res.json(datares);
    } catch (error) {
        console.error('Error in /decodeqr:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/docheckin/:contactID', async (req, res) => {
    try {
        const contactID = req.params.contactID;
        console.log("CHECKIN " + contactID);
        
        // Non aggiornare più il campo ischeckin come richiesto
        
        // Ottieni l'ID del custom object type dalle variabili d'ambiente
        const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
        if (!customObjectTypeId) {
            logger.error('HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables');
            return res.json({ result: "success", warning: "Custom object not updated due to missing configuration" });
        }
        
        // Verifica se il contatto ha un custom object associato
        logger.info(`Checking for custom object associations for contact ID: ${contactID}`);
        const associationsResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactID}/associations/${customObjectTypeId}`
        );
        
        // Se ci sono associazioni, aggiorna il custom object
        if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
            // Ottieni l'ID del primo custom object associato
            const customObjectId = associationsResponse.data.results[0].toObjectId;
            logger.info(`Found custom object association: ${customObjectId}`);
            
            // Il codice per creare la data formattata è stato rimosso poiché non è più necessario
            
            // Aggiorna le proprietà del custom object
            // Nota: data_ritiro_text viene impostato solo al momento della prenotazione con il valore dello slot selezionato
            // e non viene più aggiornato durante il check-in (come richiesto)
            await axios.patch(`https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}`, {
                "properties": {
                    ritiro_avvenuto: "true"
                    // data_ritiro_text non viene più aggiornato qui
                }
            });
            
            logger.info(`Updated custom object ${customObjectId} with ritiro_avvenuto=true`);
            res.json({ result: "success", custom_object_updated: true });
        } else {
            // Nessun custom object associato trovato
            logger.info(`No custom object association found for contact ID: ${contactID}`);
            res.json({ result: "success", warning: "No custom object association found" });
        }
    } catch (error) {
        console.error('Error in /docheckin:', error);
        res.status(500).json({ error: 'Error updating data' });
    }
});


// Server configuration
const RUNLOCAL = process.env.RUNLOCAL === '1';

if (RUNLOCAL) {
    const http = require('http');
const courseExperienceService = require('./courseExperienceService');
    http.createServer(app).listen(port, () => {
        console.log(`HTTP server listening on port ${port}`);
    });
} else {
    https.createServer({
        key: fs.readFileSync(`/etc/letsencrypt/live/${siteName}/privkey.pem`),
        cert: fs.readFileSync(`/etc/letsencrypt/live/${siteName}/fullchain.pem`)
    }, app).listen(port, () => {
        console.log(`HTTPS server listening on port ${port}`);
    });
}