#!/usr/bin/env node

/**
 * Script per aggiungere l'importazione del modulo courseExperienceService al file server.js
 * 
 * Questo script:
 * 1. Legge il file server.js
 * 2. Aggiunge l'importazione del modulo courseExperienceService all'inizio del file
 * 3. Salva il file server.js modificato
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const serverFilePath = path.join(__dirname, 'server.js');
const backupFilePath = path.join(__dirname, 'server.js.add_import.bak');

console.log('Avvio aggiunta dell\'importazione del modulo courseExperienceService al file server.js...');

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
        
        // Verifica se l'importazione è già presente
        if (content.includes('const courseExperienceService = require(\'./courseExperienceService\');')) {
            console.log('L\'importazione del modulo courseExperienceService è già presente nel file server.js');
            process.exit(0);
        }
        
        // Trova la posizione in cui aggiungere l'importazione
        // Cerca l'ultima importazione come punto di riferimento
        const lastRequireRegex = /const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*require\([^)]+\);/g;
        let lastRequireMatch;
        let lastRequirePos = 0;
        
        while ((match = lastRequireRegex.exec(content)) !== null) {
            lastRequireMatch = match;
            lastRequirePos = match.index + match[0].length;
        }
        
        if (lastRequirePos > 0) {
            // Aggiungi l'importazione dopo l'ultima importazione trovata
            const importLine = '\nconst courseExperienceService = require(\'./courseExperienceService\');';
            const modifiedContent = 
                content.substring(0, lastRequirePos) + 
                importLine + 
                content.substring(lastRequirePos);
            
            // Salva il file server.js modificato
            fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
                if (err) {
                    console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                    process.exit(1);
                }
                
                console.log('Importazione del modulo courseExperienceService aggiunta con successo al file server.js');
                console.log('\nPer ripristinare il file originale, eseguire:');
                console.log(`cp ${backupFilePath} ${serverFilePath}`);
            });
        } else {
            console.error('Errore nel trovare l\'ultima importazione nel file server.js');
            process.exit(1);
        }
    });
});