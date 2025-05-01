/**
 * Script per riavviare il server dopo l'implementazione della soluzione in due fasi
 * per la visualizzazione degli slot prenotati
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Configurazione
const SERVER_SCRIPT = 'server.js';
const PORT = process.env.PORT || 3000;

/**
 * Funzione principale per riavviare il server
 */
async function restartServer() {
    try {
        console.log('Riavvio del server in corso con la soluzione in due fasi...');
        
        // Verifica che il file server.js esista
        const serverPath = path.join(__dirname, SERVER_SCRIPT);
        if (!fs.existsSync(serverPath)) {
            console.error(`File server non trovato: ${serverPath}`);
            process.exit(1);
        }
        
        // Avvia il server
        const serverProcess = spawn('node', [SERVER_SCRIPT], {
            stdio: 'inherit',
            env: {
                ...process.env,
                PORT: PORT,
                DEBUG: 'true' // Abilita il debug per vedere più log
            }
        });
        
        // Gestisci gli eventi del processo
        serverProcess.on('error', (error) => {
            console.error(`Errore nell'avvio del server: ${error.message}`);
            process.exit(1);
        });
        
        serverProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Il server si è chiuso con codice: ${code}`);
                process.exit(code);
            }
        });
        
        console.log(`Server avviato sulla porta ${PORT}`);
        console.log('Premi Ctrl+C per terminare');
        
    } catch (error) {
        console.error('Errore durante il riavvio del server:', error.message);
        process.exit(1);
    }
}

// Esegui la funzione principale
restartServer();