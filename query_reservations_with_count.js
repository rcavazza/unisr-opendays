/**
 * Script to extract all records from opend_reservations and count unique contact_ids
 */
const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// First, get all experiences to map IDs to names
db.all("SELECT id, title FROM experiences", (err, experiences) => {
  if (err) {
    console.error(`Error querying experiences: ${err.message}`);
    process.exit(1);
  }
  
  // Create a mapping of experience IDs to names
  const experienceNames = {};
  experiences.forEach(exp => {
    experienceNames[exp.id] = exp.title;
  });
  
  // Query reservations with unique contact_id count
  const query = `
    SELECT
        r.*,
        (SELECT COUNT(DISTINCT contact_id) FROM opend_reservations) AS unique_contact_count
    FROM
        opend_reservations r;
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error(`Error querying database: ${err.message}`);
      process.exit(1);
    }
    
    if (rows.length > 0) {
      console.log(`Found ${rows.length} total reservations`);
      
      // Print first few records as example
      console.log("\nSample records (first 5):");
      rows.slice(0, 5).forEach((row, i) => {
        console.log(`Reservation ${i+1}:`, row);
      });
      
      // Store the unique contact count
      const uniqueContactCount = rows[0].unique_contact_count;
      
      // Count reservations by experience_id
      const experienceCounts = {};
      rows.forEach(row => {
        const expId = row.experience_id;
        experienceCounts[expId] = (experienceCounts[expId] || 0) + 1;
      });
      
      // Close the database
      db.close((err) => {
        if (err) {
          console.error(`Error closing database: ${err.message}`);
        } else {
          console.log('\nDatabase connection closed');
          
          // Print a clear summary at the end
          console.log("\n==============================================");
          console.log(`TOTALE PRENOTAZIONI: ${rows.length}`);
          console.log(`TOTALE CONTACTID UNICI: ${uniqueContactCount}`);
          console.log("\nPRENOTAZIONI PER EXPERIENCE:");
          
          // Sort experience_ids numerically if possible
          const sortedExperienceIds = Object.keys(experienceCounts).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.localeCompare(b);
          });
          
          // Print counts by experience_id with names
          sortedExperienceIds.forEach(expId => {
            const expName = experienceNames[expId] || 'Nome non trovato';
            console.log(`  ${expName} (ID: ${expId}): ${experienceCounts[expId]} prenotazioni`);
          });
          
          console.log("==============================================");
        }
      });
  } else {
    console.log("No reservations found");
    
    // Close the database
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      } else {
        console.log('Database connection closed');
      }
    });
  }
});
});