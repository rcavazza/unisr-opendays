# Miglioramento della Gestione Asincrona nell'Invio Email

## Problema Identificato

Il problema principale nell'endpoint `/api/update-selected-experiences` sembra essere legato alla gestione asincrona dell'invio email. Le funzioni `sendEmailWithQR` e `sendEmailWithoutQR` sono definite all'interno di un blocco try/catch e vengono chiamate all'interno di callback asincroni (QRCode.toDataURL e fs.writeFile).

Questo può causare problemi di timing e contesto:
1. La risposta HTTP potrebbe essere inviata prima che l'email venga effettivamente inviata
2. Le callback di invio email potrebbero non essere eseguite completamente
3. Gli errori nelle callback potrebbero non essere gestiti correttamente

## Soluzione Proposta

La soluzione consiste nel ristrutturare il codice per utilizzare Promises e async/await in modo più efficace, garantendo che:
1. Le operazioni asincrone siano gestite correttamente
2. Gli errori siano catturati e registrati in modo appropriato
3. Il flusso di esecuzione sia più chiaro e prevedibile

## Implementazione Dettagliata

### 1. Trasformare le funzioni di invio email in Promises

```javascript
// Funzione per inviare email con QR code che restituisce una Promise
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language) {
    return new Promise((resolve, reject) => {
        // Prepare email data
        const emailData = {
            name: contact.firstname,
            email: contact.email,
            qrCode: qrCodeUrl,
            type: 2, // Use email_courses.ejs template
            fieldData: {
                experiences: validExperiences
            }
        };
        
        logger.info(`Preparing to send email with QR code to ${contact.email}, QR URL: ${qrCodeUrl}`);
        
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
                
                // Determine recipient email
                let recipientEmail = contact.email;
                if (HUBSPOT_DEV == 1) {
                    recipientEmail = "phantomazzz@gmail.com"; // Development email
                    logger.info(`Development mode: redirecting email to ${recipientEmail}`);
                }
                
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
                    logger.info('Email sending is disabled (SENDMAIL=0)');
                    return resolve({ disabled: true });
                }
            }
        );
    });
}

// Funzione per inviare email senza QR code che restituisce una Promise
function sendEmailWithoutQR(contact, validExperiences, language) {
    return new Promise((resolve, reject) => {
        // Similar to sendEmailWithQR but without the QR code
        const emailData = {
            name: contact.firstname,
            email: contact.email,
            type: 2, // Use email_courses.ejs template
            fieldData: {
                experiences: validExperiences
            }
        };
        
        logger.info(`Preparing to send email without QR code to ${contact.email}`);
        
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
                    logger.info('Email sending is disabled (SENDMAIL=0)');
                    return resolve({ disabled: true });
                }
            }
        );
    });
}
```

### 2. Trasformare la generazione del QR code in una Promise

```javascript
// Funzione per generare QR code che restituisce una Promise
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

// Funzione per salvare il QR code su file che restituisce una Promise
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
```

### 3. Ristrutturare il blocco principale utilizzando async/await

```javascript
// ===== START OF NEW CODE FOR EMAIL SENDING =====

// Extract language from request headers or query parameters
// Default to English if not specified
const language = req.query.lang === 'it' ? 'it' : 'en';
logger.info(`Using language: ${language} for email`);

// Log SENDMAIL value to verify if email sending is enabled
logger.info(`SENDMAIL environment variable value: ${SENDMAIL}`);

// Log email transporter configuration (without sensitive data)
logger.info(`Email transporter configuration: host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT}, secure=${process.env.SMTP_SECURE}`);

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
    
    try {
        // Generate and save QR code
        const qrCode = await generateQRCode(encoded);
        try {
            // Save QR code to file
            const qrCodeUrl = await saveQRCodeToFile(qrCode);
            // Send email with QR code
            await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language);
        } catch (saveError) {
            logger.error('Error saving QR code:', saveError);
            // If saving QR code fails, send email without QR code
            await sendEmailWithoutQR(contact, validExperiences, language);
        }
    } catch (qrError) {
        logger.error('Error generating QR code:', qrError);
        // If generating QR code fails, send email without QR code
        await sendEmailWithoutQR(contact, validExperiences, language);
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
```

## Vantaggi di Questa Soluzione

1. **Gestione più chiara delle operazioni asincrone**:
   - Ogni operazione asincrona è incapsulata in una Promise
   - Il flusso di esecuzione è più lineare e facile da seguire
   - Gli errori sono propagati correttamente attraverso la catena di Promise

2. **Migliore gestione degli errori**:
   - Ogni operazione asincrona ha la propria gestione degli errori
   - Gli errori sono registrati in modo più dettagliato
   - Il codice può continuare l'esecuzione anche in caso di errori in operazioni specifiche

3. **Flusso di esecuzione più prevedibile**:
   - Le operazioni vengono eseguite in sequenza
   - Il codice attende il completamento di ogni operazione prima di procedere alla successiva
   - Le callback annidate sono eliminate, riducendo la complessità

4. **Maggiore robustezza**:
   - Il codice gestisce meglio i casi limite e gli errori
   - Le operazioni asincrone sono più affidabili
   - Il logging è più completo e informativo

## Implementazione

Per implementare questa soluzione:

1. Sostituire il blocco di codice esistente nell'endpoint `/api/update-selected-experiences` con il codice proposto
2. Assicurarsi che tutte le funzioni ausiliarie (`generateQRCode`, `saveQRCodeToFile`, `sendEmailWithQR`, `sendEmailWithoutQR`) siano definite prima del loro utilizzo
3. Testare l'endpoint con diversi scenari (generazione QR code riuscita/fallita, invio email riuscito/fallito)

Questa soluzione dovrebbe risolvere i problemi di asincronicità nell'invio delle email, garantendo che le email vengano inviate correttamente anche in caso di operazioni asincrone complesse.