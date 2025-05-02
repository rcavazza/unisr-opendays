# Fix sendEmailWithQR Language Parameter Implementation Plan

## Problem Statement

The `sendEmailWithQR` function needs to select an email template based on the language present in the URL of the referring page. Currently, the function accepts a `language` parameter, but it appears that this parameter sometimes arrives empty, causing issues with template selection.

## Current Implementation Analysis

After analyzing the code, we've identified the following:

1. The `sendEmailWithQR` function is called from two places:
   - In the `/en/opendays` route (around line 437)
   - In the `/api/update-selected-experiences` route (around line 1376)

2. In the `/en/opendays` route, the language is extracted from the URL path:
   ```javascript
   const pathParts = req.path.split('/');
   const language = pathParts[1] === 'en' || pathParts[1] === 'it' ? pathParts[1] : 'en';
   ```

3. In the `/api/update-selected-experiences` route, the language is extracted from query parameters:
   ```javascript
   const language = req.query.lang === 'it' ? 'it' : 'en';
   ```

4. The `sendEmailWithQR` function uses the language parameter to:
   - Set the language in the emailData object
   - Construct the template path: `path.join(__dirname, 'views', language, 'email.ejs')`
   - Determine the subject of the email

5. There are log statements that should show the extracted language and the template path being used.

## Possible Issues

1. The language parameter might be empty or undefined in some cases, despite the extraction logic.
2. There might be an issue with how the language is being passed to the function.
3. The function might not be properly handling cases where the language parameter is empty.

## Proposed Solution

Modify the `sendEmailWithQR` function to validate the language parameter and use a default value if it's empty or invalid. This will ensure that a template is always selected, even if the language parameter is not properly passed.

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

## Additional Debugging Steps

To better understand the issue, we should add more logging to track the language parameter at different points:

1. In the `/en/opendays` route, add logging before and after extracting the language:
   ```javascript
   logger.info(`Request path: ${req.path}`);
   const pathParts = req.path.split('/');
   logger.info(`Path parts: ${JSON.stringify(pathParts)}`);
   const language = pathParts[1] === 'en' || pathParts[1] === 'it' ? pathParts[1] : 'en';
   logger.info(`Extracted language: ${language}`);
   ```

2. In the `sendEmailWithQR` function, add logging at the beginning to show the received parameters:
   ```javascript
   logger.info(`sendEmailWithQR called with language: "${language}"`);
   logger.info(`sendEmailWithQR parameters: contact=${contact.email}, validExperiences=${validExperiences.length}, matchingCourses=${matchingCourses.length}, useOttoJson=${useOttoJson}`);
   ```

## Implementation Steps

1. Add the validation logic to the `sendEmailWithQR` function to handle empty or invalid language parameters.
2. Add additional logging to track the language parameter at different points.
3. Test the function with various scenarios:
   - Valid language parameters ('en' and 'it')
   - Empty language parameter
   - Invalid language parameter

## Expected Outcome

After implementing these changes, the `sendEmailWithQR` function should always use a valid language parameter, even if the passed parameter is empty or invalid. This will ensure that the correct template is always selected and the email is sent successfully.

## Fallback Strategy

If the validation logic doesn't resolve the issue, we may need to investigate further:

1. Check if there's an issue with how the language is being extracted from the URL path.
2. Check if there's an issue with how the language is being passed to the function.
3. Check if there's an issue with the template path or the template itself.

## Conclusion

By adding validation logic to the `sendEmailWithQR` function, we can ensure that it always uses a valid language parameter, even if the passed parameter is empty or invalid. This will prevent issues with template selection and ensure that emails are sent successfully.