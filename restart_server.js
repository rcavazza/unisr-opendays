/**
 * Script to restart the server with the updated slot calculation logic
 */
const { exec } = require('child_process');
const path = require('path');

console.log('Restarting server with updated slot calculation logic...');

// Find the server process
exec('tasklist /fi "imagename eq node.exe" /fo csv', (error, stdout) => {
  if (error) {
    console.error(`Error finding server process: ${error.message}`);
    return;
  }
  
  // Parse the CSV output
  const lines = stdout.trim().split('\n');
  if (lines.length <= 1) {
    console.log('No Node.js processes found. Starting server...');
    startServer();
    return;
  }
  
  // Skip the header line
  const processes = lines.slice(1).map(line => {
    const parts = line.replace(/"/g, '').split(',');
    return {
      name: parts[0],
      pid: parseInt(parts[1], 10)
    };
  });
  
  console.log(`Found ${processes.length} Node.js processes`);
  
  // Kill the server process (assuming it's the only Node.js process)
  const killPromises = processes.map(proc => {
    return new Promise((resolve) => {
      console.log(`Killing process with PID ${proc.pid}...`);
      exec(`taskkill /PID ${proc.pid} /F`, (error) => {
        if (error) {
          console.log(`Process ${proc.pid} may already be terminated or couldn't be killed`);
        } else {
          console.log(`Process ${proc.pid} terminated successfully`);
        }
        resolve();
      });
    });
  });
  
  // After killing all processes, start the server
  Promise.all(killPromises).then(() => {
    console.log('All Node.js processes terminated. Starting server...');
    startServer();
  });
});

function startServer() {
  console.log('Starting server...');
  
  // Start the server in a new process
  const serverProcess = exec('node server.js', (error) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`);
    }
  });
  
  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data.trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data.trim()}`);
  });
  
  // Wait for the server to start
  setTimeout(() => {
    console.log('\nServer should be started. Testing API...');
    
    // Test the API
    exec('node test_api_slots.js', (error, stdout) => {
      if (error) {
        console.error(`Error testing API: ${error.message}`);
        return;
      }
      
      console.log(stdout);
      console.log('\nServer restart complete. The API should now use the updated slot calculation logic.');
    });
  }, 5000); // Wait 5 seconds for the server to start
}