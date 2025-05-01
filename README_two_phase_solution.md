# Soluzione in Due Fasi per la Visualizzazione degli Slot Prenotati

## Problema Risolto

Questo fix risolve il problema per cui gli slot nella pagina di selezione non venivano tutti correttamente visualizzati come selezionati nell'interfaccia, nonostante l'utente avesse già effettuato delle prenotazioni.

## Approccio della Soluzione

La soluzione implementa un approccio in due fasi:

1. **Fase 1: Raccolta di Tutti i Dati**
   - Recuperare tutte le esperienze e i loro slot dal database
   - Organizzare i dati in una struttura che raggruppi gli slot per esperienza
   - Assegnare numeri progressivi agli slot all'interno di ciascuna esperienza

2. **Fase 2: Verifica delle Prenotazioni**
   - Per ogni esperienza e i suoi slot, verificare se l'utente ha prenotazioni
   - Marcare come selezionati gli slot che corrispondono alle prenotazioni dell'utente

## Modifiche Apportate

Le modifiche sono state apportate al file `courseExperienceService.js` nella funzione `getExperiencesByCustomObjectIds`. In particolare:

1. **Fase 1: Raccolta dei Dati**
   - Modificata la creazione degli slot per non verificare immediatamente se sono selezionati
   - Tutti gli slot vengono inizialmente impostati come non selezionati (`selected: false`)

2. **Fase 2: Verifica delle Prenotazioni**
   - Aggiunta una nuova fase dopo la creazione e l'ordinamento di tutti gli slot
   - Per ogni slot, verifica se l'utente ha una prenotazione corrispondente
   - Utilizza diversi metodi di confronto per garantire che tutti gli slot prenotati vengano identificati:
     - Confronto dei numeri degli slot
     - Confronto degli ID completi
     - Verifica se la prenotazione termina con lo stesso numero di slot
     - Verifica del formato chiave esatta

## Come Testare le Modifiche

1. **Riavviare il Server**:
   ```bash
   node restart_after_two_phase_fix.js
   ```

2. **Eseguire lo Script di Test**:
   ```bash
   node test_two_phase_solution.js
   ```

   Questo script farà una richiesta all'endpoint `/api/get_experiences` con un contactID che ha prenotazioni esistenti e verificherà se gli slot sono correttamente marcati come selezionati.

3. **Verificare i Log del Server**:
   I log del server dovrebbero mostrare messaggi dettagliati sul processo di verifica degli slot selezionati, inclusi messaggi come:
   - `FASE 2: Verifica delle prenotazioni dell'utente per ogni slot`
   - `Verifica slot X (dbId: Y). Prenotazioni utente: [...]`
   - `Match trovato! Slot X corrisponde alla prenotazione Y`
   - `Slot X (dbId: Y) marcato come selezionato`

4. **Verificare l'Interfaccia Utente**:
   Accedere alla pagina di selezione degli slot con un utente che ha già effettuato prenotazioni e verificare che tutti gli slot prenotati siano correttamente visualizzati come selezionati.

## Vantaggi della Soluzione

1. **Visione Completa**: Il sistema ha una visione completa di tutti gli slot prima di verificare le prenotazioni
2. **Maggiore Precisione**: La verifica delle prenotazioni è più precisa perché si basa su dati completi
3. **Manutenibilità**: Il codice è più chiaro e più facile da mantenere grazie alla separazione delle fasi
4. **Robustezza**: La soluzione gestisce correttamente tutti i casi, anche quando i numeri degli slot sono diversi

## Possibili Miglioramenti Futuri

1. **Standardizzazione dei Time Slot ID**:
   Standardizzare il formato dei time_slot_id in tutto il sistema per evitare la necessità di provare diversi formati.

2. **Migrazione dei Dati**:
   Eseguire una migrazione completa dei dati esistenti per garantire che tutte le prenotazioni utilizzino il formato corretto.

3. **Ottimizzazione delle Performance**:
   Se il numero di esperienze e slot dovesse crescere significativamente, si potrebbe ottimizzare ulteriormente la logica di verifica delle prenotazioni.