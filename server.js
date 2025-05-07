const path = require('path');
const express = require('express');
const { getRemainingSlots } = require('./remainingSlots');
const slotCalculationService = require('./slotCalculationService');

// Create a replacement for reservationOptions that gets data from the database
const reservationOptions = {
    fields: [],
    limits: {}
};

/**
 * Load reservation options from the database
 * @param {Object} db - Database instance
 * @returns {Promise<void>}
 */
async function loadReservationOptions(db) {
    try {
        console.log('Loading reservation options from database...');
        
        // Load experience limits
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, max_participants FROM experiences",
                (err, rows) => {
                    if (err) {
                        console.error('Error loading experience limits:', err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        // Initialize the limits object
        for (const exp of experiences) {
            // Create keys for each time slot of the experience
            // Assuming there are up to 5 time slots per experience
            for (let i = 1; i <= 5; i++) {
                const key = `${exp.experience_id}_${exp.experience_id}-${i}`;
                reservationOptions.limits[key] = exp.max_participants;
            }
        }
        
        // For backward compatibility, add some default fields
        reservationOptions.fields = [
            {
                id: "day",
                name: "Day",
                type: "date",
                values: ["2025-04-07", "2025-04-08", "2025-04-09"]
            }
        ];
        
        console.log('Reservation options loaded from database');
    } catch (error) {
        console.error('Error loading reservation options:', error);
    }
}
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cache-Control, Pragma, Expires');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
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

// Serve otto.json for the frontend
app.get('/otto.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'otto.json'));
});

// Serve the fix_frontend_reservation.js file
app.get('/fix_frontend_reservation.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'fix_frontend_reservation.js'));
});

// Serve the fix_frontend.html file
app.get('/fix_frontend', (req, res) => {
  res.sendFile(path.join(__dirname, 'fix_frontend.html'));
});

// Serve the frontend app for language-specific routes and root
app.get(['/en/opendays', '/it/opendays', '/opendays', '/en/opendays/confirmation', '/it/opendays/confirmation', '/it/opendays/genitori', '/en/opendays/genitori', '/opendays/genitori'], async (req, res) => {
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

    // Function to get matching courses from otto.json
    function getMatchingCoursesFromOtto(courseTypes) {
        try {
            logger.info(`Attempting to read otto.json file...`);
            logger.info(`Current directory: ${__dirname}`);
            const coursesPath = path.join(__dirname, 'otto.json');
            logger.info(`Full path to otto.json: ${coursesPath}`);
            logger.info(`File exists: ${fs.existsSync(coursesPath)}`);
            
            const coursesData = fs.readFileSync(coursesPath, 'utf8');
            logger.info(`Successfully read otto.json file`);
            logger.info(`Courses data length: ${coursesData.length} characters`);
            
            const allCourses = JSON.parse(coursesData);
            logger.info(`Parsed ${allCourses.length} courses from otto.json`);
            logger.info(`Looking for courses with course types: ${courseTypes.join(', ')}`);
            
            // Filter courses by matching course types
            const matchingCourses = allCourses.filter(course =>
                courseTypes.includes(course.id)
            );
            
            logger.info(`Found ${matchingCourses.length} matching courses in otto.json`);
            logger.info(`Matching courses: ${JSON.stringify(matchingCourses)}`);
            
            return matchingCourses;
        } catch (error) {
            logger.error('Error reading otto.json data:', error);
            logger.error('Error stack:', error.stack);
            return [];
        }
    }

    // Function to generate QR code that returns a Promise
    function generateQRCode(text2encode) {
        return new Promise((resolve, reject) => {
            QRCode.toDataURL(text2encode, (err, qrCode) => {
                if (err) {
                    logger.error('Error generating QR code:', err);
                    return reject(err);
                }
                resolve(qrCode);
            });
        });
    }
    
    // Function to save QR code to file that returns a Promise
    function saveQRCodeToFile(qrCode) {
        return new Promise((resolve, reject) => {
            const qrFileName = `${uuidv4()}.png`;
            const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
            const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
            
            fs.writeFile(qrFilePath, qrBuffer, (err) => {
                if (err) {
                    logger.error('Error saving QR code image:', err);
                    return reject(err);
                }
                const qrCodeUrl = `qrimg/${qrFileName}`;
                resolve(qrCodeUrl);
            });
        });
    }
    
    // Function to send email with QR code that returns a Promise
    function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false) {
        return new Promise((resolve, reject) => {
            console.log("XXXXX");
            
            // Add detailed logging for matchingCourses parameter
            logger.info(`sendEmailWithQR received matchingCourses: ${matchingCourses ? (Array.isArray(matchingCourses) ? matchingCourses.length : 'not an array') : 'undefined'}`);
            logger.info(`matchingCourses type: ${typeof matchingCourses}`);
            if (matchingCourses && Array.isArray(matchingCourses) && matchingCourses.length > 0) {
                logger.info(`First matchingCourse: ${JSON.stringify(matchingCourses[0])}`);
                logger.info(`matchingCourses IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
            } else {
                logger.info(`matchingCourses is empty or not an array`);
            }
            
            // Validate language parameter
            if (!language || (language !== 'en' && language !== 'it')) {
                logger.info(`Invalid or empty language parameter: "${language}". Using default language: "en"`);
                language = 'en';
            } else {
                logger.info(`Using language: "${language}" for email template`);
            }
            
            // Se matchingCourses è vuoto, carica TUTTI i corsi dalla fonte appropriata
            if (!matchingCourses || matchingCourses.length === 0) {
                if (useOttoJson === true) {
                    // Se useOttoJson è true (non si arriva dal submit), carica tutti i corsi da otto.json
                    try {
                        const coursesPath = path.join(__dirname, 'otto.json');
                        const coursesData = fs.readFileSync(coursesPath, 'utf8');
                        matchingCourses = JSON.parse(coursesData);
                        logger.info(`Using all courses from otto.json, found ${matchingCourses.length} courses`);
                    } catch (error) {
                        logger.error('Error reading all courses from otto.json:', error);
                        matchingCourses = [];
                    }
                } else {
                    // Se useOttoJson è false (si arriva dal submit), carica tutti i corsi da corsi.json
                    try {
                        const coursesPath = path.join(__dirname, 'corsi.json');
                        const coursesData = fs.readFileSync(coursesPath, 'utf8');
                        matchingCourses = JSON.parse(coursesData);
                        logger.info(`Using all courses from corsi.json, found ${matchingCourses.length} courses`);
                    } catch (error) {
                        logger.error('Error reading all courses from corsi.json:', error);
                        matchingCourses = [];
                    }
                }
            }
            
            // Prepare email data with the same structure as the confirmation page
            const emailData = {
                name: contact.firstname,
                email: contact.email,
                qrCode: qrCodeUrl,
                type: 2, // Use email_courses.ejs template
                language: language, // Add language
                fieldData: {
                    courses: matchingCourses.map(course => ({
                        title: course.name || course.title,
                        date: "May 10, 2025", // Fixed date for Open Day
                        location: course.location || "Main Campus",
                        time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
                    })),
                    experiences: validExperiences,
                    frontali: [] // Empty array if no frontali experiences
                }
            };
            
            logger.info(`Preparing to send email with QR code to ${contact.email}, QR URL: ${qrCodeUrl}`);
            logger.info(`Email data structure: ${JSON.stringify({
                name: typeof emailData.name,
                email: typeof emailData.email,
                qrCode: typeof emailData.qrCode,
                type: emailData.type,
                language: emailData.language,
                fieldData: {
                    courses: Array.isArray(emailData.fieldData.courses) ? emailData.fieldData.courses.length : 'not an array',
                    experiences: Array.isArray(emailData.fieldData.experiences) ? emailData.fieldData.experiences.length : 'not an array',
                    frontali: Array.isArray(emailData.fieldData.frontali) ? emailData.fieldData.frontali.length : 'not an array'
                }
            }, null, 2)}`);
            logger.info(`Email data content: ${JSON.stringify(emailData, null, 2)}`);
            
            // Log template path to verify it exists
            const templatePath = path.join(__dirname, 'views', language, 'email.ejs');
            logger.info(`Using email template: ${templatePath}`);
            
            // Render email template
            ejs.renderFile(
                templatePath,
                emailData,
                (err, htmlContent) => {
                    if (err) {
                        logger.error('Error rendering email template:', err);
                        logger.error('Template error details:', err.stack);
                        return reject(err);
                    }
                    
                    logger.info('Email template rendered successfully');
                    logger.info(`HTML content length: ${htmlContent.length}`);
                    logger.info(`HTML content preview: ${htmlContent.substring(0, 200)}...`);
                    
                    // Determine recipient email
                    let recipientEmail = contact.email;
                    // if (HUBSPOT_DEV == 1) {
                        // recipientEmail = "guanxi_4@studenti.unisr.it"; // Development email
                        // logger.info(`Development mode: redirecting email to ${recipientEmail}`);
                    // }
                    
                    // Prepare mail options
                    const mailOptions = {
                        from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
                        to: recipientEmail,
                        subject: language === 'en'
                            ? `${contact.firstname}, your Open Day registration is confirmed`
                            : `${contact.firstname}, la tua registrazione all'Open Day è confermata`,
                        replyTo: 'info.unisr@unisr.it',
                        html: htmlContent
                    };
                    
                    logger.info(`Mail options prepared: to=${recipientEmail}, subject="${mailOptions.subject}"`);
                    
                    // Send email
                    if (SENDMAIL == 1) {
                        logger.info('Attempting to send email...');
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                logger.error('Error sending email:', error);
                                logger.error('Error details:', error.stack);
                                logger.error('Mail options that failed:', JSON.stringify(mailOptions, null, 2));
                                return reject(error);
                            } else {
                                logger.info('Email sent successfully:', info.response);
                                logger.info('Message ID:', info.messageId);
                                return resolve(info);
                            }
                        });
                    } else {
                        logger.info('Email sending is disabled (SENDMAIL=0). Would have sent email with options:', JSON.stringify(mailOptions, null, 2));
                        return resolve({ disabled: true });
                    }
                }
            );
        });
    }

    // Default redirect for /opendays
    if (req.path === '/opendays') {
        return res.redirect('/en/opendays');
    }
    
    // Extract language from path
    const pathParts = req.path.split('/');
    const language = pathParts[1] === 'en' || pathParts[1] === 'it' ? pathParts[1] : 'en';
    
    // Check if this is a confirmation page - if so, skip the otto.json check
    const isConfirmationPage = req.path.includes('/confirmation');
    if (isConfirmationPage) {
        logger.info(`Serving confirmation page: ${req.path}`);
        return res.sendFile(path.join(__dirname, 'front/dist/index.html'));
    }
    
    // Check if contactID is provided
    const { contactID } = req.query;
    
    // If no contactID, just serve the frontend app
    if (!contactID) {
        return res.sendFile(path.join(__dirname, 'front/dist/index.html'));
    }
    
    try {
        logger.info(`Processing /opendays route for contact ID: ${contactID} in language: ${language}`);
        
        // Get custom objects from HubSpot
        const customObjects = await hubspotExperienceService.getAllCustomObjects(contactID);
        
        if (customObjects.error) {
            logger.error(`Error getting custom objects: ${customObjects.error}`);
            // Continue to frontend app even if there's an error
            return res.sendFile(path.join(__dirname, 'front/dist/index.html'));
        }
        
        // Extract IDs from custom objects
        const customObjectIds = customObjects.map(obj => obj.id);
        logger.info(`Custom object IDs: ${customObjectIds.join(', ')}`);
        
        // Load otto.json
        const ottoCourses = require('./otto.json');
        const ottoCourseIds = ottoCourses.map(course => course.id);
        logger.info(`Otto course IDs: ${ottoCourseIds.join(', ')}`);
        
        // Check for matches between custom objects and otto.json
        const matchingOttoCourseIds = [];
        for (const customId of customObjectIds) {
            for (const courseId of ottoCourseIds) {
                // Try string comparison
                if (String(customId) === String(courseId)) {
                    logger.info(`Match found in otto.json: ${customId} matches ${courseId}`);
                    matchingOttoCourseIds.push(customId);
                    break;
                }
                // Try number comparison if both can be converted to numbers
                else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
                    logger.info(`Numeric match found in otto.json: ${customId} matches ${courseId}`);
                    matchingOttoCourseIds.push(customId);
                    break;
                }
            }
        }
        
        if (matchingOttoCourseIds.length > 0) {
            const redirectUrl = `/${language}/opendays/confirmation?contactID=${contactID}&matchingCourseIds=${matchingOttoCourseIds.join(',')}`;
            logger.info(`Found ${matchingOttoCourseIds.length} matches in otto.json: ${matchingOttoCourseIds.join(', ')}`);
            logger.info(`Redirecting to: ${redirectUrl}`);
            
            // Aggiungi qui il codice per inviare l'email con QR code prima del redirect
            try {
                // 1. Recupera i dettagli del contatto da HubSpot
                const contactResponse = await axios.get(
                    `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}?properties=email,firstname,lastname`
                );
                const contact = contactResponse.data.properties;
                
                // 2. Genera e salva il codice QR
                const text2encode = contact.email + '**' + contactID;
                const encoded = xorCipher.encode(text2encode, xorKey);
                const qrCode = await generateQRCode(encoded);
                const qrCodeUrl = await saveQRCodeToFile(qrCode);
                
                // 3. Ottieni i corsi corrispondenti direttamente da otto.json
                const matchingCourses = getMatchingCoursesFromOtto(matchingOttoCourseIds);
                
                // 4. Chiama sendEmailWithQR con array vuoto per le esperienze
                await sendEmailWithQR(contact, qrCodeUrl, [], language, matchingCourses);
                
                logger.info(`Email with QR code sent successfully to ${contact.email}`);
            } catch (error) {
                // Log dell'errore ma continua con il redirect
                logger.error('Error sending email with QR code:', error);
                logger.error('Continuing with redirect anyway');
            }
            
            // Redirect to the confirmation page with the matching course IDs
            return res.redirect(redirectUrl);
        }
        
        // If no matches found, proceed with normal flow
        logger.info(`No matches found in otto.json, proceeding with normal flow`);
        return res.sendFile(path.join(__dirname, 'front/dist/index.html'));
    } catch (error) {
        logger.error('Error in /opendays route:', error);
        // Continue to frontend app even if there's an error
        return res.sendFile(path.join(__dirname, 'front/dist/index.html'));
    }
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
var groupKey = process.        // If matches found in otto.json, redirect to confirmation page
env.GROUPKEY;
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
        // Use the new slot calculation service instead of getRemainingSlots
        globalRemainingSlots = await slotCalculationService.getAllAvailableSlots(db);
        
        console.log('Posti rimanenti aggiornati:', JSON.stringify(globalRemainingSlots));
    } catch (error) {
        console.error('Errore nell\'aggiornamento dei posti rimanenti:', error);
    }
}

