#!/usr/bin/env node

/**
 * HubSpot Contact Query Script
 * 
 * This script retrieves and displays all available properties for a HubSpot contact
 * and all custom objects associated with the contact using the contact ID provided 
 * as a command-line argument.
 * 
 * Usage: node hubspot_contact.js <contact_id> [options]
 * Options:
 *   --help     Show this help message
 *   --test     Run in test mode (no API calls)
 *   --verbose  Show detailed logging
 */

// Import required dependencies
require('dotenv').config();
const axios = require('axios');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    help: args.includes('--help'),
    test: args.includes('--test'),
    verbose: args.includes('--verbose')
};

// Show help if requested
if (options.help) {
    console.log(`
HubSpot Contact Query Script
----------------------------

This script retrieves and displays all available properties for a HubSpot contact
and all custom objects associated with the contact.

Usage: node hubspot_contact.js <contact_id> [options]

Options:
  --help     Show this help message
  --test     Run in test mode (no API calls)
  --verbose  Show detailed logging

Examples:
  node hubspot_contact.js 12345
  node hubspot_contact.js 12345 --verbose
  node hubspot_contact.js --test
    `);
    process.exit(0);
}

// Get HubSpot API configuration from environment variables
const HUBSPOT_DEV = process.env.HUBSPOT_DEV;
const HUBSPOT_CUSTOM_OBJECT_TYPE_ID = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
let apiKey = "";

// Validate custom object type ID
if (!HUBSPOT_CUSTOM_OBJECT_TYPE_ID) {
    console.warn("Warning: HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables");
    console.warn("The script will attempt to discover all custom object types automatically");
}

// Select the appropriate API key based on environment
if (HUBSPOT_DEV == 0) {
    apiKey = process.env.HUBSPOT_APIKEY_PROD;
    console.log("Using PRODUCTION HubSpot environment");
} else {
    apiKey = process.env.HUBSPOT_APIKEY_SAND;
    console.log("Using SANDBOX HubSpot environment");
}

// Configure axios with the authorization header
const apiHeader = "Bearer " + apiKey;
axios.defaults.headers.common['Authorization'] = apiHeader;

// Optional: Add request logging for debugging
axios.interceptors.request.use(request => {
    if (options.verbose) {
        console.log('Making request to:', request.url);
        console.log('Request headers:', JSON.stringify(request.headers, null, 2));
        if (request.data) {
            console.log('Request data:', JSON.stringify(request.data, null, 2));
        }
    } else {
        console.log('Making request to:', request.url);
    }
    return request;
});

// Add response logging for debugging
axios.interceptors.response.use(response => {
    if (options.verbose) {
        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));
        console.log('Response data preview:', JSON.stringify(response.data).substring(0, 200) + '...');
    }
    return response;
}, error => {
    if (options.verbose && error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    return Promise.reject(error);
});

/**
 * Recupera tutti i tipi di custom object disponibili nell'account HubSpot
 * @returns {Promise<Array<string>>} - Array di ID dei tipi di custom object
 */
async function getAllCustomObjectTypes() {
    if (options.test) {
        console.log("[TEST MODE] Simulazione recupero tipi di custom object");
        return ['p5824938_openday_registration', 'p5824938_test_object'];
    }
    
    try {
        console.log("Recupero di tutti i tipi di custom object...");
        const response = await axios.get('https://api.hubapi.com/crm/v3/schemas');
        
        if (options.verbose) {
            console.log("Schema response:", JSON.stringify(response.data, null, 2));
        }
        
        // Filtra per ottenere solo i custom object (escludendo gli oggetti standard come contact, company, deal)
        const customObjectTypes = response.data.results
            .filter(schema => schema.objectTypeId !== 'contact' && 
                             schema.objectTypeId !== 'company' && 
                             schema.objectTypeId !== 'deal' &&
                             schema.objectTypeId !== 'ticket' &&
                             schema.objectTypeId !== 'product')
            .map(schema => schema.objectTypeId);
        
        console.log(`Trovati ${customObjectTypes.length} tipi di custom object:`);
        customObjectTypes.forEach(type => console.log(` - ${type}`));
        
        return customObjectTypes;
    } catch (error) {
        console.error('Errore nel recupero dei tipi di custom object:', error.message);
        if (error.response) {
            console.error('Dettagli errore:', JSON.stringify(error.response.data, null, 2));
        }
        return [];
    }
}

/**
 * Recupera tutte le proprietà disponibili per un tipo di custom object
 * @param {string} objectTypeId - ID del tipo di custom object
 * @returns {Promise<Array<string>>} - Array di nomi delle proprietà
 */
