# Email Implementation Code

This document contains the code implementation for adding email sending functionality to the form submission in the "/front" page after updating HubSpot.

## Modifications to `/api/update-selected-experiences` Endpoint

The following code should be added to the `/api/update-selected-experiences` endpoint in server.js after the HubSpot update is successful:

```javascript
// After successfully updating HubSpot
logger.info(`Successfully updated HubSpot contact ${contactID} with selected experiences: ${experiencesString}`);

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

    // Fetch experience details from database
    logger.info(`Fetching experience details for IDs: ${experiencesString}`);
    const experienceIds = Array.isArray(experienceIds) ? experienceIds : experienceIds.split(',');
    
    // Get experience details from the database
    const experiences = await Promise.all(
        experienceIds.map(async (expId) => {
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
            
            const qrCodeUrl = `/qrimg/${qrFileName}`;
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
                if (HUBSPOT_DEV === 1) {
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
                if (HUBSPOT_DEV === 1) {
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

// Return success response to the frontend
res.json({
    success: true
});
```

## Integration Notes

1. This code should be inserted in the `/api/update-selected-experiences` endpoint in server.js, right after the successful HubSpot update and before the final response.

2. The code assumes the following variables and functions are already available in the scope:
   - `logger` - For logging
   - `axios` - For making HTTP requests
   - `db` - SQLite database connection
   - `ejs` - For rendering templates
   - `path` - For file path operations
   - `fs` - For file system operations
   - `QRCode` - For generating QR codes
   - `xorCipher` - For encoding data
   - `xorKey` - Secret key for encoding
   - `uuidv4` - For generating unique IDs
   - `transporter` - Nodemailer transport
   - `HUBSPOT_DEV` - Environment variable
   - `SENDMAIL` - Environment variable

3. Error handling is implemented to ensure that the API still returns success even if email sending fails, as this is considered a non-critical operation.

4. The code extracts the language preference from the request and uses the appropriate template.

5. The implementation includes QR code generation with a fallback if it fails.