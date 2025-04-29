# Analisi del Problema dei Key Formats nel Calcolo degli Slot

## Panoramica del Problema

Il sistema di calcolo degli slot disponibili presenta un problema critico legato all'inconsistenza nei formati delle chiavi (key formats) utilizzati per identificare e recuperare i conteggi delle prenotazioni. Questa inconsistenza causa una visualizzazione errata degli slot disponibili nel frontend, mostrando più slot disponibili di quanti ce ne siano realmente.

## Formati di Chiave Utilizzati

Nel sistema attuale, vengono utilizzati diversi formati di chiave:

1. **Formato Originale**: `${exp.experience_id}_${timeSlotId}`
   - Esempio: `imdp-e-medicina-chirurgia-mani-2_imdp-e-medicina-chirurgia-mani-2-1`
   - Questo formato utilizza l'ID completo dell'esperienza seguito dall'ID dello slot temporale

2. **Formato Frontend**: `${baseExperienceId}_${frontendTimeSlotId}`
   - Esempio: `imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-2-1`
   - Questo formato utilizza l'ID base dell'esperienza (senza il suffisso numerico) seguito dall'ID dello slot temporale

3. **Formato Database**: Uguale al formato frontend
   - Utilizzato nelle query al database per recuperare i conteggi delle prenotazioni

## Dove si Verifica il Problema

Il problema si manifesta principalmente nella funzione `getAllAvailableSlots` in `slotCalculationService.js`. Ecco il flusso che causa l'errore:

1. Il sistema recupera i conteggi delle prenotazioni dal database e li memorizza in un oggetto `reservationCounts` con chiavi nel formato originale:
   ```javascript
   const counts = {};
   rows.forEach(row => {
       const key = `${row.experience_id}_${row.time_slot_id}`;
       counts[key] = row.count;
   });
   ```

2. Quando calcola gli slot disponibili, cerca i conteggi delle prenotazioni usando solo il formato database/frontend:
   ```javascript
   // Database key format (used in the database)
   const dbKey = `${baseExperienceId}_${frontendTimeSlotId}`;
   
   // Get reservation count from the database key
   const reservationCount = reservationCounts[dbKey] || 0;
   ```

3. Se le prenotazioni sono state memorizzate con il formato originale, non verranno trovate quando si cerca con il formato database, risultando in un conteggio di prenotazioni errato (generalmente 0).

## Esempio Concreto

Per l'esperienza "imdp-e-medicina-chirurgia-mani-2":

1. Le prenotazioni potrebbero essere memorizzate con la chiave:
   `imdp-e-medicina-chirurgia-mani-2_imdp-e-medicina-chirurgia-mani-2-1`

2. Ma il sistema cerca le prenotazioni con la chiave:
   `imdp-e-medicina-chirurgia-mani_imdp-e-medicina-chirurgia-mani-2-1`

3. Non trovando corrispondenze, assume che ci siano 0 prenotazioni, mostrando quindi tutti gli slot come disponibili anche quando non lo sono.

## Impatto sul Frontend

Nel frontend, questo problema si manifesta in diversi modi:

1. Gli slot che dovrebbero essere completamente prenotati appaiono come disponibili
2. Il numero di posti disponibili mostrato è maggiore di quello reale
3. Gli utenti potrebbero tentare di prenotare slot che in realtà sono già pieni

Il componente `OpenDayRegistration.tsx` contiene codice per verificare e correggere queste discrepanze, ma si tratta di una soluzione temporanea che non risolve il problema alla radice.

## Soluzione Proposta

La soluzione consiste nel modificare la funzione `getAllAvailableSlots` in `slotCalculationService.js` per controllare entrambi i formati di chiave:

```javascript
// Try both key formats for reservation count
const originalKey = `${exp.experience_id}_${timeSlotId}`;
const dbKey = `${baseExperienceId}_${frontendTimeSlotId}`;

// Try the original key first, then fall back to the frontend key format
const reservationCount = reservationCounts[originalKey] || reservationCounts[dbKey] || 0;

// Log which key was used for debugging
if (reservationCounts[originalKey]) {
    logger.info(`Using original key for reservation count: ${originalKey} = ${reservationCounts[originalKey]}`);
} else if (reservationCounts[dbKey]) {
    logger.info(`Using db key for reservation count: ${dbKey} = ${reservationCounts[dbKey]}`);
} else {
    logger.info(`No reservation count found for keys: ${originalKey} or ${dbKey}`);
}
```

Questa modifica garantirà che il sistema controlli prima se esistono prenotazioni con il formato originale della chiave, e solo se non ne trova, controllerà il formato database/frontend. Questo assicurerà che vengano contate correttamente tutte le prenotazioni, indipendentemente dal formato della chiave utilizzato per memorizzarle.

## Raccomandazioni a Lungo Termine

Per evitare problemi simili in futuro, si raccomanda di:

1. **Standardizzare i Formati delle Chiavi**: Definire un unico formato di chiave da utilizzare in tutta l'applicazione
2. **Documentare Chiaramente**: Documentare il formato delle chiavi e come vengono utilizzate
3. **Aggiungere Test Automatizzati**: Creare test che verifichino il corretto funzionamento del calcolo degli slot con diversi formati di chiave
4. **Refactoring del Codice**: Considerare un refactoring più ampio per semplificare la gestione delle chiavi e dei conteggi delle prenotazioni

Implementando queste raccomandazioni, il sistema diventerà più robusto e meno soggetto a errori simili in futuro.