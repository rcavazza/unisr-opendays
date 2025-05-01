/**
 * Script per azzerare il campo current_participants nella tabella experiences
 * Questo script reimposta il conteggio dei partecipanti attuali a zero per tutte le esperienze
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Percorso del database
const dbPath = path.join(__dirname, 'fcfs.sqlite');

// Verifica che il file del database esista
if (!fs.existsSync(dbPath)) {
  console.error(`Errore: Il file del database non esiste al percorso: ${dbPath}`);
  process.exit(1);
}

// Connessione al database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Errore nella connessione al database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connesso al database SQLite.');
});

// Funzione per azzerare il campo current_participants
function resetCurrentParticipants() {
  return new Promise((resolve, reject) => {
    // Esegui l'aggiornamento
    db.run(
      'UPDATE experiences SET current_participants = 0',
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Ottieni il numero di righe aggiornate
        console.log(`Aggiornate ${this.changes} esperienze: current_participants impostato a 0`);
        resolve(this.changes);
      }
    );
  });
}

// Funzione per eliminare tutte le prenotazioni dalla tabella opend_reservations
function clearOpenDayReservations() {
  return new Promise((resolve, reject) => {
    // Esegui l'eliminazione
    db.run(
      'DELETE FROM opend_reservations',
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Ottieni il numero di righe eliminate
        console.log(`Eliminate ${this.changes} prenotazioni dalla tabella opend_reservations`);
        resolve(this.changes);
      }
    );
  });
}

// Funzione per visualizzare le esperienze dopo l'aggiornamento
function listExperiences() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT experience_id, max_participants, current_participants FROM experiences',
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('\nElenco delle esperienze dopo l\'aggiornamento:');
        console.log('--------------------------------------------------');
        console.log('ID Esperienza | Max Partecipanti | Partecipanti Attuali');
        console.log('--------------------------------------------------');
        
        rows.forEach(row => {
          console.log(`${row.experience_id.padEnd(20)} | ${String(row.max_participants).padEnd(16)} | ${row.current_participants}`);
        });
        
        resolve(rows);
      }
    );
  });
}

// Funzione per verificare che la tabella opend_reservations sia vuota
function verifyEmptyReservations() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM opend_reservations',
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`\nNumero di prenotazioni rimanenti nella tabella opend_reservations: ${row.count}`);
        resolve(row.count);
      }
    );
  });
}

// Esegui le operazioni in sequenza
async function main() {
  try {
    // Azzeramento dei partecipanti attuali
    await resetCurrentParticipants();
    
    // Eliminazione di tutte le prenotazioni
    await clearOpenDayReservations();
    
    // Visualizza le esperienze aggiornate
    await listExperiences();
    
    // Verifica che la tabella opend_reservations sia vuota
    await verifyEmptyReservations();
    
    // Chiudi la connessione al database
    db.close((err) => {
      if (err) {
        console.error(`Errore nella chiusura del database: ${err.message}`);
      } else {
        console.log('\nConnessione al database chiusa.');
      }
    });
    
    console.log('\nOperazione completata con successo!');
    console.log('Tutti i conteggi dei partecipanti attuali sono stati azzerati.');
    console.log('Tutte le prenotazioni sono state eliminate dalla tabella opend_reservations.');
    console.log('I posti disponibili per ogni esperienza sono ora uguali al valore di max_participants.');
    
  } catch (error) {
    console.error(`Si è verificato un errore: ${error.message}`);
    db.close();
    process.exit(1);
  }
}

// Avvia lo script
main();