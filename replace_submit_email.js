#!/usr/bin/env node

/**
 * Script per sostituire la rotta /submit-email nel file server.js
 * 
 * Questo script:
 * 1. Legge il file server.js
 * 2. Legge il file submit_email_route.js
 * 3. Sostituisce la rotta /submit-email nel file server.js con la versione corretta
 * 4. Salva il file server.js modificato
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const serverFilePath = path.join(__dirname, 'server.js');
const routeFilePath = path.join(__dirname, 'submit_email_route.js');
const backupFilePath = path.join(__dirname, 'server.js.replace.bak');

console.log('Avvio sostituzione della rotta /submit-email nel file server.js...');

// Leggi il file server.js
fs.readFile(serverFilePath, 'utf8', (err, serverContent) => {
    if (err) {
        console.error('Errore nella lettura del file server.js:', err.message);
        process.exit(1);
    }
    
    // Leggi il file submit_email_route.js
    fs.readFile(routeFilePath, 'utf8', (err, routeContent) => {
        if (err) {
            console.error('Errore nella lettura del file submit_email_route.js:', err.message);
            process.exit(1);
        }
        
        // Crea un backup del file server.js
        fs.writeFile(backupFilePath, serverContent, 'utf8', (err) => {
            if (err) {
                console.error('Errore nella creazione del backup del file server.js:', err.message);
                process.exit(1);
            }
            
            console.log('Backup del file server.js creato con successo');
            
            // Trova l'inizio della rotta /submit-email
            const submitEmailStartRegex = /app\.post\('\/submit-email'/;
            const submitEmailStartMatch = serverContent.match(submitEmailStartRegex);
            
            if (!submitEmailStartMatch) {
                console.error('Errore nel trovare l\'inizio della rotta /submit-email nel file server.js');
                process.exit(1);
            }
            
            // Trova la posizione dell'inizio della rotta /submit-email
            const submitEmailStartPos = submitEmailStartMatch.index;
            
            // Trova la posizione della fine della rotta /submit-email
            const submitEmailEndRegex = /}\s*}\);\s*(?=app\.)/;
            const submitEmailEndMatch = serverContent.substring(submitEmailStartPos).match(submitEmailEndRegex);
            
            if (!submitEmailEndMatch) {
                console.error('Errore nel trovare la fine della rotta /submit-email nel file server.js');
                
                // Cerca il commento "// Pagina di conferma corsi"
                const confirmCoursesRegex = /\/\/ Pagina di conferma corsi/;
                const confirmCoursesMatch = serverContent.match(confirmCoursesRegex);
                
                if (!confirmCoursesMatch) {
                    console.error('Errore nel trovare il commento "// Pagina di conferma corsi" nel file server.js');
                    process.exit(1);
                }
                
                // Usa la posizione del commento "// Pagina di conferma corsi" come punto di riferimento
                const confirmCoursesPos = confirmCoursesMatch.index;
                
                // Sostituisci tutto il contenuto tra l'inizio della rotta /submit-email e il commento "// Pagina di conferma corsi"
                const modifiedContent = 
                    serverContent.substring(0, submitEmailStartPos) + 
                    routeContent + 
                    '\n\n' + 
                    serverContent.substring(confirmCoursesPos);
                
                // Salva il file server.js modificato
                fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
                    if (err) {
                        console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                        process.exit(1);
                    }
                    
                    console.log('Rotta /submit-email sostituita con successo nel file server.js');
                    console.log('\nPer ripristinare il file originale, eseguire:');
                    console.log(`cp ${backupFilePath} ${serverFilePath}`);
                });
            } else {
                // Calcola la posizione della fine della rotta /submit-email nel file originale
                const submitEmailEndPos = submitEmailStartPos + submitEmailEndMatch.index + submitEmailEndMatch[0].length;
                
                // Sostituisci la rotta /submit-email con la versione corretta
                const modifiedContent = 
                    serverContent.substring(0, submitEmailStartPos) + 
                    routeContent + 
                    '\n\n' + 
                    serverContent.substring(submitEmailEndPos);
                
                // Salva il file server.js modificato
                fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
                    if (err) {
                        console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                        process.exit(1);
                    }
                    
                    console.log('Rotta /submit-email sostituita con successo nel file server.js');
                    console.log('\nPer ripristinare il file originale, eseguire:');
                    console.log(`cp ${backupFilePath} ${serverFilePath}`);
                });
            }
        });
    });
});