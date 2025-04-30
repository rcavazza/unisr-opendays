/**
 * This script restarts the server after applying the email implementation changes
 * It stops the current server process and starts a new one with the updated code
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Restarting Server After Email Implementation ===');

// Check if the server.js file exists
const serverFilePath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverFilePath)) {
    console.error('Error: server.js file not found');
    process.exit(1);
}

// Function to execute a command and return a promise
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`Executing command: ${command}`);
        
        const childProcess = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
            }
            
            console.log(`Command stdout: ${stdout}`);
            resolve(stdout);
        });
        
        // Forward the child process stdout and stderr to the parent process
        childProcess.stdout.pipe(process.stdout);
        childProcess.stderr.pipe(process.stderr);
    });
}

// Main function
async function main() {
    try {
        // Find and kill the current server process
        console.log('Finding and killing the current server process...');
        
        // On Windows
        if (process.platform === 'win32') {
            try {
                await executeCommand('taskkill /F /IM node.exe /FI "WINDOWTITLE eq node server.js"');
            } catch (error) {
                console.log('No matching server process found or could not kill process');
                console.log('Continuing with server restart...');
            }
        } 
        // On Linux/Mac
        else {
            try {
                await executeCommand('pkill -f "node server.js"');
            } catch (error) {
                console.log('No matching server process found or could not kill process');
                console.log('Continuing with server restart...');
            }
        }
        
        // Wait a moment for the process to fully terminate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start the server
        console.log('Starting the server...');
        
        // Start the server in a new terminal window
        if (process.platform === 'win32') {
            // On Windows, use start cmd
            await executeCommand('start cmd /k "node server.js"');
        } else if (process.platform === 'darwin') {
            // On macOS, use open -a Terminal
            await executeCommand('osascript -e \'tell app "Terminal" to do script "cd \\"$(pwd)\\" && node server.js"\'');
        } else {
            // On Linux, use xterm or gnome-terminal
            try {
                await executeCommand('xterm -e "node server.js" &');
            } catch (error) {
                try {
                    await executeCommand('gnome-terminal -- node server.js');
                } catch (error) {
                    console.error('Could not start the server in a new terminal window');
                    console.log('Starting the server in the current terminal...');
                    
                    // Start the server in the current terminal
                    const serverProcess = exec('node server.js');
                    serverProcess.stdout.pipe(process.stdout);
                    serverProcess.stderr.pipe(process.stderr);
                    
                    console.log('Server started in the current terminal');
                    console.log('Press Ctrl+C to stop the server');
                    
                    // Keep the script running
                    return;
                }
            }
        }
        
        console.log('Server restarted successfully!');
        console.log('The server is now running with the email implementation changes');
        console.log('');
        console.log('To test the implementation, run:');
        console.log('node test_email_implementation.js');
    } catch (error) {
        console.error('Error restarting server:', error.message);
        process.exit(1);
    }
}

// Execute the main function
main();