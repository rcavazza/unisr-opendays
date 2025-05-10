const sqlite3 = require('sqlite3').verbose();

// Connection statistics counters
let connectionAttempts = 0;
let successfulConnections = 0;
let successfulClosures = 0;

/**
 * Main function to update time_slot_id in opend_reservations table
 * This function will be called every 2 minutes
 */
function updateTimeSlotId() {
  connectionAttempts++;
  // Display timestamp at the beginning of each execution cycle
  console.log(`\n[${new Date().toISOString()}] Starting update cycle #${connectionAttempts}`);

  // Open the database connection
  const db = new sqlite3.Database('fcfs.sqlite', (err) => {
    if (err) {
      console.error(`Errore nell'apertura del database: ${err.message}`);
      return; // Skip this cycle if we can't open the database
    }
    successfulConnections++;
    console.log(`Connesso al database (${successfulConnections}/${connectionAttempts} connessioni riuscite)`);

    // Configure database
    db.configure('busyTimeout', 6000); // aspetta fino a 6 secondi prima di fallire

    // Enable foreign keys and begin a transaction
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run('BEGIN TRANSACTION');

      // Get all records from experiences table to create a mapping
      db.all('SELECT id, experience_id FROM experiences', (err, experiences) => {
        if (err) {
          console.error(`Errore nel recupero delle esperienze: ${err.message}`);
          db.run('ROLLBACK');
          db.close(() => {
            successfulClosures++;
            console.log(`Connessione al database chiusa (${successfulClosures}/${successfulConnections} chiusure riuscite)`);
          });
          return;
        }

        // Create a mapping between id and experience_id
        const experienceMap = {};
        experiences.forEach(exp => {
          experienceMap[exp.id] = exp.experience_id;
        });

        console.log(`Trovate ${experiences.length} esperienze`);
        console.log('Mappatura creata:', experienceMap);

        // Get all records from opend_reservations table
        db.all('SELECT id, experience_id, time_slot_id FROM opend_reservations', (err, reservations) => {
          if (err) {
            console.error(`Errore nel recupero delle prenotazioni: ${err.message}`);
            db.run('ROLLBACK');
            db.close(() => {
              successfulClosures++;
              console.log(`Connessione al database chiusa (${successfulClosures}/${successfulConnections} chiusure riuscite)`);
            });
            return;
          }

          console.log(`Trovate ${reservations.length} prenotazioni`);

          // Prepare statement for update
          const updateStmt = db.prepare('UPDATE opend_reservations SET time_slot_id = ? WHERE id = ?');
          
          let updatedCount = 0;
          let errorCount = 0;
          let skippedCount = 0;

          // Function to process reservations sequentially
          function processReservation(index) {
            if (index >= reservations.length) {
              // All updates completed
              updateStmt.finalize();
              
              // Commit transaction if no errors
              if (errorCount === 0) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error(`Errore nel commit della transazione: ${err.message}`);
                    db.run('ROLLBACK');
                  } else {
                    console.log('\nRiepilogo:');
                    console.log(`- Prenotazioni totali: ${reservations.length}`);
                    console.log(`- Prenotazioni aggiornate: ${updatedCount}`);
                    console.log(`- Prenotazioni saltate: ${skippedCount}`);
                    console.log(`- Errori: ${errorCount}`);
                  }
                  // Close the database connection at the end of each cycle
                  db.close(() => {
                    successfulClosures++;
                    console.log(`Connessione al database chiusa (${successfulClosures}/${successfulConnections} chiusure riuscite)`);
                  });
                });
              } else {
                db.run('ROLLBACK');
                db.close(() => {
                  successfulClosures++;
                  console.log(`Connessione al database chiusa (${successfulClosures}/${successfulConnections} chiusure riuscite)`);
                });
              }
              return;
            }

            const reservation = reservations[index];
            const experienceId = reservation.experience_id;
            const newTimeSlotId = experienceMap[experienceId];

            if (!newTimeSlotId) {
              console.log(`Nessun experience_id trovato per la prenotazione ${reservation.id} con experience_id=${experienceId}`);
              skippedCount++;
              processReservation(index + 1);
              return;
            }

            // Update time_slot_id with corresponding experience_id
            updateStmt.run(newTimeSlotId, reservation.id, function(err) {
              if (err) {
                console.error(`Errore nell'aggiornamento della prenotazione ${reservation.id}: ${err.message}`);
                errorCount++;
              } else {
                if (this.changes > 0) {
                  updatedCount++;
                  console.log(`Prenotazione ${reservation.id}: time_slot_id cambiato da "${reservation.time_slot_id}" a "${newTimeSlotId}"`);
                } else {
                  skippedCount++;
                }
              }
              
              // Process next reservation
              processReservation(index + 1);
            });
          }

          // Start the update process
          processReservation(0);
        });
      });
    });
  });
}

// Run the update function immediately on script start
updateTimeSlotId();

// Set up interval to run the update function every 2 minutes
setInterval(updateTimeSlotId, 2 * 60 * 1000);

console.log('Script avviato. Verrà eseguito ogni 2 minuti.');