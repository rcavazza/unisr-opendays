#!/usr/bin/env node

/**
 * Script per correggere la struttura del file server.js
 * 
 * Questo script:
 * 1. Legge il file server.js
 * 2. Corregge la struttura della rotta /submit-email
 * 3. Salva il file server.js modificato
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const serverFilePath = path.join(__dirname, 'server.js');
const backupFilePath = path.join(__dirname, 'server.js.structure.bak');

console.log('Avvio correzione struttura del file server.js...');

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
        
        // Rimuovi la chiusura prematura della rotta /submit-email
        let modifiedContent = content.replace(/if \(!email[^}]*}\)\s*{\s*}\s*}\);/, (match) => {
            // Sostituisci con la versione corretta senza la chiusura prematura
            return match.replace(/}\s*}\);/, '}');
        });
        
        // Rimuovi il codice duplicato della rotta /submit-email
        modifiedContent = modifiedContent.replace(/}\s*}\);\s*}\s*try {[\s\S]*?contactID: ''[\s\S]*?}\);/, '');
        
        // Salva il file server.js modificato
        fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
            if (err) {
                console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                process.exit(1);
            }
            
            console.log('Struttura corretta con successo nel file server.js');
            console.log('\nPer ripristinare il file originale, eseguire:');
            console.log(`cp ${backupFilePath} ${serverFilePath}`);
        });
    });
});