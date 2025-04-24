#!/usr/bin/env node

/**
 * Script per applicare le modifiche al file server.js
 * 
 * Questo script:
 * 1. Legge il file server.js
 * 2. Legge il file server_patch.js
 * 3. Applica le modifiche al file server.js
 * 4. Salva il file server.js modificato
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const serverFilePath = path.join(__dirname, 'server.js');
const patchFilePath = path.join(__dirname, 'server_patch.js');
const backupFilePath = path.join(__dirname, 'server.js.bak');

console.log('Avvio applicazione patch al file server.js...');

// Leggi il file server.js
fs.readFile(serverFilePath, 'utf8', (err, serverContent) => {
    if (err) {
        console.error('Errore nella lettura del file server.js:', err.message);
        process.exit(1);
    }
    
    // Crea un backup del file server.js
    fs.writeFile(backupFilePath, serverContent, 'utf8', (err) => {
        if (err) {
            console.error('Errore nella creazione del backup del file server.js:', err.message);
            process.exit(1);
        }
        
        console.log('Backup del file server.js creato con successo');
        
        // Leggi il file server_patch.js
        fs.readFile(patchFilePath, 'utf8', (err, patchContent) => {
            if (err) {
                console.error('Errore nella lettura del file server_patch.js:', err.message);
                process.exit(1);
            }
            
            // Estrai le modifiche dal file patch
            const importLine = "const courseExperienceService = require('./courseExperienceService');";
            const redirectLine = "res.redirect(`/confirm-courses?contactID=${contact.id}&lang=${language}&location=${encodeURIComponent(location)}`);";
            
            // Estrai le nuove rotte
            const routesStartMarker = "// Pagina di conferma corsi";
            const routesEndMarker = "});";
            // Escape special characters in the markers for use in regex
            const escapedStartMarker = routesStartMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedEndMarker = routesEndMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const routesRegex = new RegExp(`${escapedStartMarker}[\\s\\S]*${escapedEndMarker}$`, 'm');
            const routesMatch = patchContent.match(routesRegex);
            
            if (!routesMatch) {
                console.error('Errore nell\'estrazione delle nuove rotte dal file patch');
                process.exit(1);
            }
            
            const newRoutes = routesMatch[0];
            
            // Applica le modifiche al file server.js
            
            // 1. Aggiungi l'importazione del modulo courseExperienceService
            let modifiedContent = serverContent;
            const lastRequireRegex = /const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*require\([^)]+\);/g;
            let lastRequireMatch;
            let lastRequirePos = 0;
            
            while ((match = lastRequireRegex.exec(modifiedContent)) !== null) {
                lastRequireMatch = match;
                lastRequirePos = match.index + match[0].length;
            }
            
            if (lastRequirePos > 0) {
                modifiedContent = modifiedContent.slice(0, lastRequirePos) + '\n' + importLine + modifiedContent.slice(lastRequirePos);
            } else {
                console.error('Errore nel trovare l\'ultima importazione nel file server.js');
                process.exit(1);
            }
            
            // 2. Modifica la rotta /submit-email per reindirizzare a /confirm-courses
            const redirectRegex = /res\.redirect\(`\/selection\?contactID=\${contact\.id}&lang=\${language}&location=\${encodeURIComponent\(location\)}`\);/;
            modifiedContent = modifiedContent.replace(redirectRegex, redirectLine);
            
            // 3. Aggiungi le nuove rotte dopo la rotta /submit-email
            const submitEmailEndRegex = /app\.post\('\/submit-email'[\s\S]*?}\);/;
            const submitEmailEndMatch = modifiedContent.match(submitEmailEndRegex);
            
            if (!submitEmailEndMatch) {
                console.error('Errore nel trovare la fine della rotta /submit-email nel file server.js');
                process.exit(1);
            }
            
            const submitEmailEndPos = submitEmailEndMatch.index + submitEmailEndMatch[0].length;
            modifiedContent = modifiedContent.slice(0, submitEmailEndPos) + '\n\n' + newRoutes + modifiedContent.slice(submitEmailEndPos);
            
            // Salva il file server.js modificato
            fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
                if (err) {
                    console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                    process.exit(1);
                }
                
                console.log('Patch applicata con successo al file server.js');
                console.log('Le seguenti modifiche sono state apportate:');
                console.log('1. Aggiunta l\'importazione del modulo courseExperienceService');
                console.log('2. Modificata la rotta /submit-email per reindirizzare a /confirm-courses');
                console.log('3. Aggiunte le nuove rotte per la nuova modalità di registrazione');
                console.log('\nPer ripristinare il file originale, eseguire:');
                console.log(`cp ${backupFilePath} ${serverFilePath}`);
            });
        });
    });
});