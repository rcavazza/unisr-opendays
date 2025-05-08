/**
 * Script per duplicare le righe nella tabella experiences con titolo "Visita al SimLab con attività pratica"
 * e tradurre i campi in inglese
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso al database SQLite (aggiorna con il percorso corretto)
const dbPath = path.join(__dirname, 'fcfs.sqlite');

// Traduzioni specifiche
const translations = {
  title: {
    it: "Visita al SimLab con attività pratica",
    en: "Visit to SimLab with practical activity"
  },
  course: {
    it: "Medicina e Chirurgia, International Medical Doctor Program",
    en: "Medicine and Surgery, International Medical Doctor Program"
  }
  // Il campo desc è vuoto, quindi non serve traduzione
};

// Apri la connessione al database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err.message);
    return;
  }
  console.log('Connessione al database SQLite stabilita.');
  
  // Trova tutte le righe con titolo "Visita al SimLab con attività pratica"
  db.all(
    "SELECT * FROM experiences WHERE title = ?",
    [translations.title.it],
    (err, rows) => {
      if (err) {
        console.error('Errore nella query:', err.message);
        closeDb();
        return;
      }
      
      console.log(`Trovate ${rows.length} righe da duplicare.`);
      
      if (rows.length === 0) {
        console.log('Nessuna riga trovata con il titolo specificato.');
        closeDb();
        return;
      }
      
      // Verifica se esistono già righe con il titolo in inglese
      db.all(
        "SELECT * FROM experiences WHERE title = ? AND language = 'en'",
        [translations.title.en],
        (err, existingRows) => {
          if (err) {
            console.error('Errore nella verifica di righe esistenti:', err.message);
            closeDb();
            return;
          }
          
          if (existingRows.length > 0) {
            console.log(`Attenzione: Esistono già ${existingRows.length} righe con il titolo in inglese.`);
            console.log('Vuoi procedere comunque? (Premi Ctrl+C per annullare)');
            // Pausa di 5 secondi per dare tempo all'utente di annullare
            setTimeout(() => {
              processDuplication(rows);
            }, 5000);
          } else {
            processDuplication(rows);
          }
        }
      );
    }
  );
});

// Funzione per processare la duplicazione delle righe
function processDuplication(rows) {
  let processed = 0;
  
  rows.forEach(row => {
    // Crea una copia dei dati
    const newRow = {...row};
    
    // Rimuovi l'ID per permettere l'auto-incremento
    delete newRow.id;
    
    // Cambia la lingua in inglese
    newRow.language = 'en';
    
    // Traduci i campi richiesti
    newRow.title = translations.title.en;
    newRow.course = translations.course.en;
    // Il campo desc rimane invariato poiché è vuoto
    
    // Prepara i campi e i valori per l'inserimento
    const fields = Object.keys(newRow);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => newRow[field]);
    
    // Inserisci la nuova riga
    db.run(
      `INSERT INTO experiences (${fields.join(', ')}) VALUES (${placeholders})`,
      values,
      function(err) {
        if (err) {
          console.error('Errore nell\'inserimento della riga:', err.message);
        } else {
          console.log(`Riga duplicata con successo. Nuovo ID: ${this.lastID}`);
          console.log(`Titolo originale: "${row.title}" (${row.language})`);
          console.log(`Titolo tradotto: "${newRow.title}" (${newRow.language})`);
          console.log(`Corso originale: "${row.course}"`);
          console.log(`Corso tradotto: "${newRow.course}"`);
          console.log('---');
        }
        
        processed++;
        
        // Chiudi il database quando tutte le righe sono state processate
        if (processed === rows.length) {
          closeDb();
        }
      }
    );
  });
}

// Funzione per chiudere la connessione al database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Errore nella chiusura del database:', err.message);
    } else {
      console.log('Connessione al database chiusa.');
    }
  });
}