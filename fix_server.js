#!/usr/bin/env node

/**
 * Script per correggere l'errore nel file server.js
 * 
 * Questo script:
 * 1. Legge il file server.js
 * 2. Corregge l'errore di sintassi nella rotta /submit-email
 * 3. Salva il file server.js modificato
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const serverFilePath = path.join(__dirname, 'server.js');
const backupFilePath = path.join(__dirname, 'server.js.fix.bak');

console.log('Avvio correzione errore nel file server.js...');

// Leggi il file server.js
fs.readFile(serverFilePath, 'utf8', (err, content) => {
    if (err) {
        console.error('Errore nella lettura del file server.js:', err.message);
        process.exit(1);
    }
    
    // Crea un backup del file server.js
    fs.writeFile(backupFilePath, content, 'utf8', (err) => {
        if (err) {
            console.error('Errore nella creazione del backup del file server.js:', err.message);
            process.exit(1);
        }
        
        console.log('Backup del file server.js creato con successo');
        
        // Correggi l'errore di sintassi
        // Cerca la rotta /submit-email
        const submitEmailStartRegex = /app\.post\('\/submit-email'/;
        const submitEmailStartMatch = content.match(submitEmailStartRegex);
        
        if (!submitEmailStartMatch) {
            console.error('Errore nel trovare l\'inizio della rotta /submit-email nel file server.js');
            process.exit(1);
        }
        
        // Cerca il commento "// Pagina di conferma corsi"
        const confirmCoursesCommentRegex = /\/\/ Pagina di conferma corsi/;
        const confirmCoursesCommentMatch = content.match(confirmCoursesCommentRegex);
        
        if (!confirmCoursesCommentMatch) {
            console.error('Errore nel trovare il commento "// Pagina di conferma corsi" nel file server.js');
            process.exit(1);
        }
        
        // Trova la posizione dell'inizio della rotta /submit-email
        const submitEmailStartPos = submitEmailStartMatch.index;
        
        // Trova la posizione del commento "// Pagina di conferma corsi"
        const confirmCoursesCommentPos = confirmCoursesCommentMatch.index;
        
        // Estrai il contenuto della rotta /submit-email
        const submitEmailContent = content.substring(submitEmailStartPos, confirmCoursesCommentPos);
        
        // Verifica se la rotta /submit-email è già chiusa correttamente
        if (submitEmailContent.includes('});')) {
            console.log('La rotta /submit-email è già chiusa correttamente');
            process.exit(0);
        }
        
        // Trova l'ultima parentesi graffa chiusa nella rotta /submit-email
        const lastClosingBracePos = submitEmailContent.lastIndexOf('}');
        
        if (lastClosingBracePos === -1) {
            console.error('Errore nel trovare l\'ultima parentesi graffa chiusa nella rotta /submit-email');
            process.exit(1);
        }
        
        // Calcola la posizione dell'ultima parentesi graffa chiusa nel file originale
        const lastClosingBraceGlobalPos = submitEmailStartPos + lastClosingBracePos;
        
        // Inserisci la chiusura della rotta /submit-email dopo l'ultima parentesi graffa chiusa
        const modifiedContent = 
            content.substring(0, lastClosingBraceGlobalPos + 1) + 
            `
    }
});

` + 
            content.substring(confirmCoursesCommentPos);
        
        // Salva il file server.js modificato
        fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
            if (err) {
                console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                process.exit(1);
            }
            
            console.log('Errore corretto con successo nel file server.js');
            console.log('La rotta /submit-email è stata chiusa correttamente');
            console.log('\nPer ripristinare il file originale, eseguire:');
            console.log(`cp ${backupFilePath} ${serverFilePath}`);
        });
    });
});