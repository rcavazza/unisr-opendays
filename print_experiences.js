/**
 * Script per stampare i dati contenuti nella tabella experiences del database
 *
 * Utilizzo:
 * - Esecuzione senza parametri: stampa tutti i campi
 *   node print_experiences.js
 *
 * - Esecuzione con parametri: stampa solo i campi specificati
 *   node print_experiences.js id experience_id title course location
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Definizione di tutti i campi disponibili nella tabella experiences
const ALL_FIELDS = [
  'title',
  'course',
  'location',
  'date',
  // 'duration',
  // 'desc',
  // 'language',
  // 'course_type',
  'max_participants',
  'current_participants',
  'ora_inizio',
  'ora_fine'
];
// const ALL_FIELDS = [
//   'id',
//   'experience_id',
//   'title',
//   'course',
//   'location',
//   'date',
//   'duration',
//   'desc',
//   'language',
//   'course_type',
//   'max_participants',
//   'current_participants',
//   'ora_inizio',
//   'ora_fine'
// ];

// Ottieni i campi da stampare dagli argomenti della riga di comando
const fieldsToShow = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ALL_FIELDS;

// Mostra i campi che verranno stampati
console.log("Campi selezionati per la stampa:", fieldsToShow.join(", "));

// Connessione al database
const db = new sqlite3.Database("fcfs.sqlite", (err) => {
  if (err) {
    console.error(`Errore nella connessione al database: ${err.message}`);
    process.exit(1);
  }
  console.log("Connessione al database stabilita con successo");
});

// Funzione per stampare i dati delle esperienze
async function printExperiences(fields) {
  return new Promise((resolve, reject) => {
    // Costruisci la query per selezionare solo i campi specificati
    const selectFields = fields.join(', ');
    const query = `SELECT ${selectFields} FROM experiences ORDER BY id`;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`Errore nell'esecuzione della query: ${err.message}`);
        reject(err);
        return;
      }
      
      if (rows.length === 0) {
        console.log("Nessuna esperienza trovata nel database");
        resolve();
        return;
      }
      
      console.log("\n=== ELENCO DELLE ESPERIENZE ===\n");
      
      // Calcola la larghezza massima per ogni colonna
      const columnWidths = fields.map(field => {
        // Inizia con la lunghezza del nome del campo
        let maxWidth = field.length;
        
        // Controlla la lunghezza di ogni valore in questa colonna
        rows.forEach(row => {
          const value = row[field];
          const valueStr = value === null || value === undefined ? "NULL" : String(value);
          const displayLength = valueStr.length > 30 ? 30 : valueStr.length;
          maxWidth = Math.max(maxWidth, displayLength);
        });
        
        // Aggiungi un po' di padding
        return maxWidth + 2;
      });
      
      // Funzione per creare una riga formattata
      const formatRow = (values) => {
        return values.map((value, index) => {
          const width = columnWidths[index];
          const valueStr = String(value);
          return valueStr.padEnd(width);
        }).join(" | ");
      };
      
      // Stampa intestazione con i nomi dei campi
      console.log(formatRow(fields));
      
      // Stampa una linea separatrice
      const separator = fields.map((field, index) => {
        return "-".repeat(columnWidths[index]);
      }).join("-+-");
      console.log(separator);
      
      // Stampa i dati di ogni esperienza
      rows.forEach(experience => {
        const values = fields.map(field => {
          // Formatta il valore per la visualizzazione
          const value = experience[field];
          if (value === null || value === undefined) return "NULL";
          if (typeof value === "string" && value.length > 30) {
            return value.substring(0, 27) + "...";
          }
          return value;
        });
        
        console.log(formatRow(values));
      });
      
      console.log(`\nTotale esperienze: ${rows.length}`);
      resolve();
    });
  });
}

// Funzione principale
async function main() {
  try {
    // Verifica che i campi specificati siano validi
    const invalidFields = fieldsToShow.filter(field => !ALL_FIELDS.includes(field));
    if (invalidFields.length > 0) {
      console.error(`Campi non validi: ${invalidFields.join(', ')}`);
      console.log(`Campi disponibili: ${ALL_FIELDS.join(', ')}`);
      process.exit(1);
    }
    
    await printExperiences(fieldsToShow);
  } catch (error) {
    console.error(`Si è verificato un errore: ${error.message}`);
  } finally {
    // Chiudi la connessione al database
    db.close((err) => {
      if (err) {
        console.error(`Errore nella chiusura del database: ${err.message}`);
      } else {
        console.log("Connessione al database chiusa");
      }
    });
  }
}

// Esegui la funzione principale
main();