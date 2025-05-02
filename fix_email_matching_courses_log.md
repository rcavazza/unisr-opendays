# Fix for Email Matching Courses Issue

## Problem Description

The `matchingCourseIds` are correctly passed to the confirmation page, but in the email, all courses are shown instead of the filtered list. This happens because the `matchingCourses` array doesn't arrive intact to the `sendEmailWithQR` function, or it's being incorrectly evaluated as empty.

## Diagnostic Steps

Add logging at the beginning of the `sendEmailWithQR` function to check the state of the `matchingCourses` parameter when it's received.

### Locate the Function

The `sendEmailWithQR` function is defined around line 1013 in server.js:

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
        
        // Se matchingCourses è vuoto, carica TUTTI i corsi dalla fonte appropriata
        if (!matchingCourses || matchingCourses.length === 0) {
            // ...
```

### Add Logging Code

Add the following logging code right after the console.log("XXXXX") line:

```javascript
// Add detailed logging for matchingCourses parameter
logger.info(`sendEmailWithQR received matchingCourses: ${matchingCourses ? (Array.isArray(matchingCourses) ? matchingCourses.length : 'not an array') : 'undefined'}`);
logger.info(`matchingCourses type: ${typeof matchingCourses}`);
if (matchingCourses && Array.isArray(matchingCourses) && matchingCourses.length > 0) {
    logger.info(`First matchingCourse: ${JSON.stringify(matchingCourses[0])}`);
    logger.info(`matchingCourses IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
} else {
    logger.info(`matchingCourses is empty or not an array`);
}
```

### Modified Function

The modified function should look like this:

```javascript
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
            // ...
```

## Next Steps

1. Add this logging code to the `sendEmailWithQR` function
2. Test the application by submitting a form with selected experiences
3. Check the server logs to see the state of the `matchingCourses` parameter when it's received by the function
4. Based on the logs, determine why the condition `(!matchingCourses || matchingCourses.length === 0)` is being triggered

## Potential Fixes

Depending on what the logs reveal, potential fixes might include:

1. If the array is not being passed correctly, fix the parameter passing
2. If the array is empty, investigate why it's empty
3. If there's a type conversion issue, fix the type conversion
4. If there's a scope/reference issue due to multiple function definitions, consolidate the functions