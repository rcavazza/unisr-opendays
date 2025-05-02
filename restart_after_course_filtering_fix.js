/**
 * Script to restart the server after implementing the course filtering fix
 */

const { exec } = require('child_process');
const path = require('path');

console.log('Restarting server after course filtering fix...');

// Kill any existing node processes (adjust as needed for your environment)
exec('taskkill /f /im node.exe', (error) => {
  // Ignore errors from the kill command (e.g., if no processes were running)
  
  // Start the server
  const serverPath = path.join(__dirname, 'server.js');
  console.log(`Starting server from: ${serverPath}`);
  
  const server = exec(`node ${serverPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Server stderr: ${stderr}`);
    }
  });
  
  // Log server output
  server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  console.log('Server restart initiated. Check logs for details.');
  console.log('\nTo test the fix:');
  console.log('1. Run the test_matching_course_ids.js script');
  console.log('2. Check the server logs for proper handling of matchingCourseIds');
  console.log('3. Verify that the same courses appear in both the confirmation page and email');
});