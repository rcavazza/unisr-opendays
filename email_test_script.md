# Script di Test per l'Invio Email

Questo documento contiene uno script Node.js minimale per testare l'invio di email con diverse configurazioni. Lo script è progettato per isolare e risolvere i problemi di invio email riscontrati nell'applicazione principale.

## Istruzioni

1. Copia il codice seguente in un file chiamato `test_email_sending.js`
2. Assicurati che il file `.env` sia nella stessa directory o modifica il percorso nel codice
3. Esegui lo script con `node test_email_sending.js`
4. Prova diverse configurazioni decommentando/commentando le sezioni appropriate

## Codice dello Script

```javascript
/**
 * Script di test per l'invio di email con Nodemailer
 * Questo script testa diverse configurazioni per risolvere problemi di invio email
 */

// Carica le variabili d'ambiente
require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Funzione per il logging
function log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = data 
        ? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
        : `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    // Scrivi anche su file di log
    fs.appendFileSync('email_test.log', logMessage + '\n');
}

// Configura il destinatario di test
const TEST_RECIPIENT = process.env.TEST_EMAIL || 'your-test-email@example.com';

// Stampa le configurazioni SMTP caricate
log('Configurazione SMTP caricata', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    // Non loggare la password per sicurezza
    sendmail: process.env.SENDMAIL
});

// ===== CONFIGURAZIONE 1: Configurazione base (come nel server.js) =====
function createBasicTransporter() {
    log('Creazione trasportatore con configurazione base');
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// ===== CONFIGURAZIONE 2: Configurazione avanzata per Office 365 =====
function createOffice365Transporter() {
    log('Creazione trasportatore con configurazione Office 365 avanzata');
    
    return nodemailer.createTransport({
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
        debug: true
    });
}

// ===== CONFIGURAZIONE 3: Usa Ethereal per test =====
async function createEtherealTransporter() {
    log('Creazione trasportatore Ethereal per test');
    
    try {
        // Crea un account di test Ethereal
        const testAccount = await nodemailer.createTestAccount();
        log('Account Ethereal creato', {
            user: testAccount.user,
            server: testAccount.smtp.host
        });
        
        return nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } catch (error) {
        log('Errore nella creazione dell\'account Ethereal', error);
        throw error;
    }
}

// ===== CONFIGURAZIONE 4: Usa Gmail =====
function createGmailTransporter() {
    log('Creazione trasportatore Gmail');
    
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-gmail@gmail.com', // Sostituisci con il tuo indirizzo Gmail
            pass: 'your-app-password'     // Usa una "app password" generata nelle impostazioni di sicurezza
        }
    });
}

// Funzione per testare l'invio email con un trasportatore specifico
async function testEmailSending(transporter, name, fromAddress) {
    log(`Inizio test invio email con trasportatore: ${name}`);
    
    // Verifica la configurazione del trasportatore
    try {
        const verifyResult = await transporter.verify();
        log('Verifica trasportatore completata con successo', verifyResult);
    } catch (error) {
        log('Errore nella verifica del trasportatore', {
            message: error.message,
            stack: error.stack
        });
        return false;
    }
    
    // Prepara le opzioni email
    const mailOptions = {
        from: `"Test Email" <${fromAddress}>`,
        to: TEST_RECIPIENT,
        subject: `Test email da ${name} - ${new Date().toISOString()}`,
        text: `Questo è un test di invio email usando la configurazione: ${name}`,
        html: `
            <h1>Test di Invio Email</h1>
            <p>Questo è un test di invio email usando la configurazione: <strong>${name}</strong></p>
            <p>Timestamp: ${new Date().toISOString()}</p>
        `
    };
    
    log('Opzioni email preparate', mailOptions);
    
    // Invia l'email
    try {
        const info = await transporter.sendMail(mailOptions);
        log('Email inviata con successo', {
            messageId: info.messageId,
            response: info.response,
            previewUrl: nodemailer.getTestMessageUrl(info)
        });
        
        // Se è un'email Ethereal, mostra l'URL di anteprima
        if (name === 'Ethereal') {
            log('Anteprima email Ethereal disponibile a:', nodemailer.getTestMessageUrl(info));
        }
        
        return true;
    } catch (error) {
        log('Errore nell\'invio dell\'email', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command
        });
        return false;
    }
}

