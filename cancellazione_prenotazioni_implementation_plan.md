# Piano di Implementazione: Correzione Visualizzazione Slot Prenotati OpenDays

## Problema Identificato

Il problema non è nella cancellazione delle prenotazioni, ma nella visualizzazione degli slot prenotati precedentemente. Quando un utente torna sulla pagina di selezione degli slot, non vengono visualizzati correttamente gli slot che aveva prenotato in precedenza.

Dopo un'analisi approfondita del codice, ho identificato che il problema è nel modo in cui vengono identificati gli slot prenotati nella funzione `getExperiencesByCustomObjectIds` in `courseExperienceService.js`.

## Causa del Problema

1. **Quando un utente prenota uno slot** (endpoint `/api/reserve`):
   - Viene utilizzato il `dbId` (ID numerico dalla tabella `experiences`) per identificare lo slot
   - Questo è l'approccio corretto perché il `dbId` è l'identificatore univoco della riga nella tabella `experiences`

2. **Quando l'utente torna sulla pagina** (funzione `getExperiencesByCustomObjectIds`):
   - La funzione recupera le prenotazioni esistenti e cerca di identificare quali slot sono stati prenotati
   - Secondo la migrazione documentata in README_opend_reservations_migration.md, il campo `experience_id` nella tabella `opend_reservations` ora contiene il `dbId` numerico
   - Tuttavia, la funzione non utilizza direttamente questo valore per identificare gli slot prenotati
   - Invece, crea una chiave nel formato `${baseExperienceId}_${timeSlotId}` e verifica se questa chiave esiste nella mappa delle prenotazioni dell'utente
   - Inoltre, la funzione riassegna gli ID degli slot dopo averli ordinati, il che potrebbe causare ulteriori problemi di identificazione

## Soluzione Proposta

Modificare la funzione `getExperiencesByCustomObjectIds` in `courseExperienceService.js` per utilizzare il valore di `experience_id` (che ora contiene il `dbId`) come identificatore principale per gli slot prenotati, invece di basarsi su chiavi generate.

### Modifiche Specifiche

1. **Modifica nella creazione della mappa delle prenotazioni dell'utente**:
   ```javascript
   // Creare una mappa per le prenotazioni basata sul dbId (che ora è in experience_id)
   const reservationMapByDbId = {};
   userReservations.forEach(reservation => {
       // Il campo experience_id ora contiene il dbId numerico
       reservationMapByDbId[reservation.experience_id] = true;
       logger.info(`User has reservation for dbId: ${reservation.experience_id}`);
   });
   ```

2. **Modifica nella verifica degli slot prenotati**:
   ```javascript
   // Verificare se lo slot è prenotato utilizzando il dbId
   const isSelected = reservationMapByDbId[row.id] || false;
   
   if (isSelected) {
       logger.info(`Marking slot with dbId ${row.id} as selected`);
   }
   ```

3. **Rimuovere la riassegnazione degli ID degli slot** dopo l'ordinamento, o assicurarsi che il `dbId` originale venga preservato e utilizzato per la verifica delle prenotazioni.

## Vantaggi della Soluzione

1. **Coerenza**: Utilizzo dello stesso identificatore (dbId) sia per la prenotazione che per la visualizzazione
2. **Robustezza**: Eliminazione della dipendenza da chiavi generate che potrebbero non corrispondere tra prenotazione e visualizzazione
3. **Semplicità**: Approccio più diretto e meno soggetto a errori

## Implementazione

1. Modificare la funzione `getExperiencesByCustomObjectIds` in `courseExperienceService.js` come descritto sopra
2. Aggiungere log dettagliati per verificare che gli slot prenotati vengano correttamente identificati
3. Testare la funzionalità con un caso d'uso completo:
   - Prenotare uno slot
   - Tornare alla pagina di selezione
   - Verificare che lo slot prenotato sia correttamente visualizzato come selezionato
   - Prenotare un altro slot
   - Verificare che entrambi gli slot siano correttamente visualizzati come selezionati