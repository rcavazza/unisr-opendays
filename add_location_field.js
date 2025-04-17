#!/usr/bin/env node

/**
 * Script per aggiungere il campo location al database
 * 
 * Questo script verifica se la colonna custom_object_location esiste già nella tabella reservations
 * e la aggiunge se non esiste.
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');

console.log('Avvio aggiornamento database...');

// Verifica se la tabella reservations esiste
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'", (err, row) => {
  if (err) {
    console.error('Errore durante la verifica della tabella:', err.message);
    db.close();
    return;
  }

  if (!row) {
    console.log('La tabella reservations non esiste. Creazione della tabella...');
    
    // Crea la tabella reservations con la colonna custom_object_location
    db.run(`CREATE TABLE reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      day TEXT,
      custom_object_location TEXT
    )`, (err) => {
      if (err) {
        console.error('Errore durante la creazione della tabella:', err.message);
      } else {
        console.log('Tabella reservations creata con successo con la colonna custom_object_location');
      }
      db.close();
    });
    return;
  }

  // La tabella esiste, verifica se la colonna custom_object_location esiste
  db.all("PRAGMA table_info(reservations)", (err, rows) => {
    if (err) {
      console.error('Errore durante la verifica della struttura della tabella:', err.message);
      db.close();
      return;
    }

    // Verifica se la colonna esiste nei risultati
    const hasLocationColumn = rows.some(row => row.name === 'custom_object_location');
    
    if (hasLocationColumn) {
      console.log('La colonna custom_object_location esiste già. Nessuna modifica necessaria.');
      db.close();
      return;
    }
    
    // Aggiungi la colonna se non esiste
    db.run(`ALTER TABLE reservations ADD COLUMN custom_object_location TEXT`, (err) => {
      if (err) {
        console.error('Errore durante l\'aggiunta della colonna:', err.message);
      } else {
        console.log('Colonna custom_object_location aggiunta con successo alla tabella reservations');
      }
      db.close();
    });
  });
});