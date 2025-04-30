# Confronto tra Implementazioni di Invio Email in server.js

## Riepilogo

Ho analizzato tutte le occorrenze di invio email nel file server.js per confrontare l'implementazione nell'endpoint `/api/update-selected-experiences` (che non funziona) con le altre implementazioni (che presumibilmente funzionano).

## 1. Configurazione del Trasportatore

Il trasportatore email viene configurato una sola volta all'inizio del file:

```javascript
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
```

Questa configurazione è utilizzata da tutti i punti di invio email nel file. **Non ci sono differenze nella configurazione del trasportatore** tra l'endpoint problematico e gli altri.

## 2. Confronto delle Implementazioni di Invio Email

### 2.1 Endpoint `/api/update-selected-experiences` (non funzionante)

```javascript
// Prepare mail options
const mailOptions = {
    from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
    to: recipientEmail,
    subject: language === 'en'
        ? `${contact.firstname}, your Open Day registration is confirmed`
        : `${contact.firstname}, la tua registrazione all'Open Day è confermata`,
    replyTo: 'info.unisr@unisr.it',
    html: htmlContent
};

// Send email
if (SENDMAIL == 1) {
    logger.info('Attempting to send email...');
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error('Error sending email:', error);
            logger.error('Error details:', error.stack);
            logger.error('Mail options that failed:', JSON.stringify(mailOptions, null, 2));
        } else {
            logger.info('Email sent successfully:', info.response);
            logger.info('Message ID:', info.messageId);
        }
    });
} else {
    logger.info('Email sending is disabled (SENDMAIL=0)');
}
```

### 2.2 Altre Implementazioni (funzionanti)

```javascript
const mailOptions = {
    from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`,
    to: thisemail,
    subject: language === 'en'
        ? `${contact.firstname}, come get your backpack`
        : `${contact.firstname}, vieni a ritirare il tuo zaino`,
    replyTo: 'info.unisr@unisr.it',
    html: htmlContent
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error);
        return res.render(`${language}/error`, {
            message: language === 'en'
                ? 'Error sending confirmation email. Please try again.'
                : 'Errore nell\'invio dell\'email di conferma. Riprova.',
            contactID: contactId
        });
    }
    console.log('Email sent:', info.response);
});
```

## 3. Differenze Chiave

| Aspetto | `/api/update-selected-experiences` | Altre Implementazioni |
|---------|-----------------------------------|----------------------|
| Verifica SENDMAIL | `if (SENDMAIL == 1)` | Non verificato |
| Logging | Utilizza `logger` | Alcune usano `console.log/error` |
| Gestione errori | Solo log, nessuna risposta HTTP | Alcune restituiscono risposta HTTP |
| Indirizzo mittente | `info.unisr@unisr.it` | `info.unisr@unisr.it` (identico) |
| Opzioni email | Identiche | Identiche |

## 4. Analisi delle Incongruenze

### 4.1 Incongruenze negli Indirizzi Email

In tutte le implementazioni, l'indirizzo mittente è impostato come:
```javascript
from: `UniSR – Università Vita Salute San Raffaele <info.unisr@unisr.it>`
```

Tuttavia, nel file `.env`:
- L'utente SMTP è `info.unisr@hsr.it` (dominio diverso)
- L'indirizzo mittente configurato è `invite@unisr.org` (non utilizzato nel codice)

Questa incongruenza è presente in tutte le implementazioni, quindi **non spiega perché alcune funzionano e altre no**.

### 4.2 Verifica di SENDMAIL

L'endpoint `/api/update-selected-experiences` verifica `SENDMAIL == 1` prima di inviare l'email, mentre le altre implementazioni non lo fanno. Questo potrebbe essere rilevante se:

1. Il valore di `SENDMAIL` cambia durante l'esecuzione
2. La variabile `SENDMAIL` viene letta in modo diverso (stringa vs numero)

Tuttavia, dal file `.env` vediamo che `SENDMAIL=1`, quindi questa verifica dovrebbe passare.

### 4.3 Differenze nel Contesto di Esecuzione

Le diverse implementazioni si trovano in contesti diversi:
- L'endpoint `/api/update-selected-experiences` è un endpoint API che restituisce JSON
- Alcune altre implementazioni sono in endpoint che renderizzano pagine HTML

Questo potrebbe influenzare il ciclo di vita della richiesta e la gestione degli errori, ma non dovrebbe influenzare l'invio email stesso.

## 5. Conclusioni e Raccomandazioni

Dato che la configurazione del trasportatore e le opzioni di invio email sono identiche in tutte le implementazioni, il problema probabilmente **non è nel codice di invio email stesso**.

Le possibili cause sono:

1. **Problema di timing o contesto**: L'endpoint `/api/update-selected-experiences` potrebbe completare la richiesta HTTP prima che la callback di invio email venga eseguita.

2. **Problema con il server SMTP**: Il server potrebbe rifiutare alcune email ma non altre, in base a:
   - Frequenza di invio (rate limiting)
   - Contenuto dell'email
   - Destinatari specifici

3. **Problema di configurazione Office 365**: Office 365 ha requisiti specifici che potrebbero non essere soddisfatti.

### Raccomandazioni:

1. **Uniformare gli indirizzi email**:
   ```javascript
   const mailOptions = {
       from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
       // resto del codice...
   };
   ```

2. **Aggiungere opzioni specifiche per Office 365**:
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
           ciphers: 'SSLv3'
       }
   });
   ```

3. **Verificare il trasportatore all'avvio**:
   ```javascript
   transporter.verify(function(error, success) {
       if (error) {
           console.error('Errore nella verifica del trasportatore email:', error);
       } else {
           console.log('Server pronto a inviare email');
       }
   });
   ```

4. **Utilizzare promesse invece di callback**:
   ```javascript
   try {
       const info = await transporter.sendMail(mailOptions);
       logger.info('Email sent successfully:', info.response);
   } catch (error) {
       logger.error('Error sending email:', error);
   }
   ```

5. **Testare con Ethereal Email**:
   ```javascript
   // Solo per ambiente di sviluppo
   if (process.env.NODE_ENV === 'development') {
       const testAccount = await nodemailer.createTestAccount();
       // Usa testAccount per inviare email di test
   }