/**
 * Script per sincronizzare il campo current_participants con le prenotazioni effettive
 * Questo script corregge eventuali discrepanze tra le prenotazioni nella tabella opend_reservations
 * e i conteggi nella tabella experiences
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Percorso del database
const DB_PATH = 'fcfs.sqlite';

// Verifica che il file del database esista
if (!fs.existsSync(DB_PATH)) {
  console.error(`Errore: Il file del database non esiste al percorso: ${DB_PATH}`);
  process.exit(1);
}

// Connessione al database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(`Errore nella connessione al database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connesso al database SQLite.');
});

/**
 * Script per sincronizzare il campo current_participants con le prenotazioni effettive
 */
async function syncCurrentParticipants() {
  try {
    console.log('Inizio sincronizzazione current_participants');
    
    // 1. Ottieni la mappatura tra experience_id e id
    const experienceMap = await new Promise((resolve, reject) => {
      db.all(
        "SELECT id, experience_id FROM experiences",
        (err, rows) => {
          if (err) {
            console.error(`Errore nel recupero delle esperienze: ${err.message}`);
            reject(err);
          } else {
            // Crea una mappa da experience_id a id
            const map = {};
            rows.forEach(row => {
              map[row.experience_id] = row.id;
            });
            console.log(`Recuperate ${rows.length} esperienze`);
            resolve(map);
          }
        }
      );
    });
    
    // 2. Azzera tutti i contatori
    await new Promise((resolve, reject) => {
      db.run("UPDATE experiences SET current_participants = 0", (err) => {
        if (err) {
          console.error(`Errore nell'azzeramento dei contatori: ${err.message}`);
          reject(err);
        } else {
          console.log('Tutti i contatori azzerati');
          resolve();
        }
      });
    });
    
    // 3. Ottieni tutte le prenotazioni raggruppate per experience_id
    const reservationCounts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT experience_id, COUNT(*) as count 
         FROM opend_reservations 
         GROUP BY experience_id`,
        (err, rows) => {
          if (err) {
            console.error(`Errore nel recupero delle prenotazioni: ${err.message}`);
            reject(err);
          } else {
            console.log(`Recuperate prenotazioni per ${rows.length} esperienze`);
            resolve(rows);
          }
        }
      );
    });
    
    // 4. Aggiorna i contatori in base alle prenotazioni effettive
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const row of reservationCounts) {
      const slotId = experienceMap[row.experience_id];
      if (slotId) {
        try {
          await new Promise((resolve, reject) => {
            db.run(
              "UPDATE experiences SET current_participants = ? WHERE id = ?",
              [row.count, slotId],
              function(err) {
                if (err) {
                  console.error(`Errore nell'aggiornamento del contatore per slot ID ${slotId}: ${err.message}`);
                  reject(err);
                } else {
                  console.log(`Aggiornato contatore per slot ID ${slotId} (experience_id: ${row.experience_id}): ${row.count} partecipanti`);
                  resolve();
                }
              }
            );
          });
          updatedCount++;
        } catch (error) {
          errorCount++;
          console.error(`Errore nell'aggiornamento del contatore per slot ID ${slotId}: ${error.message}`);
        }
      } else {
        console.warn(`Nessuno slot trovato per experience_id: ${row.experience_id}`);
        errorCount++;
      }
    }
    
    // 5. Verifica che nessun slot superi il max_participants
    const overbooked = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, experience_id, current_participants, max_participants 
         FROM experiences 
         WHERE current_participants > max_participants`,
        (err, rows) => {
          if (err) {
            console.error(`Errore nella verifica degli slot sovraprenotati: ${err.message}`);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
    
    if (overbooked.length > 0) {
      console.warn(`Trovati ${overbooked.length} slot con prenotazioni eccessive:`);
      for (const slot of overbooked) {
        console.warn(`Slot ID ${slot.id} (experience_id: ${slot.experience_id}): current=${slot.current_participants}, max=${slot.max_participants}`);
      }
    } else {
      console.log('Nessuno slot sovraprenotato trovato');
    }
    
    console.log('\nRiepilogo sincronizzazione:');
    console.log(`- Slot aggiornati: ${updatedCount}`);
    console.log(`- Errori: ${errorCount}`);
    console.log(`- Slot sovraprenotati: ${overbooked.length}`);
    
    console.log('\nSincronizzazione current_participants completata');
    return true;
  } catch (error) {
    console.error(`Errore in syncCurrentParticipants: ${error.message}`);
    throw error;
  } finally {
    // Chiudi la connessione al database
    db.close((err) => {
      if (err) {
        console.error(`Errore nella chiusura del database: ${err.message}`);
      } else {
        console.log('\nConnessione al database chiusa.');
      }
    });
  }
}

// Esegui la sincronizzazione
syncCurrentParticipants()
  .then(() => {
    console.log('Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Errore nell'esecuzione dello script: ${error.message}`);
    process.exit(1);
  });