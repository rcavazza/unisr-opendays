#!/usr/bin/env node

/**
 * Script per aggiungere le rotte definite in confirm_courses_route.js al file server.js
 * 
 * Questo script:
 * 1. Legge il file server.js
 * 2. Legge il file confirm_courses_route.js
 * 3. Aggiunge le rotte definite in confirm_courses_route.js al file server.js
 * 4. Salva il file server.js modificato
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const serverFilePath = path.join(__dirname, 'server.js');
const routesFilePath = path.join(__dirname, 'confirm_courses_route.js');
const backupFilePath = path.join(__dirname, 'server.js.add_routes.bak');

console.log('Avvio aggiunta delle rotte al file server.js...');

// Leggi il file server.js
fs.readFile(serverFilePath, 'utf8', (err, serverContent) => {
    if (err) {
        console.error('Errore nella lettura del file server.js:', err.message);
        process.exit(1);
    }
    
    // Leggi il file confirm_courses_route.js
    fs.readFile(routesFilePath, 'utf8', (err, routesContent) => {
        if (err) {
            console.error('Errore nella lettura del file confirm_courses_route.js:', err.message);
            process.exit(1);
        }
        
        // Crea un backup del file server.js
        fs.writeFile(backupFilePath, serverContent, 'utf8', (err) => {
            if (err) {
                console.error('Errore nella creazione del backup del file server.js:', err.message);
                process.exit(1);
            }
            
            console.log('Backup del file server.js creato con successo');
            
            // Trova la posizione in cui aggiungere le nuove rotte
            // Cerca la rotta /decodeqr come punto di riferimento
            const decodeqrRegex = /app\.post\('\/decodeqr'/;
            const decodeqrMatch = serverContent.match(decodeqrRegex);
            
            if (!decodeqrMatch) {
                console.error('Errore nel trovare la rotta /decodeqr nel file server.js');
                process.exit(1);
            }
            
            // Calcola la posizione in cui aggiungere le nuove rotte
            const insertPos = decodeqrMatch.index;
            
            // Aggiungi le rotte definite in confirm_courses_route.js al file server.js
            const modifiedContent = 
                serverContent.substring(0, insertPos) + 
                routesContent + 
                '\n\n' + 
                serverContent.substring(insertPos);
            
            // Salva il file server.js modificato
            fs.writeFile(serverFilePath, modifiedContent, 'utf8', (err) => {
                if (err) {
                    console.error('Errore nel salvataggio del file server.js modificato:', err.message);
                    process.exit(1);
                }
                
                console.log('Rotte aggiunte con successo al file server.js');
                console.log('\nPer ripristinare il file originale, eseguire:');
                console.log(`cp ${backupFilePath} ${serverFilePath}`);
            });
        });
    });
});