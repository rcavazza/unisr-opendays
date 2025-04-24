#!/usr/bin/env node

/**
 * Script per la creazione delle tabelle necessarie per la nuova modalità di registrazione
 * che include corsi ed esperienze.
 * 
 * Questo script:
 * 1. Crea la tabella user_courses per i corsi confermati dall'utente
 * 2. Crea la tabella user_experiences per le esperienze selezionate dall'utente
 * 3. Crea la tabella experiences per le esperienze disponibili
 * 4. Crea la tabella course_experience_mapping per la relazione tra corsi ed esperienze
 * 5. Inserisce dati di esempio per test
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');
const logger = require('./logger');

console.log('Avvio creazione tabelle per corsi ed esperienze...');
logger.info('Avvio creazione tabelle per corsi ed esperienze');

db.serialize(() => {
    // Crea la tabella user_courses
    db.run(`CREATE TABLE IF NOT EXISTS user_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        course_id TEXT,
        course_title TEXT,
        course_date TEXT,
        course_location TEXT,
        confirmed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella user_courses:', err.message);
            logger.error('Errore nella creazione della tabella user_courses:', err);
        } else {
            console.log('Tabella user_courses creata con successo');
            logger.info('Tabella user_courses creata con successo');
        }
    });
    
    // Crea la tabella user_experiences
    db.run(`CREATE TABLE IF NOT EXISTS user_experiences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        experience_id TEXT,
        experience_title TEXT,
        experience_date TEXT,
        experience_location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella user_experiences:', err.message);
            logger.error('Errore nella creazione della tabella user_experiences:', err);
        } else {
            console.log('Tabella user_experiences creata con successo');
            logger.info('Tabella user_experiences creata con successo');
        }
    });
    
    // Crea la tabella experiences
    db.run(`CREATE TABLE IF NOT EXISTS experiences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experience_id TEXT UNIQUE,
        title TEXT,
        date TEXT,
        location TEXT,
        course_type TEXT,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella experiences:', err.message);
            logger.error('Errore nella creazione della tabella experiences:', err);
        } else {
            console.log('Tabella experiences creata con successo');
            logger.info('Tabella experiences creata con successo');
        }
    });
    
    // Crea la tabella course_experience_mapping
    db.run(`CREATE TABLE IF NOT EXISTS course_experience_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_type TEXT,
        experience_id TEXT,
        FOREIGN KEY (experience_id) REFERENCES experiences(experience_id)
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella course_experience_mapping:', err.message);
            logger.error('Errore nella creazione della tabella course_experience_mapping:', err);
        } else {
            console.log('Tabella course_experience_mapping creata con successo');
            logger.info('Tabella course_experience_mapping creata con successo');
        }
    });
    
    // Verifica se ci sono già dati nella tabella experiences
    db.get("SELECT COUNT(*) as count FROM experiences", (err, row) => {
        if (err) {
            console.error('Errore nel conteggio delle esperienze:', err.message);
            logger.error('Errore nel conteggio delle esperienze:', err);
            return;
        }
        
        // Se non ci sono dati, inserisci dati di esempio
        if (row.count === 0) {
            console.log('Inserimento dati di esempio per le esperienze...');
            logger.info('Inserimento dati di esempio per le esperienze');
            
            // Inserisci dati di esempio per le esperienze
            db.run(`INSERT INTO experiences 
                (experience_id, title, date, location, course_type, max_participants) VALUES 
                ('exp1', 'Visita Laboratorio Ricerca', '2025-05-12 09:00', 'Edificio A', 'course1', 20),
                ('exp2', 'Simulazione Chirurgica', '2025-05-12 11:00', 'Sala Operatoria Didattica', 'course1', 15),
                ('exp3', 'Analisi Microscopica', '2025-05-13 10:00', 'Laboratorio C', 'course2', 25)
            `, (err) => {
                if (err) {
                    console.error('Errore nell\'inserimento dei dati di esempio per le esperienze:', err.message);
                    logger.error('Errore nell\'inserimento dei dati di esempio per le esperienze:', err);
                } else {
                    console.log('Dati di esempio per le esperienze inseriti con successo');
                    logger.info('Dati di esempio per le esperienze inseriti con successo');
                }
            });
            
            // Verifica se ci sono già dati nella tabella course_experience_mapping
            db.get("SELECT COUNT(*) as count FROM course_experience_mapping", (err, row) => {
                if (err) {
                    console.error('Errore nel conteggio dei mapping corso-esperienza:', err.message);
                    logger.error('Errore nel conteggio dei mapping corso-esperienza:', err);
                    return;
                }
                
                // Se non ci sono dati, inserisci dati di esempio
                if (row.count === 0) {
                    console.log('Inserimento dati di esempio per il mapping corso-esperienza...');
                    logger.info('Inserimento dati di esempio per il mapping corso-esperienza');
                    
                    // Inserisci dati di esempio per il mapping corso-esperienza
                    db.run(`INSERT INTO course_experience_mapping 
                        (course_type, experience_id) VALUES 
                        ('course1', 'exp1'),
                        ('course1', 'exp2'),
                        ('course2', 'exp3')
                    `, (err) => {
                        if (err) {
                            console.error('Errore nell\'inserimento dei dati di esempio per il mapping corso-esperienza:', err.message);
                            logger.error('Errore nell\'inserimento dei dati di esempio per il mapping corso-esperienza:', err);
                        } else {
                            console.log('Dati di esempio per il mapping corso-esperienza inseriti con successo');
                            logger.info('Dati di esempio per il mapping corso-esperienza inseriti con successo');
                        }
                    });
                }
            });
        } else {
            console.log(`Trovate ${row.count} esperienze esistenti nel database. Nessun dato di esempio inserito.`);
            logger.info(`Trovate ${row.count} esperienze esistenti nel database. Nessun dato di esempio inserito.`);
        }
    });
});

// Chiudi la connessione al database dopo un breve ritardo per assicurarsi che tutte le operazioni siano completate
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Errore nella chiusura del database:', err.message);
            logger.error('Errore nella chiusura del database:', err);
        } else {
            console.log('Operazioni completate. Connessione al database chiusa.');
            logger.info('Operazioni completate. Connessione al database chiusa.');
        }
    });
}, 1000);