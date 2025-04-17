const sqlite3 = require('sqlite3').verbose();

// Apri o crea il database
const db = new sqlite3.Database('coordinates.db');

// Crea una tabella con id, latitudine e longitudine
db.serialize(() => {
  // Creazione della tabella
  db.run(`
    CREATE TABLE IF NOT EXISTS Coordinates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL,
      long REAL
    )
  `);

  // Funzione per generare coordinate casuali
  function getRandomCoordinate(min, max) {
    return (Math.random() * (max - min) + min).toFixed(6); // 6 decimali di precisione
  }

  const insertStmt = db.prepare("INSERT INTO Coordinates (lat, long) VALUES (?, ?)");

  // Inserisci 100 righe con coordinate casuali
  for (let i = 0; i < 100; i++) {
    const lat = getRandomCoordinate(-90, 90); // Latitudine tra -90 e 90
    const long = getRandomCoordinate(-180, 180); // Longitudine tra -180 e 180
    insertStmt.run(lat, long);
  }

  insertStmt.finalize();
  
  console.log("100 righe inserite nel database");
});

// Chiudi il database
db.close();
