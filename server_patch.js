/**
 * Patch per il file server.js
 * 
 * Questo file contiene le modifiche da apportare al file server.js per implementare
 * la nuova modalità di registrazione con corsi ed esperienze.
 * 
 * Istruzioni:
 * 1. Importare il modulo courseExperienceService all'inizio del file server.js
 * 2. Modificare la rotta /submit-email per reindirizzare a /confirm-courses
 * 3. Aggiungere le nuove rotte per la nuova modalità di registrazione
 */

// 1. Importare il modulo courseExperienceService (da aggiungere dopo le altre importazioni)
const courseExperienceService = require('./courseExperienceService');

// 2. Modificare la rotta /submit-email per reindirizzare a /confirm-courses
// Sostituire la riga 825 con:
res.redirect(`/confirm-courses?contactID=${contact.id}&lang=${language}&location=${encodeURIComponent(location)}`);

// 3. Aggiungere le nuove rotte per la nuova modalità di registrazione
// Da aggiungere dopo la rotta /submit-email (dopo la riga 879)

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