// Funzione principale che esegue tutti i test
async function runAllTests() {
    log('===== INIZIO DEI TEST DI INVIO EMAIL =====');
    
    // Test con configurazione base
    try {
        const basicTransporter = createBasicTransporter();
        await testEmailSending(basicTransporter, 'Configurazione Base', process.env.SMTP_USER);
    } catch (error) {
        log('Errore nel test con configurazione base', error);
    }
    
    // Test con configurazione Office 365 avanzata
    try {
        const office365Transporter = createOffice365Transporter();
        await testEmailSending(office365Transporter, 'Office 365 Avanzato', process.env.SMTP_USER);
    } catch (error) {
        log('Errore nel test con configurazione Office 365', error);
    }
    
    // Test con Ethereal
    try {
        const etherealTransporter = await createEtherealTransporter();
        await testEmailSending(etherealTransporter, 'Ethereal', 'test@ethereal.email');
    } catch (error) {
        log('Errore nel test con Ethereal', error);
    }
    
    // Test con Gmail (commentato per default)
    /*
    try {
        const gmailTransporter = createGmailTransporter();
        await testEmailSending(gmailTransporter, 'Gmail', 'your-gmail@gmail.com');
    } catch (error) {
        log('Errore nel test con Gmail', error);
    }
    */
    
    log('===== FINE DEI TEST DI INVIO EMAIL =====');
}

// Esegui i test
runAllTests().catch(error => {
    log('Errore nell\'esecuzione dei test', {
        message: error.message,
        stack: error.stack
    });
});
```

## Test con Indirizzo Mittente Corretto

Se vuoi testare specificamente il problema dell'incongruenza tra l'indirizzo mittente e l'utente SMTP, puoi modificare la funzione `testEmailSending` per testare diverse combinazioni:

```javascript
// Aggiungi questa funzione dopo runAllTests()
async function testFromAddressVariations() {
    log('===== TEST CON VARIAZIONI DELL\'INDIRIZZO MITTENTE =====');
    
    const transporter = createOffice365Transporter();
    
    // Test 1: Indirizzo mittente uguale all'utente SMTP
    await testEmailSending(
        transporter, 
        'Mittente = Utente SMTP', 
        process.env.SMTP_USER // info.unisr@hsr.it
    );
    
    // Test 2: Indirizzo mittente dal file .env
    await testEmailSending(
        transporter, 
        'Mittente da .env', 
        process.env.EMAIL_FROM_ADDRESS // invite@unisr.org
    );
    
    // Test 3: Indirizzo mittente usato nel codice
    await testEmailSending(
        transporter, 
        'Mittente dal codice', 
        'info.unisr@unisr.it'
    );
    
    log('===== FINE TEST VARIAZIONI INDIRIZZO MITTENTE =====');
}

// Chiama questa funzione dopo runAllTests()
// testFromAddressVariations().catch(error => {
//     log('Errore nei test di variazione indirizzo', error);
// });
```

## Interpretazione dei Risultati

Dopo aver eseguito lo script, controlla il file `email_test.log` per vedere i risultati dettagliati. Cerca:

1. Errori nella verifica del trasportatore
2. Errori specifici nell'invio delle email
3. Quale configurazione ha avuto successo

I problemi più comuni includono:

- **Errore di autenticazione**: Credenziali non valide o restrizioni dell'account
- **Errore di connessione**: Problemi di rete o configurazione del server
- **Errore di policy**: Restrizioni del server SMTP (SPF, DKIM, DMARC)
- **Errore di rate limiting**: Troppe richieste in poco tempo

## Soluzione Consigliata

Una volta identificata la configurazione funzionante, aggiorna il file `server.js` con la configurazione corretta del trasportatore e assicurati che gli indirizzi email siano coerenti in tutta l'applicazione.