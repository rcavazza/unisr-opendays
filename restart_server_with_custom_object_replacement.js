/**
 * This script restarts the server with the modified custom object replacement implementation
 * 
 * The new implementation:
 * 1. Keeps the original custom object IDs for returning to the frontend
 * 2. Creates a separate list of modified IDs for querying the database
 * 3. Uses the modified IDs only for the database query, not for the frontend response
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Restarting server with modified custom object replacement implementation...');

// Check if the server.js file exists
const serverPath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverPath)) {
    console.error(`Error: server.js not found at ${serverPath}`);
    process.exit(1);
}

// First, check if the server is already running and kill it
console.log('Checking for running server processes...');
exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
    if (error) {
        console.log('No server process found or could not be killed. This is OK if the server is not running.');
    } else {
        console.log('Existing server process terminated.');
    }
    
    // Wait a moment to ensure the port is released
    setTimeout(() => {
        // Start the server
        console.log('Starting server...');
        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            shell: true
        });

        server.on('error', (err) => {
            console.error('Failed to start server:', err);
            process.exit(1);
        });

        // Give the server a moment to start up
        setTimeout(() => {
            console.log('Server started successfully.');
            console.log('');
            console.log('You can now run the verification script:');
            console.log('node verify_custom_object_replacement.js');
        }, 2000);
    }, 1000);
});