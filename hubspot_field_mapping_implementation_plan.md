# HubSpot Field Mapping Implementation Plan

## Problema Identificato

Analizzando il log, ho identificato un problema nell'integrazione con HubSpot:

1. Quando il sistema tenta di aggiornare il campo `open_day__iscrizione_esperienze_10_05_2025` in HubSpot con l'ID dell'esperienza "10026", HubSpot restituisce un errore 400.
2. HubSpot si aspetta valori come "140332577011", "140329700586", ecc., non "10026".
3. Il sistema ha accesso a una mappatura tra gli ID delle esperienze e i tipi di corso:
   ```
   [2025-05-02T04:18:39.640Z] INFO: Course type map: {"10026":"140261653720","10027":"140261653720"}
   ```

## Requisito

Implementare una condizione basata sul codice del corso (course_type) o direttamente sull'ID dell'esperienza:
- Se il codice del corso corrisponde a un valore specifico (140261653720) o se l'ID dell'esperienza è "10026" o "10027", aggiornare il campo HubSpot `slot_prenotazione_workshop_genitori_open_day_2025` invece di `open_day__iscrizione_esperienze_10_05_2025`.

## Soluzione Proposta

### Approccio 1: Verifica diretta dell'ID dell'esperienza (più semplice)

Modificare l'endpoint `/api/update-selected-experiences` per:
1. Verificare se gli ID delle esperienze corrispondono a quelli dei workshop genitori (10026, 10027)
2. In base a questa verifica, determinare quale campo HubSpot aggiornare
3. Utilizzare il valore appropriato per l'aggiornamento

### Approccio 2: Verifica del course_type (più flessibile)

Modificare l'endpoint `/api/update-selected-experiences` per:
1. Verificare il course_type associato all'ID dell'esperienza
2. In base al course_type, determinare quale campo HubSpot aggiornare
3. Utilizzare il valore appropriato per l'aggiornamento

## Piano di Implementazione

### Approccio 1: Verifica diretta dell'ID dell'esperienza

Modificare il file `server.js` intorno alla linea 1069:

```javascript
// Endpoint to update selected experiences in HubSpot
app.post('/api/update-selected-experiences', async (req, res) => {
    console.log('Endpoint /api/update-selected-experiences hit - this should appear in the server logs when the endpoint is called');
    console.log('Request body:', req.body);
    logger.info('Endpoint /api/update-selected-experiences hit - this should appear in the server logs when the endpoint is called');
    logger.info('Request body:', req.body);
    const { contactID, experienceIds } = req.body;
    
    if (!contactID || !experienceIds) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Log the received experienceIds to verify format
        logger.info(`Received experienceIds: ${JSON.stringify(experienceIds)}`);
        logger.info(`experienceIds is array: ${Array.isArray(experienceIds)}`);
        if (Array.isArray(experienceIds)) {
            logger.info(`Number of experienceIds: ${experienceIds.length}`);
        }
        
        // Format the experience IDs as a semicolon-separated string
        const experiencesString = Array.isArray(experienceIds)
            ? experienceIds.join(';')
            : experienceIds;
        
        logger.info(`Updating HubSpot contact ${contactID} with selected experiences: ${experiencesString}`);
        
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
        
        // Log the request details
        const requestData = {
            properties: {
                [hubspotField]: experiencesString
            }
        };
        logger.info('HubSpot update request data:', JSON.stringify(requestData, null, 2));
        logger.info(`Final property value being sent to HubSpot: "${experiencesString}"`);
        
        // Log the API key being used (without showing the full key)
        const apiKeyPrefix = apiKey.substring(0, 10);
        logger.info(`Using API key with prefix: ${apiKeyPrefix}...`);
        
        // Update the HubSpot contact property
        const response = await axios.patch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactID}`,
            requestData
        );
        
        // ... resto del codice esistente ...
    } catch (error) {
        // ... gestione errori esistente ...
    }
});
```

### Approccio 2: Verifica del course_type

Se si preferisce verificare il course_type (più flessibile ma richiede una query al database):

```javascript
// Endpoint to update selected experiences in HubSpot
app.post('/api/update-selected-experiences', async (req, res) => {
    // ... codice iniziale esistente ...
    
    try {
        // ... codice esistente ...
        
        // Ottieni il course_type per ogni experienceId
        const courseTypes = await getCourseTypesForExperiences(db, experienceIds);
        logger.info(`Course types for experiences: ${JSON.stringify(courseTypes)}`);
        
        // Verifica se uno degli experienceIds ha il course_type specifico per workshop genitori
        const WORKSHOP_GENITORI_COURSE_TYPE = '140261653720'; // Il course_type per workshop genitori
        const isWorkshopGenitori = Object.values(courseTypes).includes(WORKSHOP_GENITORI_COURSE_TYPE);
        
        // Determina quale campo HubSpot aggiornare in base al course_type
        let hubspotField = 'open_day__iscrizione_esperienze_10_05_2025';
        if (isWorkshopGenitori) {
            hubspotField = 'slot_prenotazione_workshop_genitori_open_day_2025';
            logger.info(`Using workshop genitori field: ${hubspotField}`);
        }
        
        // ... resto del codice esistente ...
    } catch (error) {
        // ... gestione errori esistente ...
    }
});

