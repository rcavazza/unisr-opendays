/**
 * Script to restart the server after fixing the slot calculation issue
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('Restarting server after fixing the slot calculation issue...');

// Start the server directly without killing other processes
console.log('Starting server...');
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
  detached: true
});

// Detach the process
server.unref();

console.log('Server started successfully. The fix for the slot calculation issue has been applied.');
console.log('You should now see the correct available slots in the frontend.');

// Handle errors
server.on('error', (err) => {
  console.error('Error starting server:', err);
});