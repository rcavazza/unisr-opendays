const sqlite3 = require('sqlite3').verbose();

// Apri il database
const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error(`Errore nell'apertura del database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connesso al database');
});

// Abilita le foreign keys e inizia una transazione
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('BEGIN TRANSACTION');

  // Ottieni tutti i record dalla tabella experiences per creare una mappatura
  db.all('SELECT id, experience_id FROM experiences', (err, experiences) => {
    if (err) {
      console.error(`Errore nel recupero delle esperienze: ${err.message}`);
      db.run('ROLLBACK');
      db.close();
      process.exit(1);
    }

    // Crea una mappatura tra id e experience_id
    const experienceMap = {};
    experiences.forEach(exp => {
      experienceMap[exp.id] = exp.experience_id;
    });

    console.log(`Trovate ${experiences.length} esperienze`);
    console.log('Mappatura creata:', experienceMap);

    // Ottieni tutti i record dalla tabella opend_reservations
    db.all('SELECT id, experience_id, time_slot_id FROM opend_reservations', (err, reservations) => {
      if (err) {
        console.error(`Errore nel recupero delle prenotazioni: ${err.message}`);
        db.run('ROLLBACK');
        db.close();
        process.exit(1);
      }

      console.log(`Trovate ${reservations.length} prenotazioni`);

      // Prepara lo statement per l'aggiornamento
      const updateStmt = db.prepare('UPDATE opend_reservations SET time_slot_id = ? WHERE id = ?');
      
      let updatedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      // Funzione per eseguire gli aggiornamenti in modo sequenziale
      function processReservation(index) {
        if (index >= reservations.length) {
          // Tutti gli aggiornamenti sono stati completati
          updateStmt.finalize();
          
          // Commit della transazione se non ci sono errori
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
              db.close();
            });
          } else {
            db.run('ROLLBACK');
            db.close();
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

        // Aggiorna il time_slot_id con l'experience_id corrispondente
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
          
          // Procedi con la prossima prenotazione
          processReservation(index + 1);
        });
      }

      // Inizia il processo di aggiornamento
      processReservation(0);
    });
  });
});