# Migrazione del campo experience_id in opend_reservations

## Descrizione delle Modifiche

Questo progetto modifica il sistema di prenotazione in modo che il campo `experience_id` nella tabella `opend_reservations` salvi il `dbId` (ID numerico dalla tabella `experiences`) invece dell'`experience_id` testuale. Questo semplifica le query e migliora le performance.

## File Modificati

1. **reservationService.js**
   - Aggiornato per utilizzare il `dbId` invece dell'`experience_id` testuale
   - Modificati i messaggi di log per riflettere il cambiamento

2. **courseExperienceService.js**
   - Aggiornata la funzione `getExperiencesByCustomObjectIds` per gestire il fatto che `experience_id` ora contiene il `dbId`
   - Modificata la logica che verifica se uno slot è selezionato per utilizzare il `dbId`

3. **server.js**
   - Aggiornato l'endpoint `/api/reserve` per passare il `dbId` al servizio di prenotazione
   - Aggiornato l'endpoint `/api/cancel-reservation` per gestire sia il `dbId` che l'`experience_id` testuale (per compatibilità)

4. **experiencesService.js**
   - Aggiornata la funzione `decrementParticipantCountForTimeSlot` per gestire il caso in cui `experienceId` è un `dbId` numerico

## Script di Migrazione

Sono stati creati due script per la migrazione dei dati esistenti:

1. **migrate_opend_reservations.js**
   - Script principale che aggiorna i record esistenti nella tabella `opend_reservations`
   - Crea una tabella di backup prima di iniziare la migrazione
   - Per ogni record, trova il `dbId` corrispondente all'`experience_id` testuale e aggiorna il campo

2. **run_migration.js**
   - Script di utilità per eseguire la migrazione

## Come Eseguire la Migrazione

1. Assicurarsi che il server sia spento
2. Eseguire il backup del database
3. Eseguire lo script di migrazione:

```bash
node run_migration.js
```

4. Verificare i log per assicurarsi che la migrazione sia stata completata con successo
5. Riavviare il server

## Vantaggi della Modifica

1. **Performance**:
   - Query più efficienti utilizzando ID numerici invece di stringhe
   - Join più veloci con la tabella `experiences`

2. **Semplificazione**:
   - Eliminazione della necessità di mappature complesse tra ID testuali e numerici
   - Codice più pulito e manutenibile

3. **Coerenza**:
   - Utilizzo coerente degli ID in tutto il sistema
   - Riduzione del rischio di errori dovuti a formati di ID diversi

## Compatibilità

Il sistema è stato progettato per mantenere la compatibilità con il codice esistente:

- L'endpoint `/api/cancel-reservation` può ancora accettare l'`experience_id` testuale
- La funzione `decrementParticipantCountForTimeSlot` può gestire entrambi i formati di ID

## Possibili Problemi

1. **Frontend**: Se il frontend invia direttamente l'`experience_id` testuale invece del `dbId`, potrebbe essere necessario aggiornarlo.
2. **API Esterne**: Se ci sono API esterne che utilizzano l'`experience_id` testuale, potrebbe essere necessario aggiornare anche quelle.