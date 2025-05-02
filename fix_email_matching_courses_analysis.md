# Analisi del problema con matchingCourses nell'email

## Log ricevuti

```
[2025-05-02T11:18:33.210Z] INFO: sendEmailWithQR received matchingCourses: 0
[2025-05-02T11:18:33.211Z] INFO: matchingCourses type: object
[2025-05-02T11:18:33.211Z] INFO: matchingCourses is empty or not an array
```

## Analisi

Dai log possiamo determinare che:

1. `matchingCourses` è un oggetto (non è undefined o null)
2. Ha una lunghezza di 0, il che significa che è un array vuoto
3. La condizione `matchingCourses.length === 0` è vera, il che attiva il meccanismo di fallback che carica tutti i corsi da corsi.json

Questo spiega perché l'email mostra sempre tutti i corsi invece della lista filtrata. L'array `matchingCourses` viene passato alla funzione, ma è vuoto quando arriva.

## Possibili cause

Il problema potrebbe essere in uno di questi passaggi:

1. Nel frontend, i `matchingCourseIds` vengono recuperati dall'API e memorizzati nello state
2. Quando si invia il form, questi ID vengono passati a `updateSelectedExperiences`
3. Nell'endpoint `/api/update-selected-experiences`, il server riceve `matchingCourseIds` nel corpo della richiesta
4. Normalizza questi ID e li usa per filtrare i corsi usando la funzione `getMatchingCourses`
5. I corsi filtrati vengono poi passati a `sendEmailWithQR`

## Piano di azione

Per risolvere il problema, dobbiamo aggiungere più logging per tracciare il flusso di `matchingCourseIds` e `matchingCourses` attraverso il sistema per trovare dove vengono persi.

### 1. Aggiungere logging nel frontend

In `OpenDayRegistration.tsx`, aggiungere logging prima di chiamare `updateSelectedExperiences`:

```javascript
console.log('Calling updateSelectedExperiences with matchingCourseIds:', matchingCourseIds);
console.log('matchingCourseIds type:', typeof matchingCourseIds);
console.log('matchingCourseIds is array:', Array.isArray(matchingCourseIds));
console.log('matchingCourseIds length:', matchingCourseIds.length);
```

### 2. Aggiungere logging nell'endpoint `/api/update-selected-experiences`

Nel server.js, aggiungere logging quando si ricevono i `matchingCourseIds`:

```javascript
logger.info(`Received matchingCourseIds in request body: ${JSON.stringify(req.body.matchingCourseIds)}`);
logger.info(`matchingCourseIds type: ${typeof req.body.matchingCourseIds}`);
logger.info(`matchingCourseIds is array: ${Array.isArray(req.body.matchingCourseIds)}`);
if (Array.isArray(req.body.matchingCourseIds)) {
    logger.info(`matchingCourseIds length: ${req.body.matchingCourseIds.length}`);
}
```

### 3. Aggiungere logging prima di chiamare `getMatchingCourses`

```javascript
logger.info(`Calling getMatchingCourses with filterIds: ${filterIds.join(', ')}`);
logger.info(`filterIds length: ${filterIds.length}`);
logger.info(`returnAllCourses: ${returnAllCourses}`);
```

### 4. Aggiungere logging dopo aver chiamato `getMatchingCourses`

```javascript
logger.info(`getMatchingCourses returned ${matchingCourses.length} courses`);
if (matchingCourses.length > 0) {
    logger.info(`First matchingCourse: ${JSON.stringify(matchingCourses[0])}`);
    logger.info(`matchingCourses IDs: ${matchingCourses.map(c => c.id).join(', ')}`);
}
```

### 5. Aggiungere logging prima di chiamare `sendEmailWithQR`

```javascript
logger.info(`Calling sendEmailWithQR with matchingCourses.length: ${matchingCourses.length}`);
if (matchingCourses.length > 0) {
    logger.info(`First matchingCourse before sendEmailWithQR: ${JSON.stringify(matchingCourses[0])}`);
}
```

## Possibile soluzione

Se i log mostrano che `matchingCourses` è vuoto quando viene passato a `sendEmailWithQR`, potrebbe essere necessario modificare la funzione `getMatchingCourses` per assicurarsi che restituisca i corsi corretti. In particolare, potrebbe essere necessario verificare che `filterIds` contenga gli ID corretti e che la funzione di filtro stia funzionando correttamente.

Una possibile soluzione potrebbe essere:

1. Verificare che `req.body.matchingCourseIds` venga ricevuto correttamente dal server
2. Verificare che `filterIds` venga popolato correttamente
3. Verificare che la funzione `getMatchingCourses` stia filtrando correttamente i corsi
4. Se necessario, modificare la funzione `getMatchingCourses` per assicurarsi che restituisca i corsi corretti

## Prossimi passi

1. Implementare il logging aggiuntivo
2. Testare l'applicazione e analizzare i log
3. In base ai risultati, implementare la soluzione appropriata