const ISOPEN = false;
console.log("--- STARTING UNISR SERVER ON PORT " + port);

// Ensure the qrimg directory exists
const qrImgDir = path.join(__dirname, 'public', 'qrimg');
if (!fs.existsSync(qrImgDir)) {
    fs.mkdirSync(qrImgDir, { recursive: true });
    console.log(`Created directory: ${qrImgDir}`);
}

const db = new sqlite3.Database("fcfs.sqlite", async (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Setup del database fcfs.sqlite`);
    
    // Load reservation options from the database
    await loadReservationOptions(db);
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
    db.run(`CREATE TABLE IF NOT EXISTS opend_reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id TEXT,
            experience_id TEXT,
            time_slot_id TEXT,
            qr_code_url TEXT,
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
const reservationService = require('./reservationService');
const experiencesService = require('./experiencesService');

// Import and initialize the simplified experiences admin panel routes
const addExperiencesRoutes = require('./add_experiences_routes');
addExperiencesRoutes(app, db);

// Import and initialize the experiences API routes
const addExperiencesApiRoutes = require('./add_experiences_api');
addExperiencesApiRoutes(app, db);

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
        
        // Filter the original IDs for the response
        const originalFilteredObjectIds = [];
        for (const customId of customObjectIds) {
            for (const courseId of courseIds) {
                // Try string comparison
                if (String(customId) === String(courseId)) {
                    logger.info(`Original match found: ${customId} matches ${courseId}`);
                    originalFilteredObjectIds.push(customId);
                    break;
                }
                // Try number comparison if both can be converted to numbers
                else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
                    logger.info(`Original numeric match found: ${customId} matches ${courseId}`);
                    originalFilteredObjectIds.push(customId);
                    break;
                }
            }
        }
        
        // Create modified IDs for the database query
        const targetIds = ['25417865498', '25417865493', '25417865392'];
        const replacementId = '25326449768';
        
        // Convert all IDs to strings for consistent comparison
        const processedCustomObjectIds = customObjectIds.map(id => {
            const strId = String(id);
            // If the ID is one of the target IDs, replace it with the replacement ID
            if (targetIds.includes(strId)) {
                logger.info(`Replacing custom object ID ${strId} with ${replacementId} for database query`);
                return replacementId;
            }
            return strId;
        });
        
        // Remove duplicates of the replacement ID
        const queryObjectIds = [];
        const replacementIdCount = {};
        
        processedCustomObjectIds.forEach(id => {
            // If it's the replacement ID, check if we've already added it
            if (id === replacementId) {
                if (!replacementIdCount[replacementId]) {
                    replacementIdCount[replacementId] = 0;
                    queryObjectIds.push(id);
                }
                replacementIdCount[replacementId]++;
                logger.info(`Found ${replacementId} for query (count: ${replacementIdCount[replacementId]})`);
            } else {
                // For other IDs, always add them
                queryObjectIds.push(id);
            }
        });
        
        logger.info(`Original custom object IDs: ${customObjectIds.join(', ')}`);
        logger.info(`Query object IDs: ${queryObjectIds.join(', ')}`);
        
        // Filter the query IDs for the database query
        const queryFilteredObjectIds = [];
        for (const customId of queryObjectIds) {
            for (const courseId of courseIds) {
                // Try string comparison
                if (String(customId) === String(courseId)) {
                    logger.info(`Query match found: ${customId} (${typeof customId}) matches ${courseId} (${typeof courseId})`);
                    queryFilteredObjectIds.push(customId);
                    break;
                }
                // Try number comparison if both can be converted to numbers
                else if (!isNaN(Number(customId)) && !isNaN(Number(courseId)) && Number(customId) === Number(courseId)) {
                    logger.info(`Query numeric match found: ${customId} (${typeof customId}) matches ${courseId} (${typeof courseId})`);
                    queryFilteredObjectIds.push(customId);
                    break;
                }
            }
        }
        
        // If no matching custom objects found for the query, return an empty response
        if (queryFilteredObjectIds.length === 0) {
            logger.info(`No matching custom objects found for database query for contact ID: ${contactID}`);
            return res.json({
                experiences: [],
                matchingCourseIds: []
            });
        }
        
        // Get experiences from the database based on the filtered query IDs, language, and contactID
        const experiences = await courseExperienceService.getExperiencesByCustomObjectIds(db, queryFilteredObjectIds, language, contactID);
        
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
        
        // Return the experiences and original matching course IDs as JSON
        logger.info(`Returning original filtered object IDs: ${originalFilteredObjectIds.join(', ')}`);
        
        res.json({
            experiences: experiences,
            matchingCourseIds: originalFilteredObjectIds
        });
    } catch (error) {
        logger.error('Error in /api/get_experiences:', error);
        res.status(500).json({
            error: language === 'en' ? 'Internal server error' : 'Errore interno del server'
        });
    }
});

