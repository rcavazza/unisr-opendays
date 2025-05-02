# Implementazione del Mapping dei Campi HubSpot

## Modifiche Implementate

Ho implementato la soluzione proposta nell'Approccio 1 del piano di implementazione, che prevede la verifica diretta degli ID delle esperienze per determinare quale campo HubSpot aggiornare.

### Modifiche al file `server.js`

1. **Aggiunta della logica di verifica degli ID delle esperienze**:
   ```javascript
   // Verifica se uno degli experienceIds è un workshop genitori (10026 o 10027)
   const WORKSHOP_GENITORI_IDS = ['10026', '10027'];
   const isWorkshopGenitori = Array.isArray(experienceIds) 
       ? experienceIds.some(id => WORKSHOP_GENITORI_IDS.includes(id))
       : WORKSHOP_GENITORI_IDS.includes(experienceIds);
   
   // Determina quale campo HubSpot aggiornare in base all'ID dell'esperienza
   let hubspotField = 'open_day__iscrizione_esperienze_10_05_2025';
   if (isWorkshopGenitori) {
       hubspotField = 'slot_prenotazione_workshop_genitori_open_day_2025';
       logger.info(`Using workshop genitori field: ${hubspotField}`);
   }
   ```

2. **Aggiornamento dell'oggetto requestData per utilizzare il campo dinamico**:
   ```javascript
   const requestData = {
       properties: {
           [hubspotField]: experiencesString
       }
   };
   ```

3. **Aggiunta di log aggiuntivi per facilitare il debug**:
   ```javascript
   logger.info(`Using HubSpot field: ${hubspotField} (isWorkshopGenitori: ${isWorkshopGenitori})`);
   ```

4. **Miglioramento della gestione degli errori per gli errori di opzione non valida**:
   ```javascript
   // Check if it's an invalid option error
   if (error.response.data.message.includes('not one of the allowed options')) {
       logger.error('This appears to be an invalid option error. The value sent is not in the list of allowed options for the property.');
       logger.error(`Field used: ${hubspotField}, Value sent: ${experiencesString}`);
       
       // Log the workshop genitori detection logic for debugging
       logger.error(`Workshop genitori detection: isWorkshopGenitori=${isWorkshopGenitori}`);
       logger.error(`Workshop genitori IDs: ${WORKSHOP_GENITORI_IDS.join(', ')}`);
       if (Array.isArray(experienceIds)) {
           logger.error(`Experience IDs checked: ${experienceIds.join(', ')}`);
       } else {
           logger.error(`Experience ID checked: ${experienceIds}`);
       }
   }
   ```

### Creazione di uno script di test

Ho creato uno script di test `test_hubspot_field_mapping.js` che verifica il corretto funzionamento dell'implementazione con diversi ID di esperienze:

1. Workshop Genitori (10026)
2. Workshop Genitori (10027)
3. Esperienza regolare (140332577011)
4. Esperienze miste (140332577011, 10026)

## Come Testare l'Implementazione

1. **Avvia il server**:
   ```
   node server.js
   ```

2. **Esegui lo script di test**:
   ```
   node test_hubspot_field_mapping.js
   ```

3. **Verifica i log del server** per assicurarti che:
   - Il campo corretto venga utilizzato per ogni richiesta
   - Non ci siano errori di opzione non valida

4. **Verifica in HubSpot** che i contatti vengano aggiornati con i valori corretti nei campi appropriati.

## Considerazioni Aggiuntive

- Se in futuro ci saranno più workshop genitori con ID diversi, sarà necessario aggiornare l'array `WORKSHOP_GENITORI_IDS` nell'endpoint.
- Se la struttura dei campi HubSpot cambia, sarà necessario aggiornare i nomi dei campi nell'endpoint.
- I log aggiuntivi aiuteranno a diagnosticare eventuali problemi futuri con il mapping dei campi.

## Risoluzione dei Problemi

Se si verificano errori durante il test:

1. **Errore "not one of the allowed options"**:
   - Verifica che il campo HubSpot utilizzato sia corretto
   - Verifica che il valore inviato sia uno dei valori consentiti per quel campo
   - Controlla i log per vedere quale campo è stato utilizzato e perché

2. **Errore "property not found"**:
   - Verifica che i nomi dei campi HubSpot siano corretti
   - Verifica che i campi esistano nell'account HubSpot

3. **Errore di autenticazione**:
   - Verifica che l'API key di HubSpot sia valida e non sia scaduta