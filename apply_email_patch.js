#!/usr/bin/env node

/**
 * Script per applicare i patch ai file email.ejs in italiano e inglese
 * 
 * Questo script:
 * 1. Legge i file email_patch.ejs in italiano e inglese
 * 2. Sovrascrive i file email.ejs con il contenuto dei file email_patch.ejs
 * 3. Crea un backup dei file email.ejs originali
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file
const itEmailPath = path.join(__dirname, 'views', 'it', 'email.ejs');
const itEmailPatchPath = path.join(__dirname, 'views', 'it', 'email_patch.ejs');
const itEmailBackupPath = path.join(__dirname, 'views', 'it', 'email.ejs.bak');

const enEmailPath = path.join(__dirname, 'views', 'en', 'email.ejs');
const enEmailPatchPath = path.join(__dirname, 'views', 'en', 'email_patch.ejs');
const enEmailBackupPath = path.join(__dirname, 'views', 'en', 'email.ejs.bak');

console.log('Avvio applicazione patch ai file email.ejs...');

// Funzione per applicare il patch a un file
function applyPatch(emailPath, patchPath, backupPath) {
    // Verifica se il file email.ejs esiste
    if (!fs.existsSync(emailPath)) {
        console.error(`Il file ${emailPath} non esiste.`);
        return false;
    }
    
    // Verifica se il file email_patch.ejs esiste
    if (!fs.existsSync(patchPath)) {
        console.error(`Il file ${patchPath} non esiste.`);
        return false;
    }
    
    try {
        // Leggi il contenuto del file email.ejs
        const emailContent = fs.readFileSync(emailPath, 'utf8');
        
        // Crea un backup del file email.ejs
        fs.writeFileSync(backupPath, emailContent, 'utf8');
        console.log(`Backup del file ${emailPath} creato con successo in ${backupPath}`);
        
        // Leggi il contenuto del file email_patch.ejs
        const patchContent = fs.readFileSync(patchPath, 'utf8');
        
        // Sovrascrivi il file email.ejs con il contenuto del file email_patch.ejs
        fs.writeFileSync(emailPath, patchContent, 'utf8');
        console.log(`Patch applicato con successo al file ${emailPath}`);
        
        return true;
    } catch (error) {
        console.error(`Errore nell'applicazione del patch al file ${emailPath}:`, error.message);
        return false;
    }
}

// Applica il patch al file email.ejs in italiano
const itResult = applyPatch(itEmailPath, itEmailPatchPath, itEmailBackupPath);
if (itResult) {
    console.log('Patch applicato con successo al file email.ejs in italiano');
} else {
    console.error('Errore nell\'applicazione del patch al file email.ejs in italiano');
}

// Applica il patch al file email.ejs in inglese
const enResult = applyPatch(enEmailPath, enEmailPatchPath, enEmailBackupPath);
if (enResult) {
    console.log('Patch applicato con successo al file email.ejs in inglese');
} else {
    console.error('Errore nell\'applicazione del patch al file email.ejs in inglese');
}

if (itResult && enResult) {
    console.log('\nTutti i patch sono stati applicati con successo!');
    console.log('\nPer ripristinare i file originali, eseguire:');
    console.log(`cp ${itEmailBackupPath} ${itEmailPath}`);
    console.log(`cp ${enEmailBackupPath} ${enEmailPath}`);
} else {
    console.error('\nSi sono verificati errori nell\'applicazione dei patch.');
}