// Temporary endpoint for debugging - returns raw slot availability data
app.get('/api/get_raw_slots', async (req, res) => {
    try {
        logger.info('Getting raw slot availability data');
        
        // Get all available slots
        const availableSlots = await slotCalculationService.getAllAvailableSlots(db);
        
        // Log the data for debugging
        logger.info(`Retrieved available slots: ${JSON.stringify(availableSlots)}`);
        
        // Return the raw data
        res.json(availableSlots);
    } catch (error) {
        logger.error('Error in /api/get_raw_slots:', error);
        res.status(500).json({
            error: 'Internal server error'
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

// Endpoint to make a reservation
app.post('/api/reserve', async (req, res) => {
    const { contactID, experienceId, timeSlotId, dbId, replaceAll } = req.body;
    
    if (!contactID || !experienceId || !timeSlotId) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    // Log the received parameters
    logger.info(`Reservation request received: contactID=${contactID}, experienceId=${experienceId}, timeSlotId=${timeSlotId}, dbId=${dbId}, replaceAll=${replaceAll}`);
    
    try {
        // Inizia una transazione
        await new Promise((resolve, reject) => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) {
                    logger.error(`Errore nell'iniziare la transazione: ${err.message}`);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
        try {
            // Se è stato fornito dbId, usa direttamente quello
            let slot;
            if (dbId) {
                logger.info(`Using provided dbId: ${dbId}`);
                slot = await new Promise((resolve, reject) => {
                    db.get(
                        "SELECT id, current_participants, max_participants FROM experiences WHERE id = ?",
                        [dbId],
                        (err, row) => {
                            if (err) {
                                logger.error(`Errore nel recupero dello slot con ID: ${err.message}`);
                                reject(err);
                            } else {
                                resolve(row);
                            }
                        }
                    );
                });
            } else {
                // Fallback: ottieni l'ID dello slot usando experience_id
                logger.info(`No dbId provided, falling back to experienceId: ${experienceId}`);
                slot = await new Promise((resolve, reject) => {
                    db.get(
                        "SELECT id, current_participants, max_participants FROM experiences WHERE experience_id = ?",
                        [experienceId],
                        (err, row) => {
                            if (err) {
                                logger.error(`Errore nel recupero dello slot: ${err.message}`);
                                reject(err);
                            } else {
                                resolve(row);
                            }
                        }
                    );
                });
            }
            
            if (!slot) {
                logger.warn(`Nessuno slot trovato con ${dbId ? 'ID ' + dbId : 'experience_id ' + experienceId}`);
                await new Promise((resolve) => {
                    db.run("ROLLBACK", () => resolve());
                });
                return res.status(404).json({
                    success: false,
                    error: 'Slot not found',
                    errorCode: 'SLOT_NOT_FOUND'
                });
            }
            
            logger.info(`Slot trovato: ID=${slot.id}, current=${slot.current_participants}, max=${slot.max_participants}`);
            
            // Verifica che ci siano ancora posti disponibili
            if (slot.current_participants >= slot.max_participants) {
                logger.warn(`No spots available for slot ID ${slot.id} (experience ${experienceId})`);
                await new Promise((resolve) => {
                    db.run("ROLLBACK", () => resolve());
                });
                return res.status(409).json({
                    success: false,
                    error: 'No spots available',
                    errorCode: 'NO_SPOTS_AVAILABLE'
                });
            }
            
            // Salva la prenotazione usando slot.id (dbId) invece di experienceId
            logger.info(`Saving reservation with slot.id=${slot.id} instead of experienceId=${experienceId}`);
            await reservationService.saveReservation(db, contactID, slot.id, timeSlotId, null, replaceAll);
            
            // Incrementa il contatore dei partecipanti usando l'ID dello slot
            await experiencesService.incrementParticipantCount(db, slot.id);
            
            // Commit della transazione
            await new Promise((resolve, reject) => {
                db.run("COMMIT", (err) => {
                    if (err) {
                        logger.error(`Errore nel commit della transazione: ${err.message}`);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
            
            // Aggiorna i posti rimanenti
            await updateRemainingSlots();
            
            // Ritorna successo
            res.json({
                success: true
            });
        } catch (error) {
            // Rollback in caso di errore
            await new Promise((resolve) => {
                db.run("ROLLBACK", () => {
                    logger.info("Transazione annullata a causa di un errore");
                    resolve();
                });
            });
            throw error;
        }
    } catch (error) {
        logger.error('Error in /api/reserve:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Endpoint to get all reservation counters
app.get('/api/reservation-counters', async (req, res) => {
    try {
        const counters = await reservationService.getReservationCounts(db);
        res.json(counters);
    } catch (error) {
        logger.error('Error in /api/reservation-counters:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Endpoint to cancel a reservation
app.post('/api/cancel-reservation', async (req, res) => {
    const { contactID, experienceId, timeSlotId } = req.body;
    
    if (!contactID || !experienceId || !timeSlotId) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Use the new cancelReservation function from reservationService
        await reservationService.cancelReservation(db, contactID, experienceId, timeSlotId);
        
        // Decrement the current_participants field for the specific time slot
        await experiencesService.decrementParticipantCountForTimeSlot(db, experienceId, timeSlotId);
        
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

// Endpoint to reset all reservations for a contact
app.post('/api/reset-reservations', async (req, res) => {
    const { contactID } = req.body;
    
    if (!contactID) {
        return res.status(400).json({
            error: 'Contact ID is required'
        });
    }
    
    logger.info(`Reset reservations request received for contactID=${contactID}`);
    
    try {
        // Inizia una transazione
        await new Promise((resolve, reject) => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) {
                    logger.error(`Errore nell'iniziare la transazione: ${err.message}`);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
        try {
            // 1. Recupera tutte le prenotazioni esistenti dell'utente
            const existingReservations = await reservationService.getReservationsForContact(db, contactID);
            logger.info(`Found ${existingReservations.length} existing reservations for contact ${contactID}`);
            
            // 2. Per ogni prenotazione esistente, decrementa il contatore dei partecipanti
            for (const reservation of existingReservations) {
                logger.info(`Decrementing participant count for experience_id=${reservation.experience_id} (type: ${typeof reservation.experience_id}), time_slot_id=${reservation.time_slot_id}`);
                await experiencesService.decrementParticipantCountForTimeSlot(
                    db,
                    reservation.experience_id,
                    reservation.time_slot_id
                );
            }
            
            // 3. Cancella tutte le prenotazioni esistenti dell'utente
            await reservationService.deleteAllReservationsForContact(db, contactID);
            
            // Commit della transazione
            await new Promise((resolve, reject) => {
                db.run("COMMIT", (err) => {
                    if (err) {
                        logger.error(`Errore nel commit della transazione: ${err.message}`);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
            
            // Aggiorna i posti rimanenti
            await updateRemainingSlots();
            
            // Ritorna successo
            res.json({
                success: true,
                message: `Successfully reset all reservations for contact ${contactID}`
            });
        } catch (error) {
            // Rollback in caso di errore
            await new Promise((resolve) => {
                db.run("ROLLBACK", () => {
                    logger.info("Transazione annullata a causa di un errore");
                    resolve();
                });
            });
            throw error;
        }
    } catch (error) {
        logger.error('Error in /api/reset-reservations:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Test endpoint to check if the server is receiving requests
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit - this should appear in the server logs');
    logger.info('Test endpoint hit - this should appear in the server logs');
    return res.json({ success: true, message: 'Test endpoint working' });
});

        // Function to send email with QR code that returns a Promise
        function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false) {
            return new Promise((resolve, reject) => {
                console.log("XXXXX");
                
                // Add detailed logging for matchingCourses parameter
                logger.info(`sendEmailWithQR received matchingCourses: ${matchingCourses ? (Array.isArray(matchingCourses) ? matchingCourses.length : 'not an array') : 'undefined'}`);
                logger.info(`matchingCourses type: ${typeof matchingCourses}`);
                if (matchingCourses && Array.isArray(matchingCourses) && matchingCourses.length > 0) {
                    logger.info(`First matchingCourse: ${JSON.stringify(matchingCourses[0])}`);
                    logger.info(`matchingCourses IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
                } else {
                    logger.info(`matchingCourses is empty or not an array`);
                }
                
                // Validate language parameter
                if (!language || (language !== 'en' && language !== 'it')) {
                    logger.info(`Invalid or empty language parameter: "${language}". Using default language: "en"`);
                    language = 'en';
                } else {
                    logger.info(`Using language: "${language}" for email template`);
                }
                
                // Se matchingCourses è vuoto, carica TUTTI i corsi dalla fonte appropriata
                if (!matchingCourses || matchingCourses.length === 0) {
                    if (useOttoJson === true) {
                        // Se useOttoJson è true (non si arriva dal submit), carica tutti i corsi da otto.json
                        try {
                            const coursesPath = path.join(__dirname, 'otto.json');
                            const coursesData = fs.readFileSync(coursesPath, 'utf8');
                            matchingCourses = JSON.parse(coursesData);
                            logger.info(`Using all courses from otto.json, found ${matchingCourses.length} courses`);
                        } catch (error) {
                            logger.error('Error reading all courses from otto.json:', error);
                            matchingCourses = [];
                        }
                    } else {
                        // Se useOttoJson è false (si arriva dal submit), carica tutti i corsi da corsi.json
                        try {
                            const coursesPath = path.join(__dirname, 'corsi.json');
                            const coursesData = fs.readFileSync(coursesPath, 'utf8');
                            matchingCourses = JSON.parse(coursesData);
                            logger.info(`Using all courses from corsi.json, found ${matchingCourses.length} courses`);
                        } catch (error) {
                            logger.error('Error reading all courses from corsi.json:', error);
                            matchingCourses = [];
                        }
                    }
                }
                
                // Prepare email data with the same structure as the confirmation page
                const emailData = {
                    name: contact.firstname,
                    email: contact.email,
                    qrCode: qrCodeUrl,
                    type: 2, // Use email_courses.ejs template
                    language: language, // Add language
                    fieldData: {
                        courses: matchingCourses.map(course => ({
                            title: course.name || course.title,
                            date: "May 10, 2025", // Fixed date for Open Day
                            location: course.location || "Main Campus",
                            time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
                        })),
                        experiences: validExperiences,
                        frontali: [] // Empty array if no frontali experiences
                    }
                };
                
                logger.info(`Preparing to send email with QR code to ${contact.email}, QR URL: ${qrCodeUrl}`);
                logger.info(`Email data structure: ${JSON.stringify({
                    name: typeof emailData.name,
                    email: typeof emailData.email,
                    qrCode: typeof emailData.qrCode,
                    type: emailData.type,
                    language: emailData.language,
                    fieldData: {
                        courses: Array.isArray(emailData.fieldData.courses) ? emailData.fieldData.courses.length : 'not an array',
                        experiences: Array.isArray(emailData.fieldData.experiences) ? emailData.fieldData.experiences.length : 'not an array',
                        frontali: Array.isArray(emailData.fieldData.frontali) ? emailData.fieldData.frontali.length : 'not an array'
                    }
                }, null, 2)}`);
                logger.info(`Email data content: ${JSON.stringify(emailData, null, 2)}`);
                
                // Log template path to verify it exists
                const templatePath = path.join(__dirname, 'views', language, 'email.ejs');
                logger.info(`Using email template: ${templatePath}`);
                
                // Render email template
                ejs.renderFile(
                    templatePath,
                    emailData,
                    (err, htmlContent) => {
                        if (err) {
                            logger.error('Error rendering email template:', err);
                            logger.error('Template error details:', err.stack);
                            return reject(err);
                        }
                        
                        logger.info('Email template rendered successfully');
                        logger.info(`HTML content length: ${htmlContent.length}`);
                        logger.info(`HTML content preview: ${htmlContent.substring(0, 200)}...`);
                        
                        // Determine recipient email
                        let recipientEmail = contact.email;
                        // if (HUBSPOT_DEV == 1) {
                            // recipientEmail = "guanxi_4@studenti.unisr.it"; // Development email
                            // logger.info(`Development mode: redirecting email to ${recipientEmail}`);
                        // }
                        
                        // Prepare mail options
                        const mailOptions = {
                            from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
                            to: recipientEmail,
                            subject: language === 'en'
                                ? `${contact.firstname}, your Open Day registration is confirmed`
                                : `${contact.firstname}, la tua registrazione all'Open Day è confermata`,
                            replyTo: 'info.unisr@unisr.it',
                            html: htmlContent
                        };
                        
                        logger.info(`Mail options prepared: to=${recipientEmail}, subject="${mailOptions.subject}"`);
                        
                        // Send email
                        if (SENDMAIL == 1) {
                            logger.info('Attempting to send email...');
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    logger.error('Error sending email:', error);
                                    logger.error('Error details:', error.stack);
                                    logger.error('Mail options that failed:', JSON.stringify(mailOptions, null, 2));
                                    return reject(error);
                                } else {
                                    logger.info('Email sent successfully:', info.response);
                                    logger.info('Message ID:', info.messageId);
                                    return resolve(info);
                                }
                            });
                        } else {
                            logger.info('Email sending is disabled (SENDMAIL=0). Would have sent email with options:', JSON.stringify(mailOptions, null, 2));
                            return resolve({ disabled: true });
                        }
                    }
                );
            });
        }
        

// Endpoint to update selected experiences in HubSpot
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
            logger.info(`matchingCourseIds type: ${typeof matchingCourseIds}`);
            
            if (Array.isArray(matchingCourseIds)) {
                logger.info(`Number of matchingCourseIds: ${matchingCourseIds.length}`);
                
                // Log the types of the first few IDs for debugging
                if (matchingCourseIds.length > 0) {
                    const sampleIds = matchingCourseIds.slice(0, Math.min(5, matchingCourseIds.length));
                    sampleIds.forEach((id, index) => {
                        logger.info(`matchingCourseId[${index}] = ${id}, type: ${typeof id}`);
                    });
                }
            } else if (typeof matchingCourseIds === 'string') {
                // Check if it's a JSON string that needs to be parsed
                try {
                    const parsed = JSON.parse(matchingCourseIds);
                    logger.info(`Parsed matchingCourseIds from string: ${JSON.stringify(parsed)}`);
                    logger.info(`Parsed matchingCourseIds is array: ${Array.isArray(parsed)}`);
                } catch (e) {
                    logger.info(`matchingCourseIds is not a JSON string: ${matchingCourseIds}`);
                }
            }
        } else {
            logger.info(`No matchingCourseIds provided in request`);
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
        function getMatchingCourses(courseIds, returnAllCourses = false) {
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
                
                // Ensure courseIds is an array
                if (!Array.isArray(courseIds)) {
                    logger.warn(`courseIds is not an array, converting to array: ${courseIds}`);
                    courseIds = courseIds ? [courseIds] : [];
                }
                
                // Convert all courseIds to strings for consistent comparison
                const normalizedCourseIds = courseIds.map(id => String(id));
                logger.info(`Looking for courses with normalized IDs: ${normalizedCourseIds.join(', ')}`);
                
                // Filter courses by matching course IDs with string comparison
                const matchingCourses = allCourses.filter(course => {
                    const courseIdStr = String(course.id);
                    const isMatch = normalizedCourseIds.includes(courseIdStr);
                    logger.info(`Course ID ${courseIdStr} match: ${isMatch}`);
                    return isMatch;
                });
                
                logger.info(`Found ${matchingCourses.length} matching courses`);
                logger.info(`Matching course IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
                
                return matchingCourses;
            } catch (error) {
                logger.error('Error reading courses data:', error);
                logger.error('Error stack:', error.stack);
                return [];
            }
        }

        // Function to generate QR code that returns a Promise
        function generateQRCode(text2encode) {
            return new Promise((resolve, reject) => {
                QRCode.toDataURL(text2encode, (err, qrCode) => {
                    if (err) {
                        logger.error('Error generating QR code:', err);
                        return reject(err);
                    }
                    resolve(qrCode);
                });
            });
        }
        
        // Function to save QR code to file that returns a Promise
        function saveQRCodeToFile(qrCode) {
            return new Promise((resolve, reject) => {
                const qrFileName = `${uuidv4()}.png`;
                const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
                const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
                
                fs.writeFile(qrFilePath, qrBuffer, (err) => {
                    if (err) {
                        logger.error('Error saving QR code image:', err);
                        return reject(err);
                    }
                    const qrCodeUrl = `qrimg/${qrFileName}`;
                    resolve(qrCodeUrl);
                });
            });
        }
        
        // Function to send email without QR code that returns a Promise
        function sendEmailWithoutQR(contact, validExperiences, language, matchingCourses = []) {
            return new Promise((resolve, reject) => {
                // Validate language parameter
                if (!language || (language !== 'en' && language !== 'it')) {
                    logger.info(`Invalid or empty language parameter: "${language}". Using default language: "en"`);
                    language = 'en';
                } else {
                    logger.info(`Using language: "${language}" for email template`);
                }
                
                // Similar to sendEmailWithQR but without the QR code
                const emailData = {
                    name: contact.firstname,
                    email: contact.email,
                    type: 2, // Use email_courses.ejs template
                    language: language, // Add language
                    fieldData: {
                        courses: matchingCourses.map(course => ({
                            title: course.name || course.title,
                            date: "May 10, 2025", // Fixed date for Open Day
                            location: course.location || "Main Campus",
                            time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
                        })),
                        experiences: validExperiences,
                        frontali: [] // Empty array if no frontali experiences
                    }
                };
                
                logger.info(`Preparing to send email without QR code to ${contact.email}`);
                logger.info(`Email data structure: ${JSON.stringify({
                    name: typeof emailData.name,
                    email: typeof emailData.email,
                    type: emailData.type,
                    language: emailData.language,
                    fieldData: {
                        courses: Array.isArray(emailData.fieldData.courses) ? emailData.fieldData.courses.length : 'not an array',
                        experiences: Array.isArray(emailData.fieldData.experiences) ? emailData.fieldData.experiences.length : 'not an array',
                        frontali: Array.isArray(emailData.fieldData.frontali) ? emailData.fieldData.frontali.length : 'not an array'
                    }
                }, null, 2)}`);
                logger.info(`Email data content: ${JSON.stringify(emailData, null, 2)}`);
                
                // Log template path to verify it exists
                const templatePath = path.join(__dirname, 'views', language, 'email.ejs');
                logger.info(`Using email template: ${templatePath}`);
                
                // Render and send email (same as above but without QR code)
                ejs.renderFile(
                    templatePath,
                    emailData,
                    (err, htmlContent) => {
                        if (err) {
                            logger.error('Error rendering email template:', err);
                            logger.error('Template error details:', err.stack);
                            return reject(err);
                        }
                        
                        logger.info('Email template rendered successfully');
                        logger.info(`HTML content length: ${htmlContent.length}`);
                        logger.info(`HTML content preview: ${htmlContent.substring(0, 200)}...`);
                        
                        let recipientEmail = contact.email;
                        if (HUBSPOT_DEV == 1) {
                            recipientEmail = "phantomazzz@gmail.com";
                            logger.info(`Development mode: redirecting email to ${recipientEmail}`);
                        }
                        
                        const mailOptions = {
                            from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
                            to: recipientEmail,
                            subject: language === 'en'
                                ? `${contact.firstname}, your Open Day registration is confirmed`
                                : `${contact.firstname}, la tua registrazione all'Open Day è confermata`,
                            replyTo: 'info.unisr@unisr.it',
                            html: htmlContent
                        };
                        
                        logger.info(`Mail options prepared: to=${recipientEmail}, subject="${mailOptions.subject}"`);
                        
                        if (SENDMAIL == 1) {
                            logger.info('Attempting to send email...');
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    logger.error('Error sending email:', error);
                                    logger.error('Error details:', error.stack);
                                    logger.error('Mail options that failed:', JSON.stringify(mailOptions, null, 2));
                                    return reject(error);
                                } else {
                                    logger.info('Email sent successfully:', info.response);
                                    logger.info('Message ID:', info.messageId);
                                    return resolve(info);
                                }
                            });
                        } else {
                            logger.info('Email sending is disabled (SENDMAIL=0). Would have sent email with options:', JSON.stringify(mailOptions, null, 2));
                            return resolve({ disabled: true });
                        }
                    }
                );
            });
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
            
            // Use req.body.matchingCourseIds if provided, otherwise get course_types from experiences
            let courseTypes = [];
            if (req.body.matchingCourseIds && Array.isArray(req.body.matchingCourseIds) && req.body.matchingCourseIds.length > 0) {
                // Use the provided matchingCourseIds from request body
                courseTypes = req.body.matchingCourseIds;
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
            
            // Get all courses associated with the user from corsi.json
            // If matchingCourseIds were provided, filter courses by these IDs
            // Otherwise, return all courses
            
            // Ensure req.body.matchingCourseIds is properly normalized
            let normalizedMatchingCourseIds = [];
            if (req.body.matchingCourseIds) {
                if (Array.isArray(req.body.matchingCourseIds)) {
                    // Convert all IDs to strings for consistent comparison
                    normalizedMatchingCourseIds = req.body.matchingCourseIds.map(id => String(id));
                    logger.info(`Normalized matchingCourseIds: ${normalizedMatchingCourseIds.join(', ')}`);
                    
                    // Log the types of the first few IDs for debugging
                    if (normalizedMatchingCourseIds.length > 0) {
                        const sampleIds = normalizedMatchingCourseIds.slice(0, Math.min(5, normalizedMatchingCourseIds.length));
                        sampleIds.forEach((id, index) => {
                            logger.info(`matchingCourseId[${index}] = ${id}, type: ${typeof id}`);
                        });
                    }
                } else {
                    logger.warn(`matchingCourseIds is not an array, converting to array: ${req.body.matchingCourseIds}`);
                    normalizedMatchingCourseIds = [String(req.body.matchingCourseIds)];
                }
            }
            
            const hasMatchingCourseIds = normalizedMatchingCourseIds.length > 0;
            
            // Determine which IDs to use for filtering
            let filterIds;
            let returnAllCourses = false;
            
            if (hasMatchingCourseIds) {
                // If we have matchingCourseIds, use them for filtering
                // These IDs represent ALL courses associated with the user
                filterIds = normalizedMatchingCourseIds;
                logger.info(`Using normalized matchingCourseIds for filtering: ${filterIds.join(', ')}`);
                returnAllCourses = false;
            } else {
                // If no matchingCourseIds, return all courses
                logger.info(`No matchingCourseIds provided, returning all courses`);
                returnAllCourses = true;
                filterIds = []; // Not used when returnAllCourses is true
            }
            
            logger.info(`Calling getMatchingCourses with returnAllCourses=${returnAllCourses}`);
            const matchingCourses = getMatchingCourses(filterIds, returnAllCourses);
            logger.info(`Retrieved ${matchingCourses.length} courses for email`);
            
            // Log the IDs of the matching courses for easier debugging
            const matchingCourseIds = matchingCourses.map(course => course.id);
            logger.info(`Matching course IDs: ${matchingCourseIds.join(', ')}`);
            
            // Log a sample of the matching courses (first 3) to avoid huge logs
            const courseSample = matchingCourses.slice(0, Math.min(3, matchingCourses.length));
            logger.info(`Sample of matching courses: ${JSON.stringify(courseSample)}`);
            
            // Log a warning if no courses were found
            if (matchingCourses.length === 0) {
                logger.warn(`No matching courses found! This might indicate a filtering issue.`);
                logger.warn(`Filter IDs: ${filterIds.join(', ')}`);
                logger.warn(`returnAllCourses: ${returnAllCourses}`);
            }

            try {
                // Generate and save QR code
                const qrCode = await generateQRCode(encoded);
                try {
                    // Save QR code to file
                    const qrCodeUrl = await saveQRCodeToFile(qrCode);
                    // Send email with QR code
                    await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false);
                    logger.info('Email with QR code sent successfully');
                } catch (saveError) {
                    logger.error('Error saving QR code:', saveError);
                    // If saving QR code fails, send email without QR code
                    await sendEmailWithoutQR(contact, validExperiences, language, matchingCourses);
                    logger.info('Email without QR code sent successfully (after QR save error)');
                }
            } catch (qrError) {
                logger.error('Error generating QR code:', qrError);
                // If generating QR code fails, send email without QR code
                await sendEmailWithoutQR(contact, validExperiences, language, matchingCourses);
                logger.info('Email without QR code sent successfully (after QR generation error)');
            }
        } catch (error) {
            // Log the error but don't fail the request
            logger.error('Error sending confirmation email:', error);
            logger.error('Error details:', error.message);
            logger.error('Error stack:', error.stack);
            
            // Log transporter state
            logger.info('Checking email transporter state...');
            if (transporter) {
                logger.info('Email transporter exists');
                // Check if transporter is verified
                try {
                    const success = await new Promise((resolve, reject) => {
                        transporter.verify(function(error, success) {
                            if (error) {
                                logger.error('Transporter verification failed:', error);
                                reject(error);
                            } else {
                                logger.info('Transporter is ready to send messages');
                                resolve(success);
                            }
                        });
                    });
                } catch (verifyError) {
                    logger.error('Error verifying transporter:', verifyError);
                }
            } else {
                logger.error('Email transporter is undefined');
            }
            
            // Continue with the success response even if email fails
        }
        
        // ===== END OF NEW CODE FOR EMAIL SENDING =====
        
        // Return success
        res.json({
            success: true
        });
    } catch (error) {
        logger.error('Error updating HubSpot contact with selected experiences:', error.message);
        
        // Log more detailed error information
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            logger.error('HubSpot API error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: JSON.stringify(error.response.data)
            });
            
            // Check for specific error types
            if (error.response.data && error.response.data.message) {
                logger.error('HubSpot error message:', error.response.data.message);
                
                // Check if it's a property not found error
                if (error.response.data.message.includes('property') && error.response.data.message.includes('not found')) {
                    logger.error('This appears to be a property not found error. The property might not exist in HubSpot.');
                }
                
                // Check if it's an invalid option error
                if (error.response.data.message.includes('not one of the allowed options')) {
                    logger.error('This appears to be an invalid option error. The value sent is not in the list of allowed options for the property.');
                    logger.error(`Field used: ${hubspotField}, Value sent: ${experiencesString}`);
                    
                    // Log the workshop genitori detection logic for debugging
                    logger.error(`Workshop genitori detection: isWorkshopGenitori=${isWorkshopGenitori}`);
                    logger.error(`Workshop genitori IDs: ${WORKSHOP_GENITORI_IDS.join(', ')}`);
                    if (Array.isArray(experienceIds)) {
                        logger.error(`Experience IDs checked: ${experienceIds.join(', ')}`);
                    } else {
                        logger.error(`Experience ID checked: ${experienceIds}`);
                    }
                }
                
                // Check if it's an authentication error
                if (error.response.status === 401) {
                    logger.error('This appears to be an authentication error. The API key might be invalid or expired.');
                }
            }
        } else if (error.request) {
            // The request was made but no response was received
            logger.error('No response received from HubSpot API:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            logger.error('Error setting up HubSpot API request:', error.message);
        }
        
        // Try to get the contact to verify it exists
        try {
            logger.info(`Attempting to fetch contact ${contactID} to verify it exists...`);
            const contactResponse = await axios.get(`https://api.hubapi.com/crm/v3/objects/contacts/${contactID}?properties=email`);
            logger.info(`Contact exists with email: ${contactResponse.data.properties.email}`);
        } catch (contactError) {
            logger.error(`Error fetching contact: ${contactError.message}`);
        }
        
        res.status(500).json({
            error: 'Internal server error',
            details: error.response ? error.response.data : error.message
        });
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
        logger.info(`Retrieved ${experiencesDetails.length} selected experiences for contact ID: ${contactID}`);
        
        // Recupera i dettagli delle esperienze "frontali"
        const frontaliExperiences = await courseExperienceService.getFrontaliExperiences(contactID);
        logger.info(`Retrieved ${frontaliExperiences.length} frontali experiences for contact ID: ${contactID}`);
        console.log('Frontali experiences in submit-experiences route:', JSON.stringify(frontaliExperiences, null, 2));
        
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
            logger.info(`Rendering registration summary with ${coursesDetails.length} courses, ${experiencesDetails.length} experiences, and ${frontaliExperiences.length} frontali experiences`);
            console.log('Data being passed to template:', {
                contactId: contactID,
                coursesCount: coursesDetails.length,
                experiencesCount: experiencesDetails.length,
                frontaliCount: frontaliExperiences.length,
                frontali: frontaliExperiences
            });
            
            res.render(`${language}/registrationSummary`, {
                contactId: contactID,
                courses: coursesDetails,
                experiences: experiencesDetails,
                frontali: frontaliExperiences,
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
                        frontali: frontaliExperiences
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
                        // if (SENDEMAIL === 1) {
                            thisemail = "phantomazzz@gmail.com";
                        // }
                        
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
        console.log("CONTENUTO QR: ",msg);
        let contactID = msg.split("**")[1];
        let email = msg.split("**")[0];
        
        // Ottieni l'ID della location selezionata (se presente)
        const locationId = req.body.locationId || null;
        console.log("Location ID selezionato:", locationId);
        
        // Ottieni le informazioni di base del contatto, inclusa la proprietà di conferma partecipazione
        const contactResponse = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts/' + contactID + '?properties=ischeckin,isregistered,firstname,lastname,email,conferma_partecipazione_corsi_open_day_08_05_2025');
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
            email: email,
            selectedLocationId: locationId // Aggiungi l'ID della location selezionata alla risposta
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
        
        // Se ci sono associazioni, verifica se il locationId è tra gli ID dei custom object
        if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
            // Estrai tutti gli ID dei custom object associati e assicurati che siano stringhe
            const customObjectIds = associationsResponse.data.results.map(result => String(result.toObjectId));
            logger.info(`Found ${customObjectIds.length} custom object associations: ${customObjectIds.join(', ')}`);
            
            // Converti locationId in stringa per il confronto
            const locationIdStr = String(locationId);
            
            // Debug dettagliato
            console.log("DEBUG - Custom Object IDs:", JSON.stringify(customObjectIds));
            console.log("DEBUG - Location ID:", locationIdStr);
            console.log("DEBUG - Types:", {
                locationIdType: typeof locationId,
                locationIdStrType: typeof locationIdStr,
                customObjectIdsTypes: customObjectIds.map(id => typeof id)
            });
            
            // Verifica esplicita con loop invece di includes()
            let locationIdFound = false;
            for (const id of customObjectIds) {
                console.log(`Comparing: '${id}' (${typeof id}) === '${locationIdStr}' (${typeof locationIdStr}): ${id === locationIdStr}`);
                if (id === locationIdStr) {
                    locationIdFound = true;
                    break;
                }
            }
            
            // Log del risultato
            console.log(`Location ID found: ${locationIdFound}`);
            
            if (!locationIdFound) {
                logger.info(`Location ID ${locationId} not found in custom object IDs`);
                datares.error = "QR NON VALIDO";
                return res.json(datares);
            }
            
            logger.info(`Location ID ${locationId} found in custom object IDs`);
            
            // Ottieni l'ID del primo custom object associato per mantenere la compatibilità con il codice esistente
            const customObjectId = associationsResponse.data.results[0].toObjectId;
            
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
            
            // Verifica se il locationId è già presente nella proprietà di conferma partecipazione
            const participationProperty = contactResponse.data.properties["conferma_partecipazione_corsi_open_day_08_05_2025"] || "";
            logger.info(`Participation property: ${participationProperty}`);
            
            if (participationProperty.includes(locationId)) {
                logger.info(`Location ID ${locationId} already in participation property`);
                datares.error = "INGRESSO GIA' EFFETTUATO";
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
        // Ottieni l'ID della location dalla query string (se presente)
        const locationId = req.query.locationId || null;
        console.log("CHECKIN " + contactID + " - Location ID: " + locationId);
        
        if (!locationId) {
            logger.error('Location ID is required');
            return res.json({
                result: "error",
                error: "Location ID is required"
            });
        }
        
        // Ottieni le informazioni del contatto, inclusa la proprietà di conferma partecipazione
        const contactResponse = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}?properties=firstname,lastname,email,conferma_partecipazione_corsi_open_day_08_05_2025`
        );
        logger.info(`Contact details retrieved: ${JSON.stringify(contactResponse.data.properties)}`);
        
        // Verifica se il locationId è già presente nella proprietà di conferma partecipazione
        const participationProperty = contactResponse.data.properties["conferma_partecipazione_corsi_open_day_08_05_2025"] || "";
        logger.info(`Participation property: ${participationProperty}`);
        
        if (participationProperty.includes(locationId)) {
            logger.info(`Location ID ${locationId} already in participation property`);
            return res.json({
                result: "error",
                error: "INGRESSO GIA' EFFETTUATO",
                locationId: locationId
            });
        }
        
        // Ottieni l'ID del custom object type dalle variabili d'ambiente
        const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
        if (!customObjectTypeId) {
            logger.error('HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables');
            return res.json({ result: "error", error: "Errore di configurazione del server" });
        }
        
        // Verifica se il contatto ha un custom object associato
        logger.info(`Checking for custom object associations for contact ID: ${contactID}`);
        const associationsResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactID}/associations/${customObjectTypeId}`
        );
        
        // Se non ci sono associazioni, restituisci un errore
        if (!associationsResponse.data.results || associationsResponse.data.results.length === 0) {
            logger.info(`No custom object association found for contact ID: ${contactID}`);
            return res.json({
                result: "error",
                error: "QR NON VALIDO",
                locationId: locationId
            });
        }
        
        // Estrai tutti gli ID dei custom object associati e assicurati che siano stringhe
        const customObjectIds = associationsResponse.data.results.map(result => String(result.toObjectId));
        logger.info(`Found ${customObjectIds.length} custom object associations: ${customObjectIds.join(', ')}`);
        
        // Converti locationId in stringa per il confronto
        const locationIdStr = String(locationId);
        
        // Debug dettagliato
        console.log("DEBUG - Custom Object IDs:", JSON.stringify(customObjectIds));
        console.log("DEBUG - Location ID:", locationIdStr);
        console.log("DEBUG - Types:", {
            locationIdType: typeof locationId,
            locationIdStrType: typeof locationIdStr,
            customObjectIdsTypes: customObjectIds.map(id => typeof id)
        });
        
        // Verifica esplicita con loop invece di includes()
        let locationIdFound = false;
        for (const id of customObjectIds) {
            console.log(`Comparing: '${id}' (${typeof id}) === '${locationIdStr}' (${typeof locationIdStr}): ${id === locationIdStr}`);
            if (id === locationIdStr) {
                locationIdFound = true;
                break;
            }
        }
        
        // Log del risultato
        console.log(`Location ID found: ${locationIdFound}`);
        
        if (!locationIdFound) {
            logger.info(`Location ID ${locationId} not found in custom object IDs`);
            return res.json({
                result: "error",
                error: "QR NON VALIDO",
                locationId: locationId
            });
        }
        
        logger.info(`Location ID ${locationId} found in custom object IDs`);
        
        // Aggiorna la proprietà di conferma partecipazione del contatto
        const updatedProperty = participationProperty ? `${participationProperty};${locationId}` : locationId;
        
        await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactID}`, {
            properties: {
                "conferma_partecipazione_corsi_open_day_08_05_2025": updatedProperty
            }
        });
        
        logger.info(`Updated contact property with location ID ${locationId}`);
        
        // // Ottieni l'ID del primo custom object associato per mantenere la compatibilità con il codice esistente
        // const customObjectId = associationsResponse.data.results[0].toObjectId;
        
        // // Aggiorna le proprietà del custom object
        // await axios.patch(`https://api.hubapi.com/crm/v3/objects/${customObjectTypeId}/${customObjectId}`, {
        //     "properties": {
        //         ritiro_avvenuto: "true"
        //     }
        // });
        
        // logger.info(`Updated custom object ${customObjectId} with ritiro_avvenuto=true`);
        res.json({
            result: "success",
            custom_object_updated: true,
            contact_property_updated: true,
            locationId: locationId
        });
        // Il blocco else è stato rimosso perché ora gestiamo il caso in cui non ci sono associazioni prima
    } catch (error) {
        console.error('Error in /docheckin:', error);
        res.status(500).json({ error: 'Error updating data' });
    }
});


// Experiences Management Admin Panel Routes
// GET route to display the admin panel
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

// API endpoint to generate QR code for a contact
app.get('/api/generate-qr/:contactID', async (req, res) => {
    try {
        const contactID = req.params.contactID;
        
        // Get contact details
        const contact = await courseExperienceService.getContactDetails(contactID);
        
        // Generate QR code content (same as existing implementation)
        const text2encode = contact.email + '**' + contactID;
        const encoded = xorCipher.encode(text2encode, xorKey);
        
        // Generate QR code
        QRCode.toDataURL(encoded, (err, qrCode) => {
            if (err) {
                logger.error('Error generating QR code:', err);
                return res.status(500).json({ error: 'Error generating QR code' });
            }
            
            // Generate a unique filename
            const qrFileName = `${uuidv4()}.png`;
            const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
            const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
            
            // Save the QR code to a file
            fs.writeFile(qrFilePath, qrBuffer, (err) => {
                if (err) {
                    logger.error('Error saving QR code image:', err);
                    return res.status(500).json({ error: 'Error saving QR code' });
                }
                
                // Return the URL to the QR code
                const qrCodeUrl = `/qrimg/${qrFileName}`;
                res.json({ qrCodeUrl });
            });
        });
    } catch (error) {
        logger.error('Error in /api/generate-qr:', error);
        res.status(500).json({ error: 'Internal server error' });
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