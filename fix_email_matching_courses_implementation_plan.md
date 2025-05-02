# Piano di implementazione per risolvere il problema di matchingCourses nell'email

Basandoci sull'analisi dei log, abbiamo determinato che l'array `matchingCourses` è vuoto quando arriva alla funzione `sendEmailWithQR`, causando il caricamento di tutti i corsi da corsi.json invece di usare solo quelli filtrati.

## Approccio alla soluzione

Proponiamo due possibili approcci per risolvere il problema:

### Approccio 1: Aggiungere più logging e debug

Prima di implementare una soluzione definitiva, aggiungiamo più logging per tracciare il flusso di `matchingCourseIds` e `matchingCourses` attraverso il sistema per identificare esattamente dove vengono persi.

### Approccio 2: Implementare una soluzione diretta

Basandoci sui log attuali, possiamo già implementare una soluzione che potrebbe risolvere il problema.

## Piano di implementazione

### Fase 1: Aggiungere logging aggiuntivo

1. Nel file `server.js`, aggiungere logging nell'endpoint `/api/update-selected-experiences`:

```javascript
// Dopo aver ricevuto la richiesta
logger.info(`Received request to update selected experiences for contactID: ${contactID}`);
logger.info(`Received experienceIds: ${JSON.stringify(experienceIds)}`);
logger.info(`Received matchingCourseIds: ${JSON.stringify(matchingCourseIds)}`);
logger.info(`matchingCourseIds type: ${typeof matchingCourseIds}`);
logger.info(`matchingCourseIds is array: ${Array.isArray(matchingCourseIds)}`);
if (Array.isArray(matchingCourseIds)) {
    logger.info(`matchingCourseIds length: ${matchingCourseIds.length}`);
}

// Prima di chiamare getMatchingCourses
logger.info(`Calling getMatchingCourses with filterIds: ${filterIds.join(', ')}`);
logger.info(`filterIds length: ${filterIds.length}`);
logger.info(`returnAllCourses: ${returnAllCourses}`);

// Dopo aver chiamato getMatchingCourses
logger.info(`getMatchingCourses returned ${matchingCourses.length} courses`);
if (matchingCourses.length > 0) {
    logger.info(`First matchingCourse: ${JSON.stringify(matchingCourses[0])}`);
    logger.info(`matchingCourses IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
}

// Prima di chiamare sendEmailWithQR
logger.info(`Calling sendEmailWithQR with matchingCourses.length: ${matchingCourses.length}`);
if (matchingCourses.length > 0) {
    logger.info(`First matchingCourse before sendEmailWithQR: ${JSON.stringify(matchingCourses[0])}`);
}
```

2. Nella funzione `getMatchingCourses`, aggiungere logging:

```javascript
// All'inizio della funzione
logger.info(`getMatchingCourses called with courseIds: ${JSON.stringify(courseIds)}`);
logger.info(`returnAllCourses: ${returnAllCourses}`);

// Dopo aver caricato i corsi
logger.info(`Loaded ${allCourses.length} courses from corsi.json`);

// Dopo aver filtrato i corsi
logger.info(`Filtered to ${matchingCourses.length} matching courses`);
if (matchingCourses.length > 0) {
    logger.info(`First matching course: ${JSON.stringify(matchingCourses[0])}`);
}
```

### Fase 2: Implementare una soluzione diretta

Basandoci sui log attuali, possiamo implementare una soluzione che potrebbe risolvere il problema. Ecco alcune opzioni:

#### Opzione 1: Modificare la condizione nella funzione `sendEmailWithQR`

Invece di caricare tutti i corsi quando `matchingCourses` è vuoto, potremmo modificare la funzione per usare i `matchingCourseIds` direttamente:

```javascript
// Modifica nella funzione sendEmailWithQR
if (!matchingCourses || matchingCourses.length === 0) {
    // Invece di caricare tutti i corsi, carica solo quelli corrispondenti ai matchingCourseIds
    if (req.body.matchingCourseIds && Array.isArray(req.body.matchingCourseIds) && req.body.matchingCourseIds.length > 0) {
        logger.info(`Using matchingCourseIds from request body: ${req.body.matchingCourseIds.join(', ')}`);
        matchingCourses = getMatchingCourses(req.body.matchingCourseIds, false);
    } else {
        // Se non ci sono matchingCourseIds, carica tutti i corsi come fallback
        // ... codice esistente ...
    }
}
```

#### Opzione 2: Passare i `matchingCourseIds` direttamente alla funzione `sendEmailWithQR`

Modificare la chiamata a `sendEmailWithQR` per passare anche i `matchingCourseIds`:

```javascript
// Modifica nella chiamata a sendEmailWithQR
await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false, req.body.matchingCourseIds);
```

E poi modificare la funzione `sendEmailWithQR` per accettare questo parametro aggiuntivo:

```javascript
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false, matchingCourseIds = []) {
    return new Promise((resolve, reject) => {
        // ... codice esistente ...
        
        // Se matchingCourses è vuoto ma abbiamo matchingCourseIds, usali per filtrare i corsi
        if ((!matchingCourses || matchingCourses.length === 0) && matchingCourseIds.length > 0) {
            logger.info(`matchingCourses è vuoto ma abbiamo matchingCourseIds: ${matchingCourseIds.join(', ')}`);
            
            try {
                const coursesPath = path.join(__dirname, 'corsi.json');
                const coursesData = fs.readFileSync(coursesPath, 'utf8');
                const allCourses = JSON.parse(coursesData);
                
                // Filtra i corsi usando matchingCourseIds
                matchingCourses = allCourses.filter(course => {
                    return matchingCourseIds.includes(String(course.id));
                });
                
                logger.info(`Filtrati ${matchingCourses.length} corsi usando matchingCourseIds`);
            } catch (error) {
                logger.error('Error filtering courses using matchingCourseIds:', error);
                // Fallback al comportamento esistente
                // ... codice esistente ...
            }
        } else if (!matchingCourses || matchingCourses.length === 0) {
            // Comportamento esistente per quando non abbiamo né matchingCourses né matchingCourseIds
            // ... codice esistente ...
        }
        
        // ... resto del codice ...
    });
}
```

#### Opzione 3: Verificare la funzione `getMatchingCourses`

Potrebbe esserci un problema nella funzione `getMatchingCourses` che causa il ritorno di un array vuoto. Verificare che la funzione stia filtrando correttamente i corsi:

```javascript
// Nella funzione getMatchingCourses
const matchingCourses = allCourses.filter(course => {
    const courseIdStr = String(course.id);
    const isMatch = normalizedCourseIds.includes(courseIdStr);
    logger.debug(`Course ID ${courseIdStr} match: ${isMatch}`);
    return isMatch;
});
```

### Fase 3: Testare la soluzione

1. Implementare una delle soluzioni proposte
2. Riavviare il server
3. Testare l'applicazione e verificare che l'email contenga solo i corsi filtrati
4. Analizzare i log per confermare che la soluzione ha risolto il problema

## Raccomandazione

Raccomandiamo di implementare prima la Fase 1 (aggiungere logging aggiuntivo) per ottenere più informazioni sul problema. Poi, in base ai risultati, implementare una delle soluzioni proposte nella Fase 2.

L'Opzione 2 (passare i `matchingCourseIds` direttamente alla funzione `sendEmailWithQR`) sembra la più promettente, poiché fornisce un modo diretto per assicurarsi che la funzione abbia accesso ai dati necessari per filtrare i corsi.