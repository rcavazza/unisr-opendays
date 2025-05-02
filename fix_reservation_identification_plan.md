# Piano di Implementazione: Correzione Identificazione Slot Prenotati

## Problema Identificato

Ho identificato un problema critico nel flusso di salvataggio e recupero delle prenotazioni:

1. Quando un utente prenota uno slot, viene salvato l'ID dell'esperienza (`experienceId`) nel campo `experience_id` della tabella `opend_reservations`.
2. Quando l'utente torna sulla pagina, per verificare se uno slot è prenotato, si confronta l'ID dello slot (`row.id`) con il valore salvato in `experience_id`.
3. Poiché questi sono due valori diversi, il sistema mostra come selezionato uno slot diverso da quello che l'utente aveva scelto originariamente.

## Soluzione Proposta

Modificare il codice per salvare il `dbId` (l'ID dello slot) nel campo `experience_id` della tabella `opend_reservations` invece dell'ID dell'esperienza.

## Modifiche Necessarie

### 1. Modifica in `server.js`

Modificare la riga 836 per utilizzare `slot.id` invece di `experienceId` quando si salva la prenotazione:

```javascript
// Prima:
await reservationService.saveReservation(db, contactID, experienceId, timeSlotId, null, replaceAll);

// Dopo:
await reservationService.saveReservation(db, contactID, slot.id, timeSlotId, null, replaceAll);
```

Questo garantirà che il valore salvato nel campo `experience_id` della tabella `opend_reservations` sia l'ID dello slot (`dbId`), che è lo stesso valore che viene utilizzato nella funzione `getExperiencesByCustomObjectIds` per identificare gli slot prenotati.

### 2. Aggiungere Log per Debugging

Aggiungere log dettagliati per verificare che il valore corretto venga salvato e recuperato:

```javascript
// In server.js, prima di salvare la prenotazione
logger.info(`Saving reservation with slot.id=${slot.id} instead of experienceId=${experienceId}`);

// In reservationService.js, nella funzione saveReservation
logger.info(`Saving reservation with experience_id=${experienceId} (this should be the dbId of the slot)`);
```

## Impatto della Modifica

Questa modifica garantirà che quando l'utente torna sulla pagina, gli slot che aveva prenotato in precedenza vengano correttamente identificati e mostrati come selezionati.

## Test della Soluzione

1. Effettuare una prenotazione per uno slot specifico
2. Verificare nei log che il valore salvato nel campo `experience_id` sia l'ID dello slot (`dbId`)
3. Tornare alla pagina di selezione degli slot
4. Verificare che lo slot prenotato in precedenza venga correttamente mostrato come selezionato

## Nota Importante

Questa modifica potrebbe richiedere una migrazione dei dati esistenti se ci sono già prenotazioni nel sistema. In tal caso, sarebbe necessario aggiornare i valori esistenti nel campo `experience_id` per utilizzare l'ID dello slot invece dell'ID dell'esperienza.