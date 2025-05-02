# Email Function Modification Plan

## Problem Statement

The `sendEmailWithQR` function needs to have two different behaviors depending on where it's called from:
- When called from the `/opendays` route, it should use `otto.json` for course data
- In other cases, it should continue using `corsi.json` as it does currently

## Solution

Add a parameter to the `sendEmailWithQR` function that determines which JSON file to use for course data.

## Implementation Steps

1. Modify the `sendEmailWithQR` function signature to accept a new parameter `useOttoJson`:
   ```javascript
   function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false)
   ```

2. Create a new function `getMatchingCoursesFromOtto` that reads from otto.json:
   ```javascript
   function getMatchingCoursesFromOtto(courseTypes) {
       try {
           logger.info(`Attempting to read otto.json file...`);
           const coursesPath = path.join(__dirname, 'otto.json');
           logger.info(`Full path to otto.json: ${coursesPath}`);
           
           const coursesData = fs.readFileSync(coursesPath, 'utf8');
           logger.info(`Successfully read otto.json file`);
           
           const allCourses = JSON.parse(coursesData);
           logger.info(`Parsed ${allCourses.length} courses from otto.json`);
           logger.info(`Looking for courses with course types: ${courseTypes.join(', ')}`);
           
           // Filter courses by matching course types
           const matchingCourses = allCourses.filter(course =>
               courseTypes.includes(course.id)
           );
           
           logger.info(`Found ${matchingCourses.length} matching courses in otto.json`);
           return matchingCourses;
       } catch (error) {
           logger.error('Error reading otto.json data:', error);
           return [];
       }
   }
   ```

3. Modify the `sendEmailWithQR` function to use the appropriate function based on the `useOttoJson` parameter:
   ```javascript
   function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false) {
       return new Promise((resolve, reject) => {
           console.log("XXXXX");
           
           // If useOttoJson is true and matchingCourses is empty or not provided, get courses from otto.json
           if (useOttoJson && (!matchingCourses || matchingCourses.length === 0)) {
               // Extract course IDs from validExperiences or use a default approach
               const courseTypes = validExperiences.map(exp => exp.id || '').filter(id => id);
               matchingCourses = getMatchingCoursesFromOtto(courseTypes);
               logger.info(`Using otto.json for courses, found ${matchingCourses.length} matching courses`);
           } else if (!matchingCourses || matchingCourses.length === 0) {
               // Use the existing approach with corsi.json
               const courseTypes = validExperiences.map(exp => exp.id || '').filter(id => id);
               matchingCourses = getMatchingCourses(courseTypes);
               logger.info(`Using corsi.json for courses, found ${matchingCourses.length} matching courses`);
           }
           
           // Rest of the function remains the same...
           // ...
       });
   }
   ```

4. Update the call to `sendEmailWithQR` in the `/opendays` route handler to pass `true` for the new parameter:
   ```javascript
   // Line 369 in the /opendays route handler
   await sendEmailWithQR(contact, qrCodeUrl, [], language, matchingCourses, true);
   ```

## Expected Behavior

- When called from the `/opendays` route with `useOttoJson = true`, the function will use `otto.json` for course data
- In all other cases where `useOttoJson` is not specified or is `false`, it will continue using `corsi.json` as before

This approach maintains backward compatibility with existing code while adding the new functionality.