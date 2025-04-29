#!/usr/bin/env node

/**
 * HubSpot Experiences Query Script
 * 
 * This script retrieves and displays the open day experiences registration and confirmation fields
 * for a HubSpot contact using the contact ID provided as a command-line argument.
 * 
 * Usage: node hubspot_experiences.js <contact_id> [options]
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
HubSpot Experiences Query Script
--------------------------------

This script retrieves and displays the open day experiences registration and confirmation fields
for a HubSpot contact.

Usage: node hubspot_experiences.js <contact_id> [options]

Options:
  --help     Show this help message
  --test     Run in test mode (no API calls)
  --verbose  Show detailed logging

Examples:
  node hubspot_experiences.js 12345
  node hubspot_experiences.js 12345 --verbose
  node hubspot_experiences.js --test
    `);
    process.exit(0);
}

// Get HubSpot API configuration from environment variables
const HUBSPOT_DEV = process.env.HUBSPOT_DEV;
let apiKey = "";

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
 * Main function to fetch and display contact experiences information
 */
async function getContactExperiencesInfo() {
    // Get contact ID from command line arguments
    const contactId = args.filter(arg => !arg.startsWith('--'))[0];
    
    // Validate contact ID
    if (!contactId && !options.test) {
        console.error("Error: Contact ID is required");
        console.error("Usage: node hubspot_experiences.js <contact_id> [options]");
        console.error("Try 'node hubspot_experiences.js --help' for more information");
        process.exit(1);
    }
    
    // Use a test ID in test mode
    const effectiveContactId = options.test ? '12345' : contactId;
    
    try {
        console.log(`Fetching experiences information for contact ID: ${effectiveContactId}...`);
        
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
                    phone: '+1234567890',
                    open_day__iscrizione_esperienze_10_05_2025: 'true',
                    open_day__conferma_partecipazione_esperienze_10_05: 'true'
                }
            };
        } else {
            // Make the API request to HubSpot with specific properties
            const response = await axios.get(
                `https://api.hubapi.com/crm/v3/objects/contacts/${effectiveContactId}?properties=email,firstname,lastname,open_day__iscrizione_esperienze_10_05_2025,open_day__conferma_partecipazione_esperienze_10_05`
            );
            contact = response.data;
        }
        
        // Extract and display the contact data
        console.log("\n=== CONTACT INFORMATION ===\n");
        console.log(`Contact ID: ${contact.id}`);
        console.log(`Name: ${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`);
        console.log(`Email: ${contact.properties.email || 'N/A'}`);
        
        console.log("\n=== OPEN DAY EXPERIENCES 10/05/2025 ===\n");
        
        // Check for the open_day__iscrizione_esperienze_10_05_2025 property
        if (contact.properties.open_day__iscrizione_esperienze_10_05_2025 !== undefined) {
            const iscrizione = contact.properties.open_day__iscrizione_esperienze_10_05_2025;
            console.log(`Iscrizione Esperienze: ${iscrizione}`);
            
            // Provide a more user-friendly interpretation
            if (iscrizione === 'true') {
                console.log("Stato: Iscritto alle esperienze dell'Open Day del 10/05/2025");
            } else {
                console.log("Stato: Non iscritto alle esperienze dell'Open Day del 10/05/2025");
            }
        } else {
            console.log("Iscrizione Esperienze: N/A (proprietà non trovata)");
        }
        
        // Check for the open_day__conferma_partecipazione_esperienze_10_05 property
        if (contact.properties.open_day__conferma_partecipazione_esperienze_10_05 !== undefined) {
            const conferma = contact.properties.open_day__conferma_partecipazione_esperienze_10_05;
            console.log(`Conferma Partecipazione: ${conferma}`);
            
            // Provide a more user-friendly interpretation
            if (conferma === 'true') {
                console.log("Stato: Partecipazione confermata alle esperienze dell'Open Day del 10/05/2025");
            } else {
                console.log("Stato: Partecipazione non confermata alle esperienze dell'Open Day del 10/05/2025");
            }
        } else {
            console.log("Conferma Partecipazione: N/A (proprietà non trovata)");
        }
        
        // Summary of participation status
        console.log("\n=== RIEPILOGO STATO ===\n");
        
        const iscritto = contact.properties.open_day__iscrizione_esperienze_10_05_2025 === 'true';
        const confermato = contact.properties.open_day__conferma_partecipazione_esperienze_10_05 === 'true';
        
        if (iscritto && confermato) {
            console.log("✅ Iscritto e confermato alle esperienze dell'Open Day del 10/05/2025");
        } else if (iscritto && !confermato) {
            console.log("⚠️ Iscritto ma non ha confermato la partecipazione alle esperienze dell'Open Day del 10/05/2025");
        } else if (!iscritto && confermato) {
            console.log("⚠️ Anomalia: Conferma presente ma iscrizione non trovata per le esperienze dell'Open Day del 10/05/2025");
        } else {
            console.log("❌ Non iscritto alle esperienze dell'Open Day del 10/05/2025");
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
getContactExperiencesInfo();