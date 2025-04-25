# Analisi del Problema con i Timeslots nella Risposta API `/get_experiences`

## Problema Identificato

Dall'analisi del codice e dei log, ho identificato che i timeslots sono vuoti nella risposta API `/get_experiences` perché i campi `ora_inizio` e `ora_fine` nel database sono stringhe vuote.

### Evidenze dai Log

```
[2025-04-24T14:58:05.296Z] INFO: First row: {"experience_id":"imdp-e-medicina-chirurgia-mani-2","title":"Manichino con ascolto e visione del timpano","course":"IMDP e Medicina Chirurgia","location":"SimLab2","desc":"","max_participants":20,"current_participants":0,"duration":"1 ore","ora_inizio":"","ora_fine":""}
[2025-04-24T14:58:05.296Z] INFO: ora_inizio: , type: string
[2025-04-24T14:58:05.296Z] INFO: ora_fine: , type: string
```

### Esempio di Risposta API con Timeslots Vuoti

```json
[
  {
    "id": "imdp-e-medicina-chirurgia-mani-2",
    "title": "Manichino con ascolto e visione del timpano",
    "course": "IMDP e Medicina Chirurgia",
    "location": "SimLab2",
    "duration": "1 ore",
    "desc": "",
    "timeSlots": []
  },
  {
    "id": "odontoiatria-visita-guidata-ai-26",
    "title": "Visita guidata ai Laboratori di Simulazione e ai Reparti della Dental Clinic San Raffaele",
    "course": "Odontoiatria",
    "location": "Dental School",
    "duration": "30 minuti",
    "desc": "",
    "timeSlots": []
  }
]
```

## Causa del Problema

Nel file `courseExperienceService.js`, la funzione `getExperiencesByCustomObjectIds` contiene questa logica per la gestione dei timeslots:

```javascript
// Linee 375-398 in courseExperienceService.js
if (row.ora_inizio && row.ora_inizio.trim() !== '') {
    logger.info(`Adding time slot for ${row.experience_id} with ora_inizio: ${row.ora_inizio}`);
    experience.timeSlots.push({
        id: `${row.experience_id}-${experience.timeSlots.length + 1}`,
        time: formatTime(row.ora_inizio),
        available: Math.max(0, row.max_participants - row.current_participants)
    });
} else {
    // Add default time slots if ora_inizio is empty
    logger.info(`Adding default time slots for ${row.experience_id}`);
    const defaultTimeSlots = [
        { time: '09:00', offset: 0 },
        { time: '11:00', offset: 2 },
        { time: '14:00', offset: 1 }
    ];
    
    defaultTimeSlots.forEach((slot, index) => {
        experience.timeSlots.push({
            id: `${row.experience_id}-${index + 1}`,
            time: formatTime(slot.time),
            available: Math.max(0, row.max_participants - row.current_participants - slot.offset)
        });
    });
}
```

La condizione `if (row.ora_inizio && row.ora_inizio.trim() !== '')` valuta a falso perché `ora_inizio` è una stringa vuota. Tuttavia, il codice nell'`else` che dovrebbe aggiungere i timeslots predefiniti non sembra funzionare correttamente, poiché i timeslots rimangono vuoti nella risposta API.

## Soluzioni Proposte

### 1. Verifica dei Dati nel Database

Per prima cosa, è necessario verificare lo stato attuale dei dati nel database. Ecco uno script che può essere utilizzato per questo scopo:

```javascript
#!/usr/bin/env node

/**
 * Script per verificare i valori dei campi ora_inizio e ora_fine nella tabella experiences
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Verifica dei campi ora_inizio e ora_fine nella tabella experiences...');

const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err.message);
    process.exit(1);
  }
  console.log('Connesso al database');
});

db.all(
  `SELECT id, experience_id, title, ora_inizio, ora_fine
   FROM experiences
   ORDER BY id`,
  (err, rows) => {
    if (err) {
      console.error('Errore nella query:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Trovate ${rows.length} esperienze nel database`);
    
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Experience ID: ${row.experience_id}, Title: ${row.title}`);
      console.log(`  ora_inizio: "${row.ora_inizio}", tipo: ${typeof row.ora_inizio}, lunghezza: ${row.ora_inizio ? row.ora_inizio.length : 0}`);
      console.log(`  ora_fine: "${row.ora_fine}", tipo: ${typeof row.ora_fine}, lunghezza: ${row.ora_fine ? row.ora_fine.length : 0}`);
      console.log('---');
    });
    
    closeDb();
  }
);

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Errore nella chiusura del database:', err.message);
    } else {
      console.log('Connessione al database chiusa');
    }
  });
}
```

### 2. Correzione del Codice in courseExperienceService.js

Ci sono due possibili correzioni:

#### Opzione A: Correggere la Logica dei Timeslots Predefiniti

Se i campi `ora_inizio` e `ora_fine` sono effettivamente vuoti e vogliamo che vengano utilizzati i timeslots predefiniti, dobbiamo verificare perché i timeslots predefiniti non vengono aggiunti correttamente.

