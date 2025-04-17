const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'app.log');

// Create a write stream for logging
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function getClientIp(req) {
    // Controlla prima l'header X-Forwarded-For, che AWS usa per l'IP originale
    const forwardedIps = req.headers['x-forwarded-for'];
    if (forwardedIps) {
        // Prendi il primo IP nella lista, che dovrebbe essere quello del client
        return forwardedIps.split(',')[0].trim();
    }

    const ip = req.ip || req.connection.remoteAddress;
    
    // Se è ancora un IPv6, prova a estrarre l'IPv4 mappato
    if (ip.includes(':')) {
        const ipv4Match = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
        if (ipv4Match) {
            return ipv4Match[1];
        }
    }
    
    return ip;
}

// General purpose logging functions
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
        const startTimestamp = new Date().toISOString();
        logger.info(`Application started at ${startTimestamp}`);

        return (req, res, next) => {
            const date = new Date().toISOString();
            const ip = getClientIp(req);
            const method = req.method;
            const url = req.originalUrl || req.url;
            logger.info(`${ip} ${method} ${url}`);
            next();
        };
    }
};

module.exports = logger;
