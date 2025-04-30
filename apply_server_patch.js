/**
 * This script applies the email sending functionality patch to server.js
 * It replaces the existing /api/update-selected-experiences endpoint with the new one
 * that includes email sending functionality
 */

const fs = require('fs');
const path = require('path');

// Path to the server.js file
const serverFilePath = path.join(__dirname, 'server.js');

// Path to the submit_email_route.js file
const patchFilePath = path.join(__dirname, 'submit_email_route.js');

// Read the files
try {
    console.log('Reading server.js file...');
    const serverContent = fs.readFileSync(serverFilePath, 'utf8');
    
    console.log('Reading submit_email_route.js file...');
    const patchContent = fs.readFileSync(patchFilePath, 'utf8');
    
    // Define the pattern to match the existing endpoint
    // We need to match the entire endpoint function from app.post to the closing brace
    const endpointPattern = /app\.post\('\/api\/update-selected-experiences'[\s\S]*?(?=app\.get\('\/selection')|$)/;
    
    // Check if the pattern exists in the server.js file
    if (!endpointPattern.test(serverContent)) {
        console.error('Could not find the /api/update-selected-experiences endpoint in server.js');
        process.exit(1);
    }
    
    // Replace the existing endpoint with the new one
    console.log('Replacing the endpoint in server.js...');
    const updatedContent = serverContent.replace(endpointPattern, patchContent);
    
    // Create a backup of the original file
    console.log('Creating backup of original server.js...');
    fs.writeFileSync(`${serverFilePath}.bak`, serverContent, 'utf8');
    
    // Write the updated content to server.js
    console.log('Writing updated content to server.js...');
    fs.writeFileSync(serverFilePath, updatedContent, 'utf8');
    
    console.log('Patch applied successfully!');
    console.log('A backup of the original server.js has been created as server.js.bak');
} catch (error) {
    console.error('Error applying patch:', error);
    process.exit(1);
}