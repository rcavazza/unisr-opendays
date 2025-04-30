# Analisi del Problema di Invio Email in `/api/update-selected-experiences`

## Problema Identificato
Dai log forniti, l'email sembra essere accettata dal sistema di invio ma non viene effettivamente consegnata al destinatario:

```
[2025-04-30T10:46:04.400Z] INFO: Email sent successfully:
[2025-04-30T10:46:04.401Z] INFO: Message ID:
```

Il Message ID vuoto è un segnale di allarme che indica che l'email potrebbe non essere stata effettivamente inviata, nonostante il log di successo.

## Analisi della Configurazione SMTP

Dopo aver esaminato il file `.env`, ho identificato diverse potenziali cause del problema:

### 1. Incongruenze negli indirizzi email e domini

| Configurazione | Valore nel file | Valore nel codice |
|----------------|-----------------|-------------------|
| Host SMTP | smtp.office365.com | - |
| Utente SMTP | info.unisr@hsr.it | - |
| Indirizzo mittente nel .env | invite@unisr.org | - |
| Indirizzo mittente nel codice | - | info.unisr@unisr.it |

Queste incongruenze sono problematiche perché:
- Office 365 generalmente richiede che l'indirizzo mittente corrisponda all'utente SMTP autenticato
- I domini sono diversi (hsr.it, unisr.org, unisr.it), il che può causare problemi di autenticazione

### 2. Configurazione SMTP non ottimale per Office 365

La configurazione attuale:
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

È corretta per l'uso di STARTTLS con Office 365, ma potrebbe richiedere configurazioni aggiuntive come:
- Impostazione esplicita di `requireTLS: true`
- Configurazione di `tls.ciphers` per soddisfare i requisiti di sicurezza di Office 365

### 3. Possibili problemi di autenticazione

Office 365 ha requisiti di autenticazione rigorosi:
- Potrebbe richiedere autenticazione moderna (OAuth2) invece delle password
- Potrebbe bloccare l'accesso da applicazioni "meno sicure"
- Potrebbe richiedere l'abilitazione esplicita dell'invio SMTP

## Piano di Risoluzione

### Fase 1: Correggere le incongruenze negli indirizzi email

1. Modificare il codice in `server.js` per utilizzare l'indirizzo mittente dal file `.env`:

```javascript
const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    // resto del codice...
};
```

2. Assicurarsi che l'indirizzo mittente corrisponda all'utente SMTP:
   - Opzione A: Modificare `EMAIL_FROM_ADDRESS=info.unisr@hsr.it` per corrispondere all'utente SMTP
   - Opzione B: Configurare Office 365 per consentire l'invio da indirizzi alternativi

### Fase 2: Migliorare la configurazione del trasportatore Nodemailer

Modificare la creazione del trasportatore in `server.js`:

```javascript
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    requireTLS: true,
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // Solo per debug, rimuovere in produzione
    },
    debug: true // Abilita il debug dettagliato, rimuovere in produzione
});

// Verifica la configurazione all'avvio del server
transporter.verify(function(error, success) {
    if (error) {
        console.error('Errore nella verifica del trasportatore email:', error);
    } else {
        console.log('Server pronto a inviare email');
    }
});
```

### Fase 3: Aggiungere log più dettagliati per il debug

Aggiungere log più dettagliati nell'invio email:

```javascript
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        logger.error('Errore nell\'invio dell\'email:', error);
        logger.error('Dettagli errore:', error.stack);
        logger.error('Opzioni email fallite:', JSON.stringify(mailOptions, null, 2));
        
        // Verifica lo stato del trasportatore dopo un errore
        transporter.verify(function(verifyError, success) {
            if (verifyError) {
                logger.error('Trasportatore non valido:', verifyError);
            } else {
                logger.info('Trasportatore valido nonostante l\'errore di invio');
            }
        });
    } else {
        logger.info('Email inviata con successo:', info.response);
        logger.info('Message ID:', info.messageId);
        logger.info('Anteprima URL:', nodemailer.getTestMessageUrl(info));
    }
});
```

### Fase 4: Verificare le impostazioni di Office 365

1. Verificare che l'account Office 365 abbia l'autenticazione SMTP abilitata
2. Controllare se è necessaria l'autenticazione a due fattori e, in tal caso, generare una "app password" specifica
3. Verificare che non ci siano restrizioni IP o di sicurezza che bloccano l'accesso SMTP

### Fase 5: Considerare alternative

Se i problemi persistono con Office 365:

1. **Utilizzare Ethereal Email per i test**:
   ```javascript
   // Solo per ambiente di sviluppo
   if (process.env.NODE_ENV === 'development') {
       nodemailer.createTestAccount((err, account) => {
           // Crea un account di test Ethereal
           let testTransporter = nodemailer.createTransport({
               host: account.smtp.host,
               port: account.smtp.port,
               secure: account.smtp.secure,
               auth: {
                   user: account.user,
                   pass: account.pass
               }
           });
           
           // Usa testTransporter invece di transporter
       });
   }
   ```

2. **Considerare un servizio email dedicato** come SendGrid, Mailgun o Amazon SES che potrebbero offrire migliore affidabilità e strumenti di debug.

## Conclusione

Il problema principale sembra essere legato a incongruenze nella configurazione SMTP e negli indirizzi email utilizzati. Seguendo questo piano di risoluzione, dovresti essere in grado di identificare e risolvere il problema di invio email.