```javascript
// Modifica in courseExperienceService.js
if (row.ora_inizio && row.ora_inizio.trim() !== '') {
    // Codice esistente per aggiungere timeslot basati su ora_inizio
} else {
    // Aggiungi log per debug
    logger.info(`Adding default time slots for ${row.experience_id} - max_participants: ${row.max_participants}, current_participants: ${row.current_participants}`);
    
    // Assicurati che i timeslots predefiniti vengano aggiunti correttamente
    const defaultTimeSlots = [
        { time: '09:00', offset: 0 },
        { time: '11:00', offset: 2 },
        { time: '14:00', offset: 1 }
    ];
    
    defaultTimeSlots.forEach((slot, index) => {
        const available = Math.max(0, row.max_participants - row.current_participants - slot.offset);
        logger.info(`Adding default slot ${index + 1}: time=${slot.time}, available=${available}`);
        
        experience.timeSlots.push({
            id: `${row.experience_id}-${index + 1}`,
            time: formatTime(slot.time),
            available: available
        });
    });
    
    // Verifica che i timeslots siano stati aggiunti
    logger.info(`After adding default slots, timeSlots length: ${experience.timeSlots.length}`);
}
```

#### Opzione B: Popolare i Campi ora_inizio e ora_fine nel Database

Se i campi `ora_inizio` e `ora_fine` dovrebbero contenere valori, possiamo utilizzare l'interfaccia di gestione esperienze (manage_experiences.js) per inserire manualmente i valori o creare uno script per popolare automaticamente questi campi:

```javascript
#!/usr/bin/env node

/**
 * Script per popolare i campi ora_inizio e ora_fine nella tabella experiences
 */

const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

console.log('Popolamento dei campi ora_inizio e ora_fine nella tabella experiences...');

const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err.message);
    process.exit(1);
  }
  console.log('Connesso al database');
});

// Ottieni tutte le esperienze
db.all(
  `SELECT id, experience_id, title, duration
   FROM experiences
   WHERE ora_inizio = '' OR ora_inizio IS NULL`,
  (err, rows) => {
    if (err) {
      console.error('Errore nella query:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Trovate ${rows.length} esperienze da aggiornare`);
    
    // Default start times for different experiences
    const defaultStartTimes = ['09:00', '11:00', '14:00', '16:00'];
    
    // Update each experience with default time values
    let updateCount = 0;
    rows.forEach((row, index) => {
      // Assign a default start time based on the index (cycling through the options)
      const startTime = defaultStartTimes[index % defaultStartTimes.length];
      
      // Calculate end time based on duration if available
      let endTime = '10:00'; // Default end time
      
      if (row.duration) {
        // Try to extract duration in minutes
        const durationMatch = row.duration.match(/(\d+)\s*min/i);
        if (durationMatch) {
          const durationMinutes = parseInt(durationMatch[1]);
          
          // Parse start time
          const [startHours, startMinutes] = startTime.split(':').map(Number);
          
          // Calculate end time
          let endHours = startHours;
          let endMinutes = startMinutes + durationMinutes;
          
          // Adjust for hour overflow
          if (endMinutes >= 60) {
            endHours += Math.floor(endMinutes / 60);
            endMinutes = endMinutes % 60;
          }
          
          // Format end time
          endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        }
      }
      
      db.run(
        "UPDATE experiences SET ora_inizio = ?, ora_fine = ? WHERE id = ?", 
        [startTime, endTime, row.id], 
        (err) => {
          if (err) {
            console.error(`Errore nell'aggiornamento dei valori di tempo per l'esperienza ${row.id}:`, err.message);
          } else {
            updateCount++;
            console.log(`Aggiornati i valori di tempo per l'esperienza ${row.id}: ${startTime} - ${endTime}`);
            
            if (updateCount === rows.length) {
              console.log('Tutte le esperienze aggiornate con i valori di tempo');
              closeDb();
            }
          }
        }
      );
    });
    
    if (rows.length === 0) {
      console.log('Nessuna esperienza da aggiornare');
      closeDb();
    }
  }
);

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Errore nella chiusura del database:', err.message);
    } else {
      console.log('Connessione al database chiusa');
    }
  });
}
```

## Raccomandazione

1. Eseguire lo script di verifica per controllare lo stato attuale dei campi `ora_inizio` e `ora_fine` nel database.
2. Se i campi sono effettivamente vuoti, utilizzare l'opzione B per popolare i campi con valori predefiniti.
3. Se i campi sono già popolati ma i timeslots sono comunque vuoti, utilizzare l'opzione A per correggere la logica nel codice.
4. Testare la soluzione chiamando l'endpoint `/api/get_experiences` e verificando che i timeslots vengano visualizzati correttamente.

## Prossimi Passi

1. Implementare la soluzione scelta
2. Testare la soluzione
3. Monitorare i log per assicurarsi che i timeslots vengano generati correttamente
4. Considerare l'aggiunta di test automatici per prevenire problemi simili in futuro