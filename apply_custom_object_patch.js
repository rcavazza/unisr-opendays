/**
 * This script applies the custom object replacement patch to server.js
 * It modifies the /api/get_experiences endpoint to replace specific custom object IDs
 * with 25326449768 and removes duplicates of this ID.
 */

const fs = require('fs');
const path = require('path');

// Path to the server.js file
const serverFilePath = path.join(__dirname, 'server.js');

// Create a backup of the original file
const backupPath = `${serverFilePath}.bak`;
console.log(`Creating backup of server.js at ${backupPath}`);
fs.copyFileSync(serverFilePath, backupPath);

// Read the server.js file
console.log(`Reading server.js from ${serverFilePath}`);
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Find the /api/get_experiences endpoint
const endpointRegex = /app\.get\('\/api\/get_experiences',\s*async\s*\(req,\s*res\)\s*=>\s*{[\s\S]*?}\);/;
const endpointMatch = serverContent.match(endpointRegex);

if (!endpointMatch) {
    console.error('Could not find the /api/get_experiences endpoint in server.js');
    process.exit(1);
}

// Extract the endpoint code
const originalEndpoint = endpointMatch[0];

// Find the section where custom object IDs are extracted and filtered
const sectionToReplaceRegex = /\/\/ Extract IDs from custom objects[\s\S]*?const filteredObjectIds = \[\];[\s\S]*?for \(const customId of customObjectIds\) {/;
const sectionMatch = originalEndpoint.match(sectionToReplaceRegex);

if (!sectionMatch) {
    console.error('Could not find the section to replace in the endpoint');
    process.exit(1);
}

// Create the replacement code
const replacementCode = `// Extract IDs from custom objects and log their types
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
        const filteredObjectIds = [];
        for (const customId of uniqueCustomObjectIds) {`;

// Replace the section in the endpoint
const modifiedEndpoint = originalEndpoint.replace(sectionToReplaceRegex, replacementCode);

// Replace the endpoint in the server.js content
serverContent = serverContent.replace(originalEndpoint, modifiedEndpoint);

// Write the modified content back to server.js
console.log('Writing modified content to server.js');
fs.writeFileSync(serverFilePath, serverContent);

console.log('Custom object replacement patch applied successfully');
console.log(`Original server.js backed up to ${backupPath}`);
console.log('Changes made:');
console.log('1. Added code to replace custom object IDs 25417865498, 25417865493, and 25417865392 with 25326449768');
console.log('2. Added code to remove duplicates of 25326449768 after replacement');
console.log('3. Modified the for loop to use uniqueCustomObjectIds instead of customObjectIds');