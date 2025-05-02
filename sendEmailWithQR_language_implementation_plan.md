# Implementation Plan: sendEmailWithQR Language Selection

## 1. Problem Statement
The `sendEmailWithQR` function needs to select an email template based on the language present in the URL of the referring page. Currently, the function accepts a `language` parameter, but it appears that this parameter sometimes arrives empty, causing issues with template selection.

## 2. Current Implementation
- The function accepts a `language` parameter and uses it to determine the template path
- The template path is constructed as: `path.join(__dirname, 'views', language, 'email.ejs')`
- If the language parameter is empty, this could cause issues with finding the template
- The function is called from two places in server.js:
  1. In the `/en/opendays` route (line ~437)
  2. In the `/api/update-selected-experiences` route (line ~1376)

## 3. Proposed Solution
Modify the `sendEmailWithQR` function to:
1. Check if the language parameter is valid (not empty and either 'en' or 'it')
2. If not valid, extract the language from the referrer URL if available
3. If the referrer URL doesn't contain a language indicator, use a default language ('en')
4. Log the language being used for better debugging

## 4. Implementation Details

```javascript
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false, req = null) {
    return new Promise((resolve, reject) => {
        console.log("XXXXX");
        
        // Validate language parameter and check referrer if needed
        if (!language || (language !== 'en' && language !== 'it')) {
            logger.info(`Invalid or empty language parameter: "${language}". Checking referrer URL...`);
            
            // Check if req object is available and has a referer header
            if (req && req.headers && req.headers.referer) {
                const refererUrl = req.headers.referer;
                logger.info(`Referrer URL: ${refererUrl}`);
                
                // Extract language from referrer URL
                // Example URL formats: /en/opendays, /it/opendays, etc.
                if (refererUrl.includes('/en/')) {
                    language = 'en';
                    logger.info(`Language extracted from referrer URL: "${language}"`);
                } else if (refererUrl.includes('/it/')) {
                    language = 'it';
                    logger.info(`Language extracted from referrer URL: "${language}"`);
                } else {
                    // Default to English if no language found in referrer
                    language = 'en';
                    logger.info(`No language found in referrer URL. Using default language: "${language}"`);
                }
            } else {
                // Default to English if no referrer available
                language = 'en';
                logger.info(`No referrer URL available. Using default language: "${language}"`);
            }
        } else {
            logger.info(`Using provided language: "${language}" for email template`);
        }
        
        // Rest of the function remains the same...
        
        // Log template path to verify it exists
        const templatePath = path.join(__dirname, 'views', language, 'email.ejs');
        logger.info(`Using email template: ${templatePath}`);
        
        // Render email template
        ejs.renderFile(
            templatePath,
            emailData,
            (err, htmlContent) => {
                // Rest of the function remains the same...
            }
        );
    });
}
```

### Alternative Implementation (Simpler)
If passing the `req` object to the function is not feasible, we can implement a simpler solution that just ensures a valid language is used:

```javascript
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false) {
    return new Promise((resolve, reject) => {
        console.log("XXXXX");
        
        // Validate language parameter
        if (!language || (language !== 'en' && language !== 'it')) {
            logger.info(`Invalid or empty language parameter: "${language}". Using default language: "en"`);
            language = 'en';
        } else {
            logger.info(`Using language: "${language}" for email template`);
        }
        
        // Rest of the function remains the same...
    });
}
```

## 5. Changes to Call Sites
To implement the full solution with referrer URL checking, we need to modify the places where `sendEmailWithQR` is called to pass the `req` object:

1. In the `/en/opendays` route:
```javascript
await sendEmailWithQR(contact, qrCodeUrl, [], language, matchingCourses, false, req);
```

2. In the `/api/update-selected-experiences` route:
```javascript
await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false, req);
```

## 6. Testing Strategy
1. Test with valid language parameters ('en' and 'it')
2. Test with an empty language parameter and various referrer URLs
3. Test with an invalid language parameter and various referrer URLs
4. Verify that the correct template is used in each case

## 7. Advantages and Limitations

### Advantages
- Robust handling of language selection
- Uses referrer URL as a fallback when the language parameter is missing
- Provides better logging for debugging
- Ensures a template is always selected, even if the language parameter is empty

### Limitations
- Requires passing the `req` object to the function (for the full solution)
- Relies on a default language if both the parameter and referrer URL are invalid
- Assumes a specific URL structure for language extraction

## 8. Fallback Strategy
If the implementation with referrer URL checking is too complex or causes issues, the simpler implementation that just validates the language parameter can be used as a fallback.