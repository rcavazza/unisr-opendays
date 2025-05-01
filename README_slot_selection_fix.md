# Fix per la Visualizzazione degli Slot Prenotati

## Problema Risolto

Questo fix risolve il problema per cui gli slot nella pagina di selezione non venivano aggiornati per mostrare le prenotazioni già effettuate dall'utente, nonostante il sistema recuperasse correttamente queste prenotazioni dal database.

## Modifiche Apportate

Le modifiche sono state apportate al file `courseExperienceService.js` nella funzione `getExperiencesByCustomObjectIds`. In particolare:

1. È stata migliorata la logica che verifica se uno slot è stato prenotato dall'utente, aggiungendo il supporto per diversi formati di time_slot_id:
   ```javascript
   isSelected = userReservationsByDbId[dbId].some(slotId => {
       // Try different formats of the time slot ID
       const match = slotId === timeSlotId || 
              slotId === `${baseExperienceId}-${slotNumber}` ||
              slotId.endsWith(`-${slotNumber}`);
       
       if (match) {
           logger.info(`Match found! Slot ${timeSlotId} matches reservation ${slotId}`);
       }
       
       return match;
   });
   ```

2. Sono stati aggiunti log dettagliati per il debug:
   ```javascript
   logger.info(`Checking if slot ${timeSlotId} is selected for dbId ${dbId}. User has reservations: ${JSON.stringify(userReservationsByDbId[dbId])}`);
   logger.info(`Checking slot: dbId=${dbId}, timeSlotId=${timeSlotId}, isSelected=${isSelected}`);
   ```

## Come Testare le Modifiche

1. **Riavviare il Server**:
   ```bash
   node restart_after_slot_selection_fix.js
   ```

2. **Eseguire lo Script di Test**:
   ```bash
   node test_slot_selection.js
   ```

   Questo script farà una richiesta all'endpoint `/api/get_experiences` con un contactID che ha prenotazioni esistenti e verificherà se gli slot sono correttamente marcati come selezionati.

3. **Verificare i Log del Server**:
   I log del server dovrebbero mostrare messaggi dettagliati sul processo di verifica degli slot selezionati, inclusi messaggi come:
   - `Checking if slot X is selected for dbId Y`
   - `Match found! Slot X matches reservation Y`
   - `Marking slot X as selected for dbId Y`

4. **Verificare l'Interfaccia Utente**:
   Accedere alla pagina di selezione degli slot con un utente che ha già effettuato prenotazioni e verificare che gli slot prenotati siano correttamente visualizzati come selezionati.

## Dettagli Tecnici

- Il sistema ora utilizza il `dbId` (ID numerico dalla tabella `experiences`) nel campo `experience_id` della tabella `opend_reservations`.
- Quando verifica se uno slot è selezionato, il sistema prova diversi formati di time_slot_id per garantire la compatibilità con le prenotazioni esistenti.
- Il sistema include il `dbId` nella risposta JSON inviata al frontend, permettendo al frontend di utilizzarlo per le operazioni future.

## Possibili Miglioramenti Futuri

1. **Standardizzazione dei Time Slot ID**:
   Standardizzare il formato dei time_slot_id in tutto il sistema per evitare la necessità di provare diversi formati.

2. **Migrazione dei Dati**:
   Eseguire una migrazione completa dei dati esistenti per garantire che tutte le prenotazioni utilizzino il formato corretto.

3. **Aggiornamento del Frontend**:
   Aggiornare il frontend per utilizzare sempre il `dbId` quando interagisce con il backend.