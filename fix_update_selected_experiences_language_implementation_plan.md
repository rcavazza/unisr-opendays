# Fix Language Parameter in update-selected-experiences Implementation Plan

## Problem Statement

The `sendEmailWithQR` function in server.js needs to select an email template based on the language, but when called from the `/api/update-selected-experiences` endpoint, the language parameter is empty. This is because the frontend application is not passing the language parameter when calling this endpoint.

## Current Implementation Analysis

1. In the frontend application (experienceService.ts), the `updateSelectedExperiences` function makes a POST request to the `/api/update-selected-experiences` endpoint:

```typescript
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[]
): Promise<{ success: boolean, error?: string }> => {
  try {
    // ...
    const response = await fetch(' /api/update-selected-experiences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    // ...
  } catch (error) {
    // ...
  }
};
```

2. In the server.js file, the `/api/update-selected-experiences` endpoint extracts the language from the query parameters:

```javascript
// Extract language from request headers or query parameters
// Default to English if not specified
const language = req.query.lang === 'it' ? 'it' : 'en';
logger.info(`Using language: ${language} for email`);
```

3. The language is then passed to the `sendEmailWithQR` function:

```javascript
await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false);
```

4. The issue is that the frontend is not passing the language parameter when calling the endpoint, so `req.query.lang` is undefined, and the language defaults to 'en'.

## Proposed Solution

### 1. Modify the `updateSelectedExperiences` function in experienceService.ts

Update the function to accept and pass the language parameter:

```typescript
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[],
  lang: string // Add language parameter
): Promise<{ success: boolean, error?: string }> => {
  try {
    // Ensure we're using a simple language code (en or it)
    const simpleLang = lang.startsWith('en') ? 'en' : lang.startsWith('it') ? 'it' : 'en';
    
    console.log('Updating selected experiences:', { contactID, experienceIds, language: simpleLang });
    
    // Log the request details
    const requestBody = {
      contactID,
      experienceIds
    };
    console.log('Request body:', JSON.stringify(requestBody));
    
    // Add language as a query parameter
    const response = await fetch(` /api/update-selected-experiences?lang=${simpleLang}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.json();
    console.log('Update response data:', data);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText, data);
      return {
        success: false,
        error: data.error || 'Failed to update selected experiences'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating selected experiences:', error);
    throw error;
  }
};
```

### 2. Update all places in the frontend code where `updateSelectedExperiences` is called

Find all places where `updateSelectedExperiences` is called and update them to pass the language parameter. This would require searching through the frontend code to identify these places.

For example, if there's a call like:

```typescript
await updateSelectedExperiences(contactID, selectedExperienceIds);
```

It should be updated to:

```typescript
await updateSelectedExperiences(contactID, selectedExperienceIds, language);
```

Where `language` is the current language of the application, which can be obtained from the i18n context or from the URL.

### 3. Modify the `sendEmailWithQR` function in server.js

As a fallback, also modify the `sendEmailWithQR` function to handle cases where the language parameter is empty or invalid:

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

## Implementation Steps

1. Modify the `updateSelectedExperiences` function in experienceService.ts to accept and pass the language parameter.
2. Update all places in the frontend code where `updateSelectedExperiences` is called to pass the language parameter.
3. Modify the `sendEmailWithQR` function in server.js to handle cases where the language parameter is empty or invalid.
4. Test the changes by:
   - Using the test_email_implementation.js script to verify that the language parameter is being passed correctly.
   - Testing the frontend application to ensure that the language parameter is being passed when the user selects experiences.

## Expected Outcome

After implementing these changes:
1. The language parameter will be passed from the frontend to the backend when calling the `/api/update-selected-experiences` endpoint.
2. Even if the language parameter is missing, the `sendEmailWithQR` function will use a default value, ensuring that the correct template is always selected.
3. The email will be sent with the correct language template, improving the user experience.

## Fallback Strategy

If it's not feasible to modify the frontend code to pass the language parameter, we can implement a more robust fallback strategy in the server.js file:

1. Extract the language from the referrer URL if available:
```javascript
// Extract language from request headers or query parameters
let language = req.query.lang === 'it' ? 'it' : 'en';

// If no language in query parameters, try to extract from referrer URL
if (!req.query.lang && req.headers.referer) {
    const refererUrl = req.headers.referer;
    if (refererUrl.includes('/it/')) {
        language = 'it';
        logger.info(`Language extracted from referrer URL: "${language}"`);
    } else if (refererUrl.includes('/en/')) {
        language = 'en';
        logger.info(`Language extracted from referrer URL: "${language}"`);
    }
}

logger.info(`Using language: ${language} for email`);
```

2. Modify the `sendEmailWithQR` function to validate the language parameter as described above.

This approach ensures that the correct language is used even if the frontend doesn't pass it explicitly.