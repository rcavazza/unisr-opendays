/**
 * This file contains the code to add email sending functionality to the
 * /api/update-selected-experiences endpoint in server.js
 * 
 * The code should be inserted after the successful HubSpot update and before
 * the final response.
 */

// Endpoint to update selected experiences in HubSpot
app.post('/api/update-selected-experiences', async (req, res) => {
    console.log('Endpoint /api/update-selected-experiences hit - this should appear in the server logs when the endpoint is called');
    console.log('Request body:', req.body);
    logger.info('Endpoint /api/update-selected-experiences hit - this should appear in the server logs when the endpoint is called');
    logger.info('Request body:', req.body);
    const { contactID, experienceIds } = req.body;
    
    if (!contactID || !experienceIds) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Format the experience IDs as a comma-separated string
        const experiencesString = Array.isArray(experienceIds)
            ? experienceIds.join(',')
            : experienceIds;
        
        logger.info(`Updating HubSpot contact ${contactID} with selected experiences: ${experiencesString}`);
        
        // Log the request details
        const requestData = {
            properties: {
                open_day__iscrizione_esperienze_10_05_2025: experiencesString
            }
        };
        logger.info('HubSpot update request data:', JSON.stringify(requestData));
        
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
        const language = req.query.lang === 'it' ? 'it' : 'en';
        logger.info(`Using language: ${language} for email`);
        
        try {
            // Fetch contact details from HubSpot
            logger.info(`Fetching contact details for ${contactID}`);
            const contactResponse = await axios.get(
                `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}?properties=email,firstname,lastname`
            );
            const contact = contactResponse.data.properties;
            logger.info(`Contact details retrieved: ${contact.email}`);
            
            // Parse experienceIds to ensure it's an array
            const expIds = Array.isArray(experienceIds) ? experienceIds : experiencesString.split(',');
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
            
            // Generate QR code
            const qrFileName = `${uuidv4()}.png`;
            const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
            
            QRCode.toDataURL(encoded, async function (err, qrCode) {
                if (err) {
                    logger.error('Error generating QR code:', err);
                    // Continue without QR code
                    sendEmailWithoutQR();
                    return;
                }
                
                // Save QR code to file
                const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
                
                fs.writeFile(qrFilePath, qrBuffer, (err) => {
                    if (err) {
                        logger.error('Error saving QR code image:', err);
                        // Continue without QR code
                        sendEmailWithoutQR();
                        return;
                    }
                    
                    const qrCodeUrl = `qrimg/${qrFileName}`;
                    sendEmailWithQR(qrCodeUrl);
                });
            });
            
            // Function to send email with QR code
            function sendEmailWithQR(qrCodeUrl) {
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
                
                // Render email template
                ejs.renderFile(
                    path.join(__dirname, 'views', language, 'email.ejs'),
                    emailData,
                    (err, htmlContent) => {
                        if (err) {
                            logger.error('Error rendering email template:', err);
                            return;
                        }
                        
                        // Determine recipient email
                        let recipientEmail = contact.email;
                        if (HUBSPOT_DEV == 1) {
                            recipientEmail = "phantomazzz@gmail.com"; // Development email
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
                        
                        // Send email
                        if (SENDMAIL == 1) {
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    logger.error('Error sending email:', error);
                                } else {
                                    logger.info('Email sent:', info.response);
                                }
                            });
                        } else {
                            logger.info('Email sending is disabled (SENDMAIL=0)');
                        }
                    }
                );
            }
            
            // Function to send email without QR code
            function sendEmailWithoutQR() {
                // Similar to sendEmailWithQR but without the QR code
                const emailData = {
                    name: contact.firstname,
                    email: contact.email,
                    type: 2, // Use email_courses.ejs template
                    fieldData: {
                        experiences: validExperiences
                    }
                };
                
                // Render and send email (same as above but without QR code)
                ejs.renderFile(
                    path.join(__dirname, 'views', language, 'email.ejs'),
                    emailData,
                    (err, htmlContent) => {
                        if (err) {
                            logger.error('Error rendering email template:', err);
                            return;
                        }
                        
                        let recipientEmail = contact.email;
                        if (HUBSPOT_DEV == 1) {
                            recipientEmail = "phantomazzz@gmail.com";
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
                        
                        if (SENDMAIL == 1) {
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    logger.error('Error sending email:', error);
                                } else {
                                    logger.info('Email sent:', info.response);
                                }
                            });
                        } else {
                            logger.info('Email sending is disabled (SENDMAIL=0)');
                        }
                    }
                );
            }
        } catch (error) {
            // Log the error but don't fail the request
            logger.error('Error sending confirmation email:', error);
            logger.error('Error details:', error.message);
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