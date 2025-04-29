/**
 * Script to restart the server after fixing the experience query issue
 */
const { exec } = require('child_process');
const path = require('path');
const logger = require('./logger');

logger.info('Restarting server after fixing experience query issue...');

// Kill any existing server process
exec('taskkill /f /im node.exe', (error, stdout, stderr) => {
  if (error) {
    logger.warn(`Could not kill existing Node processes: ${error.message}`);
    logger.info('This is normal if no server was running');
  } else {
    logger.info('Successfully terminated existing Node processes');
  }
  
  // Start the server
  logger.info('Starting server...');
  const server = exec('node server.js', (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error starting server: ${error.message}`);
      return;
    }
  });
  
  server.stdout.on('data', (data) => {
    logger.info(`Server output: ${data}`);
  });
  
  server.stderr.on('data', (data) => {
    logger.error(`Server error: ${data}`);
  });
  
  logger.info('Server restart initiated. Check server logs for status.');
});