async function getCustomObjectProperties(objectTypeId) {
    if (options.test) {
        console.log(`[TEST MODE] Simulazione recupero proprietà per il tipo ${objectTypeId}`);
        return ['location', 'data_ritiro', 'nome_evento', 'ritiro_avvenuto', 'custom_field1', 'custom_field2'];
    }
    
    try {
        console.log(`Recupero proprietà per il tipo di custom object: ${objectTypeId}`);
        const response = await axios.get(`https://api.hubapi.com/crm/v3/properties/${objectTypeId}`);
        
        if (options.verbose) {
            console.log(`Risposta proprietà per ${objectTypeId}:`, JSON.stringify(response.data, null, 2));
        }
        
        // Estrai i nomi delle proprietà
        const propertyNames = response.data.results.map(prop => prop.name);
        console.log(`Trovate ${propertyNames.length} proprietà per il tipo ${objectTypeId}`);
        
        return propertyNames;
    } catch (error) {
        console.error(`Errore nel recupero delle proprietà per il tipo ${objectTypeId}:`, error.message);
        if (error.response) {
            console.error('Dettagli errore:', JSON.stringify(error.response.data, null, 2));
        }
        // Restituisci almeno le proprietà di sistema
        return ['hs_object_id', 'hs_createdate', 'hs_lastmodifieddate'];
    }
}

/**
 * Recupera tutti i custom objects associati a un contatto
 * @param {string} contactId - ID del contatto HubSpot
 * @returns {Promise<Array<Object>|Object>} - Array di custom objects o oggetto errore
 */
async function getAllCustomObjects(contactId) {
    if (options.test) {
        console.log("[TEST MODE] Simulazione recupero custom objects");
        return [
            {
                type: 'p5824938_openday_registration',
                id: '12345',
                properties: {
                    location: 'Milano',
                    data_ritiro: '2025-05-10',
                    nome_evento: 'Open Day 2025',
                    ritiro_avvenuto: 'false',
                    custom_field1: 'Valore 1',
                    custom_field2: 'Valore 2'
                }
            },
            {
                type: 'p5824938_test_object',
                id: '67890',
                properties: {
                    test_property: 'Test Value',
                    created_date: '2025-04-01',
                    custom_field1: 'Valore A',
                    custom_field2: 'Valore B'
                }
            }
        ];
    }
    
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
                // Recupera tutte le proprietà disponibili per questo tipo di custom object
                const propertyNames = await getCustomObjectProperties(objectTypeId);
                
                // Trova le associazioni tra il contatto e questo tipo di custom object
                const associationsResponse = await axios.get(
                    `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${objectTypeId}`
                );
                
                if (options.verbose) {
                    console.log(`Risposta associazioni per ${objectTypeId}:`, JSON.stringify(associationsResponse.data, null, 2));
                }
                
                // Se sono state trovate associazioni
                if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
                    console.log(`Trovate ${associationsResponse.data.results.length} associazioni per il tipo ${objectTypeId}`);
                    
                    // Per ogni custom object associato
                    for (const association of associationsResponse.data.results) {
                        const customObjectId = association.toObjectId;
                        
                        console.log(`Recupero dettagli per custom object ID: ${customObjectId}`);
                        
                        // Crea la stringa delle proprietà da richiedere
                        const propertiesParam = propertyNames.join(',');
                        
                        // Recupera i dettagli del custom object con tutte le proprietà
                        const customObjectResponse = await axios.get(
                            `https://api.hubapi.com/crm/v3/objects/${objectTypeId}/${customObjectId}?properties=${propertiesParam}`
                        );
                        
                        if (options.verbose) {
                            console.log(`Risposta custom object ${customObjectId}:`, JSON.stringify(customObjectResponse.data, null, 2));
                        }
                        
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
                if (typeError.response) {
                    console.error('Dettagli errore:', JSON.stringify(typeError.response.data, null, 2));
                }
                // Continua con il prossimo tipo anche se c'è un errore
            }
        }
        
        return allCustomObjects;
    } catch (error) {
        console.error('Errore nel recupero dei custom objects:', error.message);
        if (error.response) {
            console.error('Dettagli errore:', JSON.stringify(error.response.data, null, 2));
        }
        return { error: `Errore nel recupero dei custom objects: ${error.message}` };
    }
}

/**
 * Funzione originale per retrocompatibilità - recupera solo il primo custom object di un tipo specifico
 */
