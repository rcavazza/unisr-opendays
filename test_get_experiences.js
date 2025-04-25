const http = require('http');

// Parametri della richiesta
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/get_experiences?contactID=109301483131&lang=it',
  method: 'GET'
};

// Effettua la richiesta
const req = http.request(options, (res) => {
  console.log(`Codice di stato: ${res.statusCode}`);
  
  let data = '';
  
  // Raccoglie i dati della risposta
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Quando la risposta è completa
  res.on('end', () => {
    try {
      // Parsa la risposta JSON
      const experiences = JSON.parse(data);
      
      console.log(`Numero di esperienze: ${experiences.length}`);
      
      // Stampa i dettagli di ogni esperienza
      experiences.forEach((exp, index) => {
        console.log(`\nEsperienza ${index + 1}:`);
        console.log(`ID: ${exp.id}`);
        console.log(`Titolo: ${exp.title}`);
        console.log(`Corso: ${exp.course}`);
        console.log(`Luogo: ${exp.location}`);
        console.log(`Durata: ${exp.duration}`);
        
        // Stampa i timeslots
        console.log(`Numero di timeslots: ${exp.timeSlots ? exp.timeSlots.length : 0}`);
        if (exp.timeSlots && exp.timeSlots.length > 0) {
          console.log('Timeslots:');
          exp.timeSlots.forEach((slot, i) => {
            console.log(`  ${i + 1}. ID: ${slot.id}, Orario: ${slot.time} - ${slot.endTime}, Posti disponibili: ${slot.available}`);
          });
        } else {
          console.log('Nessun timeslot disponibile');
        }
      });
    } catch (e) {
      console.error('Errore nel parsing della risposta JSON:', e.message);
      console.log('Risposta raw:', data);
    }
  });
});

// Gestisce gli errori della richiesta
req.on('error', (e) => {
  console.error(`Errore nella richiesta: ${e.message}`);
});

// Termina la richiesta
req.end();