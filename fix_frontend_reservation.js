/**
 * Script per modificare il comportamento del frontend per includere l'ID della riga (dbId)
 * nella richiesta di prenotazione.
 * 
 * Questo script deve essere incluso nella pagina HTML dopo il caricamento del frontend.
 */

(function() {
  console.log('Applying frontend reservation fix...');
  
  // Funzione per intercettare le richieste fetch
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Verifica se è una richiesta di prenotazione
    if (url.includes('/api/reserve') && options && options.method === 'POST') {
      try {
        // Ottieni il corpo della richiesta
        const body = JSON.parse(options.body);
        
        // Cerca lo slot selezionato nel localStorage
        const selectedExperiences = JSON.parse(localStorage.getItem('selectedExperiences') || '[]');
        
        // Trova l'esperienza corrispondente
        const experience = selectedExperiences.find(exp => exp.id === body.experienceId);
        
        // Se l'esperienza è stata trovata, cerca lo slot corrispondente
        if (experience && experience.timeSlots) {
          const slot = experience.timeSlots.find(slot => slot.id === body.timeSlotId);
          
          // Se lo slot è stato trovato e ha un dbId, aggiungilo alla richiesta
          if (slot && slot.dbId) {
            console.log(`Adding dbId ${slot.dbId} to reservation request for slot ${body.timeSlotId}`);
            body.dbId = slot.dbId;
            options.body = JSON.stringify(body);
          } else {
            console.warn(`Could not find dbId for slot ${body.timeSlotId}`);
          }
        }
      } catch (error) {
        console.error('Error intercepting reservation request:', error);
      }
    }
    
    // Continua con la richiesta originale
    return originalFetch(url, options);
  };
  
  // Funzione per intercettare le richieste XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    // Verifica se è una richiesta di prenotazione
    if (this._url.includes('/api/reserve') && this._method === 'POST' && body) {
      try {
        // Ottieni il corpo della richiesta
        const requestBody = JSON.parse(body);
        
        // Cerca lo slot selezionato nel localStorage
        const selectedExperiences = JSON.parse(localStorage.getItem('selectedExperiences') || '[]');
        
        // Trova l'esperienza corrispondente
        const experience = selectedExperiences.find(exp => exp.id === requestBody.experienceId);
        
        // Se l'esperienza è stata trovata, cerca lo slot corrispondente
        if (experience && experience.timeSlots) {
          const slot = experience.timeSlots.find(slot => slot.id === requestBody.timeSlotId);
          
          // Se lo slot è stato trovato e ha un dbId, aggiungilo alla richiesta
          if (slot && slot.dbId) {
            console.log(`Adding dbId ${slot.dbId} to reservation request for slot ${requestBody.timeSlotId}`);
            requestBody.dbId = slot.dbId;
            body = JSON.stringify(requestBody);
          } else {
            console.warn(`Could not find dbId for slot ${requestBody.timeSlotId}`);
          }
        }
      } catch (error) {
        console.error('Error intercepting reservation request:', error);
      }
    }
    
    // Continua con la richiesta originale
    return originalXHRSend.call(this, body);
  };
  
  // Funzione per salvare gli slot selezionati nel localStorage
  function saveSelectedExperiences() {
    // Verifica se la variabile window.app esiste
    if (window.app && window.app.experiences) {
      localStorage.setItem('selectedExperiences', JSON.stringify(window.app.experiences));
      console.log('Saved experiences to localStorage');
    }
  }
  
  // Aggiungi un listener per salvare gli slot selezionati quando vengono caricati
  document.addEventListener('DOMContentLoaded', function() {
    // Attendi che il frontend carichi i dati
    setTimeout(function() {
      saveSelectedExperiences();
      
      // Aggiungi un listener per salvare gli slot selezionati quando cambiano
      if (window.app && window.app.experiences) {
        // Crea un proxy per intercettare le modifiche all'array experiences
        const originalExperiences = window.app.experiences;
        window.app.experiences = new Proxy(originalExperiences, {
          set: function(target, property, value) {
            target[property] = value;
            saveSelectedExperiences();
            return true;
          }
        });
      }
    }, 2000); // Attendi 2 secondi per assicurarsi che il frontend abbia caricato i dati
  });
  
  console.log('Frontend reservation fix applied');
})();