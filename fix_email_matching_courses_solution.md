# Soluzione per il problema di matchingCourses nell'email

Basandoci sull'analisi dei log e sul piano di implementazione, proponiamo la seguente soluzione concreta per risolvere il problema dell'email che mostra sempre tutti i corsi invece della lista filtrata.

## Soluzione proposta

Modificheremo la funzione `sendEmailWithQR` per accettare un parametro aggiuntivo `matchingCourseIds` e lo useremo per filtrare i corsi quando `matchingCourses` è vuoto.

## Modifiche al codice

### 1. Modifica alla chiamata di `sendEmailWithQR` nell'endpoint `/api/update-selected-experiences`

```javascript
// Cerca questa riga nel file server.js (intorno alla linea 1605)
await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false);

// Sostituiscila con questa
await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses, false, normalizedMatchingCourseIds);
```

### 2. Modifica alla definizione della funzione `sendEmailWithQR`

Dobbiamo modificare entrambe le definizioni della funzione `sendEmailWithQR` nel file server.js (intorno alle linee 222 e 1013).

```javascript
// Prima definizione (intorno alla linea 222)
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = [], useOttoJson = false, matchingCourseIds = []) {
    return new Promise((resolve, reject) => {
        console.log("XXXXX");
        
        // Add detailed logging for matchingCourses parameter
        logger.info(`sendEmailWithQR received matchingCourses: ${matchingCourses ? (Array.isArray(matchingCourses) ? matchingCourses.length : 'not an array') : 'undefined'}`);
        logger.info(`matchingCourses type: ${typeof matchingCourses}`);
        if (matchingCourses && Array.isArray(matchingCourses) && matchingCourses.length > 0) {
            logger.info(`First matchingCourse: ${JSON.stringify(matchingCourses[0])}`);
            logger.info(`matchingCourses IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
        } else {
            logger.info(`matchingCourses is empty or not an array`);
        }
        
        // Add logging for matchingCourseIds parameter
        logger.info(`sendEmailWithQR received matchingCourseIds: ${matchingCourseIds ? (Array.isArray(matchingCourseIds) ? matchingCourseIds.length : 'not an array') : 'undefined'}`);
        if (matchingCourseIds && Array.isArray(matchingCourseIds) && matchingCourseIds.length > 0) {
            logger.info(`matchingCourseIds: ${matchingCourseIds.join(', ')}`);
        }
        
        // Validate language parameter
        if (!language || (language !== 'en' && language !== 'it')) {
            logger.info(`Invalid or empty language parameter: "${language}". Using default language: "en"`);
            language = 'en';
        } else {
            logger.info(`Using language: "${language}" for email template`);
        }
        
        // Se matchingCourses è vuoto ma abbiamo matchingCourseIds, usali per filtrare i corsi
        if ((!matchingCourses || matchingCourses.length === 0) && matchingCourseIds && Array.isArray(matchingCourseIds) && matchingCourseIds.length > 0) {
            logger.info(`matchingCourses è vuoto ma abbiamo matchingCourseIds: ${matchingCourseIds.join(', ')}`);
            
            try {
                const coursesPath = path.join(__dirname, 'corsi.json');
                const coursesData = fs.readFileSync(coursesPath, 'utf8');
                const allCourses = JSON.parse(coursesData);
                logger.info(`Loaded ${allCourses.length} courses from corsi.json`);
                
                // Filtra i corsi usando matchingCourseIds
                matchingCourses = allCourses.filter(course => {
                    const courseIdStr = String(course.id);
                    const isMatch = matchingCourseIds.includes(courseIdStr);
                    logger.info(`Course ID ${courseIdStr} match: ${isMatch}`);
                    return isMatch;
                });
                
                logger.info(`Filtered to ${matchingCourses.length} courses using matchingCourseIds`);
                if (matchingCourses.length > 0) {
                    logger.info(`First filtered course: ${JSON.stringify(matchingCourses[0])}`);
                    logger.info(`Filtered course IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
                }
            } catch (error) {
                logger.error('Error filtering courses using matchingCourseIds:', error);
                logger.error('Falling back to loading all courses');
                matchingCourses = [];
            }
        }
        
        // Se matchingCourses è ancora vuoto, carica TUTTI i corsi dalla fonte appropriata (comportamento esistente)
        if (!matchingCourses || matchingCourses.length === 0) {
            // ... codice esistente ...
        }
        
        // ... resto del codice ...
    });
}

// Seconda definizione (intorno alla linea 1013)
// Applica le stesse modifiche alla seconda definizione della funzione
```

### 3. Modifica alla seconda definizione della funzione `sendEmailWithQR`

Applica le stesse modifiche alla seconda definizione della funzione `sendEmailWithQR` (intorno alla linea 1013).

## Spiegazione della soluzione

Questa soluzione risolve il problema in questo modo:

1. Passa i `matchingCourseIds` direttamente alla funzione `sendEmailWithQR`
2. Quando `matchingCourses` è vuoto, la funzione controlla se sono disponibili `matchingCourseIds`
3. Se sono disponibili, carica tutti i corsi da corsi.json e li filtra usando `matchingCourseIds`
4. Solo se sia `matchingCourses` che `matchingCourseIds` sono vuoti, carica tutti i corsi (comportamento esistente)

Questo approccio garantisce che l'email contenga solo i corsi filtrati, anche se l'array `matchingCourses` arriva vuoto alla funzione.

## Vantaggi della soluzione

1. **Robustezza**: La soluzione funziona anche se `matchingCourses` è vuoto per qualsiasi motivo
2. **Compatibilità**: Mantiene il comportamento esistente come fallback
3. **Debugging**: Include logging dettagliato per facilitare il debug
4. **Minima invasività**: Richiede modifiche minime al codice esistente

## Test della soluzione

Dopo aver implementato questa soluzione:

1. Riavvia il server
2. Testa l'applicazione selezionando alcune esperienze e inviando il form
3. Verifica che l'email contenga solo i corsi filtrati
4. Controlla i log per confermare che la soluzione funziona come previsto