/**
 * Ottiene i course_type per gli ID delle esperienze specificati
 * @param {Object} db - Istanza del database SQLite
 * @param {Array<string>} experienceIds - Array di ID delle esperienze
 * @returns {Promise<Object>} - Oggetto con mapping experienceId -> course_type
 */
async function getCourseTypesForExperiences(db, experienceIds) {
    return new Promise((resolve, reject) => {
        // Se non ci sono experienceIds, restituisci un oggetto vuoto
        if (!experienceIds || experienceIds.length === 0) {
            resolve({});
            return;
        }
        
        // Crea i placeholder per la query SQL
        const placeholders = experienceIds.map(() => '?').join(',');
        
        // Esegui la query per ottenere i course_type
        db.all(
            `SELECT experience_id, course_type FROM experiences WHERE experience_id IN (${placeholders})`,
            experienceIds,
            (err, rows) => {
                if (err) {
                    logger.error(`Error retrieving course types: ${err.message}`);
                    reject(err);
                    return;
                }
                
                // Crea un oggetto di mapping experienceId -> course_type
                const courseTypeMap = {};
                rows.forEach(row => {
                    courseTypeMap[row.experience_id] = row.course_type;
                });
                
                logger.info(`Course type map: ${JSON.stringify(courseTypeMap)}`);
                
                // Se non troviamo il course_type nel database, possiamo usare una mappatura hardcoded
                // basata sui dati che abbiamo visto nel log
                if (Object.keys(courseTypeMap).length === 0) {
                    logger.info('No course types found in database, using hardcoded mapping');
                    const HARDCODED_COURSE_TYPES = {
                        '10026': '140261653720',
                        '10027': '140261653720'
                    };
                    
                    experienceIds.forEach(id => {
                        if (HARDCODED_COURSE_TYPES[id]) {
                            courseTypeMap[id] = HARDCODED_COURSE_TYPES[id];
                        }
                    });
                    logger.info(`Hardcoded course type map: ${JSON.stringify(courseTypeMap)}`);
                }
                
                resolve(courseTypeMap);
            }
        );
    });
}
```

## Raccomandazione

Consiglio di implementare l'**Approccio 1** (verifica diretta dell'ID dell'esperienza) perché:

1. È più semplice e non richiede query aggiuntive al database
2. È più veloce poiché non c'è overhead di database
3. Dai log, sappiamo già che gli ID 10026 e 10027 corrispondono al course_type 140261653720

Se in futuro ci saranno più workshop genitori con ID diversi, si potrà passare all'Approccio 2 o semplicemente aggiornare l'array `WORKSHOP_GENITORI_IDS` nell'Approccio 1.

## Test Plan

1. Verificare che l'endpoint `/api/update-selected-experiences` funzioni correttamente con experienceIds diversi
2. Verificare che quando viene inviato un experienceId "10026" o "10027", il sistema aggiorni il campo HubSpot `slot_prenotazione_workshop_genitori_open_day_2025`
3. Verificare che quando viene inviato un experienceId diverso, il sistema aggiorni il campo HubSpot `open_day__iscrizione_esperienze_10_05_2025`

## Considerazioni Aggiuntive

- Potrebbe essere necessario aggiornare anche altri endpoint o funzioni che interagiscono con HubSpot
- Potrebbe essere utile creare una tabella di mappatura più completa tra gli ID delle esperienze e i valori accettati da HubSpot
- Considerare l'aggiunta di log più dettagliati per facilitare il debug di eventuali problemi futuri