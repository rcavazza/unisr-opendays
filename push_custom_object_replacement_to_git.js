/**
 * This script pushes the custom object replacement changes to git
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Pushing custom object replacement changes to git...');

try {
    // Add all modified files
    console.log('Adding modified files...');
    execSync('git add server.js verify_custom_object_replacement.js restart_server_with_custom_object_replacement.js custom_object_replacement_README.md modified_implementation_plan.md user_experience_impact.md', { stdio: 'inherit' });
    
    // Commit the changes
    console.log('Committing changes...');
    execSync('git commit -m "Implement modified custom object replacement to preserve original IDs in frontend response"', { stdio: 'inherit' });
    
    // Push to the remote repository
    console.log('Pushing to remote repository...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('Successfully pushed changes to git!');
} catch (error) {
    console.error('Error pushing changes to git:', error.message);
    process.exit(1);
}