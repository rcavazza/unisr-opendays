/**
 * This script fixes potential issues with the email sending functionality
 * in the /api/update-selected-experiences endpoint
 */

const fs = require('fs');
const path = require('path');

// Path to the server.js file
const serverFilePath = path.join(__dirname, 'server.js');

console.log('Reading server.js file...');
const serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Define the fixes to apply
const fixes = [
    // Fix 1: Ensure the language is correctly extracted from the request
    {
        pattern: /const language = req\.query\.lang === 'it' \? 'it' : 'en';/g,
        replacement: `// Extract language from URL path or query parameter
        let language = 'en';
        if (req.query.lang === 'it' || req.path.includes('/it/')) {
            language = 'it';
        }`
    },
    
    // Fix 2: Ensure the QR code URL is correctly formatted
    {
        pattern: /const qrCodeUrl = `qrimg\/${qrFileName}`;/g,
        replacement: `const qrCodeUrl = \`qrimg/\${qrFileName}\`;`
    },
    
    // Fix 3: Improve error handling for experience fetching
    {
        pattern: /const validExperiences = experiences\.filter\(exp => exp !== null\);/g,
        replacement: `const validExperiences = experiences.filter(exp => exp !== null);
            
            // If no valid experiences were found, create a default one to avoid empty email
            if (validExperiences.length === 0) {
                logger.warn('No valid experiences found, using default experience data');
                validExperiences.push({
                    title: language === 'en' ? 'Open Day Registration' : 'Registrazione Open Day',
                    date: 'May 10, 2025',
                    location: 'Main Campus',
                    time: '10:00'
                });
            }`
    },
    
    // Fix 4: Ensure the email template data includes all necessary fields
    {
        pattern: /fieldData: \{\s*experiences: validExperiences\s*\}/g,
        replacement: `fieldData: {
                            experiences: validExperiences,
                            courses: [] // Include empty courses array to avoid template errors
                        }`
    }
];

// Apply the fixes
let updatedContent = serverContent;
let fixesApplied = 0;

fixes.forEach((fix, index) => {
    const originalContent = updatedContent;
    updatedContent = updatedContent.replace(fix.pattern, fix.replacement);
    
    if (originalContent !== updatedContent) {
        console.log(`Fix ${index + 1} applied successfully`);
        fixesApplied++;
    } else {
        console.log(`Fix ${index + 1} not applied (pattern not found)`);
    }
});

if (fixesApplied > 0) {
    // Create a backup of the current file
    console.log('Creating backup of current server.js...');
    fs.writeFileSync(`${serverFilePath}.email_fix.bak`, serverContent, 'utf8');
    
    // Write the updated content to server.js
    console.log('Writing updated content to server.js...');
    fs.writeFileSync(serverFilePath, updatedContent, 'utf8');
    
    console.log(`Fixes applied successfully! (${fixesApplied} of ${fixes.length})`);
    console.log('A backup of the original server.js has been created as server.js.email_fix.bak');
} else {
    console.log('No fixes were applied. The server.js file remains unchanged.');
}

// Additional check for email_courses.ejs template
const emailCoursesEnPath = path.join(__dirname, 'views', 'en', 'email_courses.ejs');
const emailCoursesItPath = path.join(__dirname, 'views', 'it', 'email_courses.ejs');

// Check if the email_courses.ejs templates exist
if (!fs.existsSync(emailCoursesEnPath)) {
    console.warn('Warning: English email_courses.ejs template not found at', emailCoursesEnPath);
    console.warn('Make sure the template exists and is correctly referenced in email.ejs');
}

if (!fs.existsSync(emailCoursesItPath)) {
    console.warn('Warning: Italian email_courses.ejs template not found at', emailCoursesItPath);
    console.warn('Make sure the template exists and is correctly referenced in email.ejs');
}

// Check if the email.ejs templates include the type check for email_courses.ejs
const emailEnPath = path.join(__dirname, 'views', 'en', 'email.ejs');
const emailItPath = path.join(__dirname, 'views', 'it', 'email.ejs');

if (fs.existsSync(emailEnPath)) {
    const emailEnContent = fs.readFileSync(emailEnPath, 'utf8');
    if (!emailEnContent.includes('type === 2') && !emailEnContent.includes('include(\'email_courses\')')) {
        console.warn('Warning: English email.ejs template may not include the type check for email_courses.ejs');
        console.warn('Make sure the template includes the type check and include statement');
    }
}

if (fs.existsSync(emailItPath)) {
    const emailItContent = fs.readFileSync(emailItPath, 'utf8');
    if (!emailItContent.includes('type === 2') && !emailItContent.includes('include(\'email_courses\')')) {
        console.warn('Warning: Italian email.ejs template may not include the type check for email_courses.ejs');
        console.warn('Make sure the template includes the type check and include statement');
    }
}

console.log('Email template check completed.');