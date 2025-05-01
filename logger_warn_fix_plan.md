# Logger Warning Method Implementation Plan

## Problem Description

The server is experiencing a TypeError with the message:
```
TypeError: logger.warn is not a function
    at C:\Users\demouser\Desktop\UNISR\unisr-opendays\server.js:481:20
```

This error occurs because the `logger` object defined in `logger.js` does not have a `warn` method, but this method is being called in `server.js` at line 481:

```javascript
logger.warn(`No spots available for experience ${experienceId}, time slot ${timeSlotId}`);
```

## Current Logger Implementation

The current logger implementation in `logger.js` only has three methods:
1. `info` - For informational messages
2. `error` - For error messages
3. `middleware` - For HTTP request logging

```javascript
const logger = {
    info: (message) => {
        const logMessage = `[${new Date().toISOString()}] INFO: ${message}\n`;
        console.log(logMessage.trim());
        logStream.write(logMessage);
    },
    
    error: (message, error = null) => {
        let logMessage = `[${new Date().toISOString()}] ERROR: ${message}\n`;
        if (error) {
            if (typeof error === 'object') {
                logMessage += `Stack: ${error.stack}\n`;
                if (error.response) {
                    logMessage += `Response: ${JSON.stringify(error.response.data)}\n`;
                }
            } else {
                logMessage += `${error}\n`;
            }
        }
        console.error(logMessage.trim());
        logStream.write(logMessage);
    },

    // HTTP request middleware
    middleware: (options = {}) => {
        // Implementation details...
    }
};
```

## Solution

We need to add a `warn` method to the logger object in `logger.js`. The implementation should be similar to the existing methods, but with a "WARN" level instead of "INFO" or "ERROR".

### Implementation Details

The `warn` method should:
1. Format the message with a timestamp and "WARN" level
2. Log to both the console and the log file
3. Be placed between the `info` and `error` methods in the logger object

### Code Changes

Add the following method to the logger object in `logger.js`:

```javascript
warn: (message) => {
    const logMessage = `[${new Date().toISOString()}] WARN: ${message}\n`;
    console.warn(logMessage.trim());
    logStream.write(logMessage);
},
```

The updated logger object will look like:

```javascript
const logger = {
    info: (message) => {
        const logMessage = `[${new Date().toISOString()}] INFO: ${message}\n`;
        console.log(logMessage.trim());
        logStream.write(logMessage);
    },
    
    warn: (message) => {
        const logMessage = `[${new Date().toISOString()}] WARN: ${message}\n`;
        console.warn(logMessage.trim());
        logStream.write(logMessage);
    },
    
    error: (message, error = null) => {
        // Existing implementation...
    },
    
    // Existing middleware method...
};
```

## Testing

After implementing the fix:
1. Restart the server
2. Verify that the TypeError no longer occurs
3. Test the functionality that was previously failing (likely related to reservation availability)

## Implementation Steps

1. Edit `logger.js` to add the `warn` method
2. Save the file
3. Restart the server
4. Test the functionality to ensure the error is resolved

## Next Steps

After implementing this fix, we should consider:
1. Reviewing other parts of the codebase for similar issues (e.g., calls to other undefined logger methods)
2. Adding additional logging levels if needed (e.g., `debug`, `trace`)
3. Considering the use of an established logging library like Winston or Bunyan for more robust logging capabilities