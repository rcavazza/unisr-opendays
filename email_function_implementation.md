# Email Function Implementation

Since Architect mode can only edit Markdown files, here's the detailed implementation that you can use when switching to Code mode.

## 1. Add the `getMatchingCoursesFromOtto` function

Add this function after the existing `getMatchingCourses` function in the `/opendays` route handler (around line 148):

```javascript
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
```

## 2. Modify the `sendEmailWithQR` function

Update the function signature and add logic to handle the new parameter (around line 182):

```javascript
// Function to send email with QR code that returns a Promise
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false) {
    return new Promise((resolve, reject) => {
        console.log("XXXXX");
        
        // If useOttoJson is true and matchingCourses is empty, get courses from otto.json
        if (useOttoJson === true && (!matchingCourses || matchingCourses.length === 0)) {
            // Extract course IDs from validExperiences or use a default approach
            const courseTypes = validExperiences.map(exp => exp.id || '').filter(id => id);
            if (courseTypes.length > 0) {
                matchingCourses = getMatchingCoursesFromOtto(courseTypes);
                logger.info(`Using otto.json for courses, found ${matchingCourses.length} matching courses`);
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
        
        // Rest of the function remains unchanged...
```

## 3. Update the call to `sendEmailWithQR` in the `/opendays` route handler

Modify the call to include the new parameter (around line 369):

```javascript
// 4. Chiama sendEmailWithQR con array vuoto per le esperienze
await sendEmailWithQR(contact, qrCodeUrl, [], language, matchingCourses, true);
```

## 4. Update the second implementation of `sendEmailWithQR` (if present)

If there's a second implementation of `sendEmailWithQR` elsewhere in the code (around line 855), update it with the same changes:

```javascript
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false) {
    return new Promise((resolve, reject) => {
        console.log("XXXXX");
        
        // If useOttoJson is true and matchingCourses is empty, get courses from otto.json
        if (useOttoJson === true && (!matchingCourses || matchingCourses.length === 0)) {
            // Extract course IDs from validExperiences or use a default approach
            const courseTypes = validExperiences.map(exp => exp.id || '').filter(id => id);
            if (courseTypes.length > 0) {
                matchingCourses = getMatchingCoursesFromOtto(courseTypes);
                logger.info(`Using otto.json for courses, found ${matchingCourses.length} matching courses`);
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
        
        // Rest of the function remains unchanged...
```

## 5. Update any other calls to `sendEmailWithQR`

Search for other calls to `sendEmailWithQR` in the code and update them to include the new parameter as needed. For example, around line 1273:

```javascript
await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false);
```

## Next Steps

1. Switch to Code mode using the switch_mode tool
2. Implement these changes to the server.js file
3. Test the functionality to ensure it works as expected