# Piano di Implementazione per hubspot_contact.js

## Obiettivo
Modificare lo script `hubspot_contact.js` per recuperare e visualizzare tutti i custom objects associati a un contatto HubSpot, insieme a tutte le loro proprietà.

## Modifiche Necessarie

### 1. Aggiungere una funzione per recuperare tutti i tipi di custom object disponibili

```javascript
/**
 * Recupera tutti i tipi di custom object disponibili nell'account HubSpot
 * @returns {Promise<Array<string>>} - Array di ID dei tipi di custom object
 */
async function getAllCustomObjectTypes() {
    try {
        console.log("Recupero di tutti i tipi di custom object...");
        const response = await axios.get('https://api.hubapi.com/crm/v3/schemas');
        
        // Filtra per ottenere solo i custom object (escludendo gli oggetti standard come contact, company, deal)
        const customObjectTypes = response.data.results
            .filter(schema => schema.objectTypeId !== 'contact' && 
                             schema.objectTypeId !== 'company' && 
                             schema.objectTypeId !== 'deal' &&
                             schema.objectTypeId !== 'ticket' &&
                             schema.objectTypeId !== 'product')
            .map(schema => schema.objectTypeId);
        
        console.log(`Trovati ${customObjectTypes.length} tipi di custom object`);
        return customObjectTypes;
    } catch (error) {
        console.error('Errore nel recupero dei tipi di custom object:', error.message);
        return [];
    }
}
```

### 2. Sostituire la funzione `getCustomObject` con una nuova funzione per recuperare tutti i custom objects

```javascript
/**
 * Recupera tutti i custom objects associati a un contatto
 * @param {string} contactId - ID del contatto HubSpot
 * @returns {Promise<Array<Object>|Object>} - Array di custom objects o oggetto errore
 */
async function getAllCustomObjects(contactId) {
    try {
        // Recupera tutti i tipi di custom object
        const customObjectTypes = await getAllCustomObjectTypes();
        
        if (customObjectTypes.length === 0) {
            return { error: "Nessun tipo di custom object trovato nell'account HubSpot" };
        }
        
        const allCustomObjects = [];
        
        // Per ogni tipo di custom object
        for (const objectTypeId of customObjectTypes) {
            console.log(`Controllo associazioni per il tipo di custom object: ${objectTypeId}`);
            
            try {
                // Trova le associazioni tra il contatto e questo tipo di custom object
                const associationsResponse = await axios.get(
                    `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${objectTypeId}`
                );
                
                // Se sono state trovate associazioni
                if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
                    console.log(`Trovate ${associationsResponse.data.results.length} associazioni per il tipo ${objectTypeId}`);
                    
                    // Per ogni custom object associato
                    for (const association of associationsResponse.data.results) {
                        const customObjectId = association.toObjectId;
                        
                        console.log(`Recupero dettagli per custom object ID: ${customObjectId}`);
                        
                        // Recupera i dettagli del custom object (tutte le proprietà)
                        const customObjectResponse = await axios.get(
                            `https://api.hubapi.com/crm/v3/objects/${objectTypeId}/${customObjectId}?properties=`
                        );
                        
                        // Aggiungi ai risultati con informazioni sul tipo
                        allCustomObjects.push({
                            type: objectTypeId,
                            ...customObjectResponse.data
                        });
                    }
                } else {
                    console.log(`Nessuna associazione trovata per il tipo ${objectTypeId}`);
                }
            } catch (typeError) {
                console.error(`Errore nel controllo delle associazioni per il tipo ${objectTypeId}:`, typeError.message);
                // Continua con il prossimo tipo anche se c'è un errore
            }
        }
        
        return allCustomObjects;
    } catch (error) {
        return { error: `Errore nel recupero dei custom objects: ${error.message}` };
    }
}
```

### 3. Aggiornare la funzione principale per visualizzare tutti i custom objects

```javascript
// Nella funzione getContactInfo()
console.log("\n=== TUTTI I CUSTOM OBJECTS ===\n");
const allCustomObjects = await getAllCustomObjects(contactId);

if (allCustomObjects.error) {
    console.log(allCustomObjects.error);
} else if (allCustomObjects.length === 0) {
    console.log("Nessun custom object associato a questo contatto");
} else {
    console.log(`Trovati ${allCustomObjects.length} custom objects associati`);
    
    allCustomObjects.forEach((obj, index) => {
        console.log(`\n--- Custom Object #${index + 1} (${obj.type}) ---`);
        console.log(`ID: ${obj.id}`);
        console.log(`Creato: ${new Date(obj.createdAt).toLocaleString()}`);
        console.log(`Aggiornato: ${new Date(obj.updatedAt).toLocaleString()}`);
        
        console.log("\nProprietà:");
        const properties = obj.properties;
        const sortedPropertyNames = Object.keys(properties).sort();
        
        sortedPropertyNames.forEach(propName => {
            const value = properties[propName];
            if (value) {
                console.log(`  ${propName}: ${value}`);
            }
        });
    });
}
```

## Implementazione Completa

Per implementare queste modifiche, è necessario:

1. Sostituire la funzione `getCustomObject` esistente con la nuova funzione `getAllCustomObjects`
2. Aggiungere la funzione `getAllCustomObjectTypes`
3. Aggiornare la funzione `getContactInfo` per utilizzare la nuova funzione `getAllCustomObjects` e visualizzare tutti i custom objects

Poiché siamo in modalità Architect, che può modificare solo file Markdown, sarà necessario passare alla modalità Code per implementare effettivamente queste modifiche nel file JavaScript.

## Prossimi Passi

1. Passare alla modalità Code
2. Implementare le modifiche descritte sopra nel file `hubspot_contact.js`
3. Testare lo script con un ID contatto valido per verificare che recuperi e visualizzi correttamente tutti i custom objects associati