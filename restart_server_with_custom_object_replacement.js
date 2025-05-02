/**
 * This script restarts the server after applying the custom object replacement patch
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Restarting server with custom object replacement patch...');

// Check if the server.js file exists
const serverPath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverPath)) {
    console.error(`Error: server.js not found at ${serverPath}`);
    process.exit(1);
}

// Start the server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
});

console.log('Server restarted successfully');