/**
 * Script per eseguire la migrazione dei dati nella tabella opend_reservations
 * Questo script esegue il file migrate_opend_reservations.js
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('Avvio della migrazione dei dati nella tabella opend_reservations...');

// Esegui lo script di migrazione
const migrationProcess = spawn('node', [path.join(__dirname, 'migrate_opend_reservations.js')], {
  stdio: 'inherit' // Mostra l'output nel terminale corrente
});

migrationProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Migrazione completata con successo!');
  } else {
    console.error(`Errore durante la migrazione. Codice di uscita: ${code}`);
  }
});