async function getCustomObject(contactId) {
    if (options.test) {
        console.log("[TEST MODE] Simulazione recupero custom object originale");
        return {
            id: '12345',
            properties: {
                location: 'Milano',
                data_ritiro: '2025-05-10',
                nome_evento: 'Open Day 2025',
                ritiro_avvenuto: 'false'
            }
        };
    }
    
    if (!HUBSPOT_CUSTOM_OBJECT_TYPE_ID) {
        return { error: "HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables" };
    }
    
    try {
        // Find associations between the contact and custom object
        const associationsResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${HUBSPOT_CUSTOM_OBJECT_TYPE_ID}`
        );
        
        // Check if any associations were found
        if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
            // Get the first associated custom object
            const customObjectId = associationsResponse.data.results[0].toObjectId;
            
            // Fetch the custom object details
            const customObjectResponse = await axios.get(
                `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_CUSTOM_OBJECT_TYPE_ID}/${customObjectId}?properties=location,data_ritiro,nome_evento,ritiro_avvenuto`
            );
            
            return customObjectResponse.data;
        } else {
            return { error: "No custom object associated with this contact" };
        }
    } catch (error) {
        return { error: `Error fetching custom object: ${error.message}` };
    }
}

/**
 * Main function to fetch and display contact information
 */
async function getContactInfo() {
    // Get contact ID from command line arguments
    const contactId = args.filter(arg => !arg.startsWith('--'))[0];
    
    // Validate contact ID
    if (!contactId && !options.test) {
        console.error("Error: Contact ID is required");
        console.error("Usage: node hubspot_contact.js <contact_id> [options]");
        console.error("Try 'node hubspot_contact.js --help' for more information");
        process.exit(1);
    }
    
    // Use a test ID in test mode
    const effectiveContactId = options.test ? '12345' : contactId;
    
    try {
        console.log(`Fetching contact information for ID: ${effectiveContactId}...`);
        
        let contact;
        if (options.test) {
            console.log("[TEST MODE] Simulazione recupero contatto");
            contact = {
                id: effectiveContactId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                properties: {
                    email: 'test@example.com',
                    firstname: 'Test',
                    lastname: 'User',
                    phone: '+1234567890'
                }
            };
        } else {
            // Make the API request to HubSpot
            const response = await axios.get(`https://api.hubapi.com/crm/v3/objects/contacts/${effectiveContactId}`);
            contact = response.data;
        }
        
        // Extract and display the contact data
        console.log("\n=== CONTACT INFORMATION ===\n");
        console.log(`Contact ID: ${contact.id}`);
        console.log(`Created: ${new Date(contact.createdAt).toLocaleString()}`);
        console.log(`Updated: ${new Date(contact.updatedAt).toLocaleString()}`);
        
        console.log("\n=== PROPERTIES ===\n");
        
        // Get all properties and sort them alphabetically for better readability
        const properties = contact.properties;
        const sortedPropertyNames = Object.keys(properties).sort();
        
        // Display each property
        sortedPropertyNames.forEach(propName => {
            const value = properties[propName];
            if (value) {
                console.log(`${propName}: ${value}`);
            }
        });
        
        // Fetch and display all custom objects
        console.log("\n=== TUTTI I CUSTOM OBJECTS ===\n");
        const allCustomObjects = await getAllCustomObjects(effectiveContactId);
        
        if (allCustomObjects.error) {
            console.log(allCustomObjects.error);
        } else if (allCustomObjects.length === 0) {
            console.log("Nessun custom object associato a questo contatto");
        } else {
            console.log(`Trovati ${allCustomObjects.length} custom objects associati`);
            
            allCustomObjects.forEach((obj, index) => {
                console.log(`\n--- Custom Object #${index + 1} (${obj.type}) ---`);
                console.log(`ID: ${obj.id}`);
                if (obj.createdAt) console.log(`Creato: ${new Date(obj.createdAt).toLocaleString()}`);
                if (obj.updatedAt) console.log(`Aggiornato: ${new Date(obj.updatedAt).toLocaleString()}`);
                
                console.log("\nProprietà:");
                const properties = obj.properties || {};
                const sortedPropertyNames = Object.keys(properties).sort();
                
                if (sortedPropertyNames.length === 0) {
                    console.log("  Nessuna proprietà trovata");
                } else {
                    sortedPropertyNames.forEach(propName => {
                        const value = properties[propName];
                        if (value !== undefined && value !== null) {
                            console.log(`  ${propName}: ${value}`);
                        }
                    });
                }
            });
        }
        
        // For backward compatibility, also show the original custom object section if HUBSPOT_CUSTOM_OBJECT_TYPE_ID is defined
        if (HUBSPOT_CUSTOM_OBJECT_TYPE_ID) {
            console.log("\n=== CUSTOM OBJECT INFORMATION (LEGACY) ===\n");
            
            const customObject = await getCustomObject(effectiveContactId);
            
            if (customObject.error) {
                console.log(customObject.error);
            } else {
                const customObjectProperties = customObject.properties || {};
                
                // Display specific custom object fields
                console.log(`Location: ${customObjectProperties.location || 'N/A'}`);
                console.log(`Data Ritiro: ${customObjectProperties.data_ritiro || 'N/A'}`);
                console.log(`Nome Evento: ${customObjectProperties.nome_evento || 'N/A'}`);
                console.log(`Ritiro Avvenuto: ${customObjectProperties.ritiro_avvenuto || 'N/A'}`);
            }
        }
        
        if (!options.test) {
            console.log("\n=== RAW RESPONSE ===\n");
            console.log(JSON.stringify(contact, null, 2));
        }
        
    } catch (error) {
        console.error("\n=== ERROR ===\n");
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`Status: ${error.response.status}`);
            console.error(`Message: ${error.response.statusText}`);
            
            if (error.response.status === 404) {
                console.error(`Contact with ID ${effectiveContactId} not found.`);
            } else if (error.response.status === 401) {
                console.error("Authentication failed. Check your HubSpot API key.");
            }
            
            if (error.response.data) {
                console.error("\nResponse data:");
                console.error(JSON.stringify(error.response.data, null, 2));
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received from HubSpot API.");
            console.error("Check your internet connection or HubSpot service status.");
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error(`Error message: ${error.message}`);
        }
        
        process.exit(1);
    }
}

// Execute the main function
getContactInfo();