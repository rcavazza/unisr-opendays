# Nuova Modalità di Registrazione con Corsi ed Esperienze

Questo documento descrive come implementare e testare la nuova modalità di registrazione che consente agli utenti di confermare la partecipazione a corsi e selezionare esperienze correlate.

## Panoramica

La nuova modalità di registrazione aggiunge le seguenti funzionalità:
- Conferma della partecipazione a corsi predefiniti
- Selezione di esperienze correlate ai corsi confermati
- Riepilogo della registrazione con QR code
- Email di conferma con dettagli dei corsi ed esperienze

## Struttura dei File

- **Database**
  - `create_course_experience_tables.js`: Script per creare le nuove tabelle nel database

- **Servizi**
  - `courseExperienceService.js`: Modulo con funzioni per gestire corsi ed esperienze

- **Template EJS**
  - `views/it/confirmCourses.ejs`: Template per la conferma dei corsi (italiano)
  - `views/en/confirmCourses.ejs`: Template per la conferma dei corsi (inglese)
  - `views/it/selectExperiences.ejs`: Template per la selezione delle esperienze (italiano)
  - `views/en/selectExperiences.ejs`: Template per la selezione delle esperienze (inglese)
  - `views/it/registrationSummary.ejs`: Template per il riepilogo della registrazione (italiano)
  - `views/en/registrationSummary.ejs`: Template per il riepilogo della registrazione (inglese)
  - `views/it/email_courses.ejs`: Template per l'email di conferma (italiano)
  - `views/en/email_courses.ejs`: Template per l'email di conferma (inglese)

- **Patch**
  - `server_patch.js`: Modifiche da apportare al file server.js
  - `apply_server_patch.js`: Script per applicare le modifiche al file server.js
  - `views/it/email_patch.ejs`: Modifiche da apportare al file email.ejs (italiano)
  - `views/en/email_patch.ejs`: Modifiche da apportare al file email.ejs (inglese)
  - `apply_email_patch.js`: Script per applicare le modifiche ai file email.ejs

## Istruzioni per l'Implementazione

### 1. Creare le Nuove Tabelle nel Database

Eseguire lo script `create_course_experience_tables.js` per creare le nuove tabelle nel database:

```bash
node create_course_experience_tables.js
```

Questo script creerà le seguenti tabelle:
- `user_courses`: Per memorizzare i corsi confermati dall'utente
- `user_experiences`: Per memorizzare le esperienze selezionate dall'utente
- `experiences`: Per memorizzare le esperienze disponibili
- `course_experience_mapping`: Per memorizzare la relazione tra corsi ed esperienze

### 2. Applicare le Modifiche al Server

Eseguire lo script `apply_server_patch.js` per applicare le modifiche al file server.js:

```bash
node apply_server_patch.js
```

Questo script:
1. Importa il modulo `courseExperienceService.js`
2. Modifica la rotta `/submit-email` per reindirizzare a `/confirm-courses`
3. Aggiunge le nuove rotte per la nuova modalità di registrazione:
   - `/confirm-courses`: Per la conferma dei corsi
   - `/submit-course-confirmation`: Per elaborare la conferma dei corsi
   - `/submit-experiences`: Per elaborare la selezione delle esperienze

### 3. Applicare le Modifiche ai Template Email

Eseguire lo script `apply_email_patch.js` per applicare le modifiche ai file email.ejs:

```bash
node apply_email_patch.js
```

Questo script modifica i file email.ejs per supportare il nuovo tipo di email (type: 2) per la nuova modalità di registrazione.

## Flusso di Registrazione

1. L'utente inserisce l'email nel form esistente
2. Il sistema verifica l'email in HubSpot
3. Se l'email è valida, l'utente viene reindirizzato alla pagina di conferma corsi
4. L'utente conferma la partecipazione ai corsi e procede
5. Il sistema mostra le esperienze disponibili in base ai corsi confermati
6. L'utente seleziona le esperienze desiderate e procede
7. Il sistema mostra un riepilogo della registrazione con QR code
8. Il sistema invia un'email di conferma con i dettagli dei corsi ed esperienze

## Test

Per testare la nuova modalità di registrazione:

1. Avviare il server:
   ```bash
   node server.js
   ```

2. Accedere alla pagina di registrazione:
   ```
   http://localhost:[porta]/register?lang=it
   ```

3. Inserire un'email valida (presente in HubSpot)

4. Verificare che il sistema reindirizza alla pagina di conferma corsi

5. Confermare la partecipazione ai corsi e procedere

6. Verificare che il sistema mostra le esperienze disponibili in base ai corsi confermati

7. Selezionare le esperienze desiderate e procedere

8. Verificare che il sistema mostra un riepilogo della registrazione con QR code

9. Verificare che il sistema invia un'email di conferma con i dettagli dei corsi ed esperienze

## Integrazione con HubSpot

In produzione, sarà necessario:

1. Definire come recuperare i corsi da HubSpot (API, oggetti personalizzati, ecc.)
2. Determinare come memorizzare le conferme dei corsi e le selezioni delle esperienze in HubSpot
3. Aggiornare le proprietà del contatto o degli oggetti personalizzati in base alle selezioni dell'utente

## Ripristino

In caso di problemi, è possibile ripristinare i file originali:

```bash
# Ripristinare il file server.js
cp server.js.bak server.js

# Ripristinare i file email.ejs
cp views/it/email.ejs.bak views/it/email.ejs
cp views/en/email.ejs.bak views/en/email.ejs
```

## Note

- Attualmente, i corsi sono dati mock. In produzione, questi dati dovrebbero essere recuperati da HubSpot.
- Le esperienze disponibili dipendono dai corsi confermati. In produzione, questa relazione dovrebbe essere definita in HubSpot o nel database.
- Il QR code generato utilizza lo stesso formato del sistema esistente.