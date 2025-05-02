/**
 * This script applies the custom object replacement patch to server.js
 * It modifies the /api/get_experiences endpoint to replace specific custom object IDs
 * with 25326449768 and removes duplicates of this ID.
 */

const fs = require('fs');
const path = require('path');

// Path to the server.js file
const serverFilePath = path.join(__dirname, 'server.js');

// Read the server.js file
console.log(`Reading server.js from ${serverFilePath}`);
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Define the code to find
const codeToFind = `        // Extract IDs from custom objects and log their types
        const customObjectIds = customObjects.map(obj => {
            logger.info(\`Custom object ID: \${obj.id}, Type: \${typeof obj.id}\`);
            return obj.id;
        });
        
        // Try both string and number comparisons for filtering
        const filteredObjectIds = [];`;

// Define the replacement code
const replacementCode = `        // Extract IDs from custom objects and log their types
        const customObjectIds = customObjects.map(obj => {
            logger.info(\`Custom object ID: \${obj.id}, Type: \${typeof obj.id}\`);
            return obj.id;
        });
        
        // MODIFICATION: Replace specific custom object IDs with 25326449768
        const targetIds = ['25417865498', '25417865493', '25417865392'];
        const replacementId = '25326449768';
        
        // Convert all IDs to strings for consistent comparison
        const processedCustomObjectIds = customObjectIds.map(id => {
            const strId = String(id);
            // If the ID is one of the target IDs, replace it with the replacement ID
            if (targetIds.includes(strId)) {
                logger.info(\`Replacing custom object ID \${strId} with \${replacementId}\`);
                return replacementId;
            }
            return strId;
        });
        
        // Remove duplicates of the replacement ID
        const uniqueCustomObjectIds = [];
        const replacementIdCount = {};
        
        processedCustomObjectIds.forEach(id => {
            // If it's the replacement ID, check if we've already added it
            if (id === replacementId) {
                if (!replacementIdCount[replacementId]) {
                    replacementIdCount[replacementId] = 0;
                    uniqueCustomObjectIds.push(id);
                }
                replacementIdCount[replacementId]++;
                logger.info(\`Found \${replacementId} (count: \${replacementIdCount[replacementId]})\`);
            } else {
                // For other IDs, always add them
                uniqueCustomObjectIds.push(id);
            }
        });
        
        logger.info(\`Original custom object IDs: \${customObjectIds.join(', ')}\`);
        logger.info(\`Processed custom object IDs: \${processedCustomObjectIds.join(', ')}\`);
        logger.info(\`Unique custom object IDs: \${uniqueCustomObjectIds.join(', ')}\`);
        
        // Try both string and number comparisons for filtering
        const filteredObjectIds = [];`;

// Replace the code
if (serverContent.includes(codeToFind)) {
    console.log('Found the code to replace');
    serverContent = serverContent.replace(codeToFind, replacementCode);
    
    // Update the for loop to use uniqueCustomObjectIds instead of customObjectIds
    const forLoopToFind = `for (const customId of customObjectIds) {`;
    const forLoopReplacement = `for (const customId of uniqueCustomObjectIds) {`;
    
    if (serverContent.includes(forLoopToFind)) {
        console.log('Found the for loop to replace');
        serverContent = serverContent.replace(forLoopToFind, forLoopReplacement);
    } else {
        console.error('Could not find the for loop to replace');
        process.exit(1);
    }
    
    // Create a backup of the original file
    const backupPath = `${serverFilePath}.bak`;
    console.log(`Creating backup of server.js at ${backupPath}`);
    fs.writeFileSync(backupPath, fs.readFileSync(serverFilePath));
    
    // Write the modified content back to server.js
    console.log('Writing modified content to server.js');
    fs.writeFileSync(serverFilePath, serverContent);
    
    console.log('Custom object replacement patch applied successfully');
} else {
    console.error('Could not find the code to replace');
    process.exit(1);
}