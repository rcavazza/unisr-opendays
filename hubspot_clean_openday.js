#!/usr/bin/env node

/**
 * HubSpot Open Day Properties Cleaner
 * 
 * This script clears specific open day participation properties for a HubSpot contact
 * using the contact ID provided as a command-line argument.
 * 
 * Usage: node hubspot_clean_openday.js <contact_id> [options]
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
HubSpot Open Day Properties Cleaner
-----------------------------------

This script clears specific open day participation properties for a HubSpot contact.

Usage: node hubspot_clean_openday.js <contact_id> [options]

Options:
  --help     Show this help message
  --test     Run in test mode (no API calls)
  --verbose  Show detailed logging

Examples:
  node hubspot_clean_openday.js 12345
  node hubspot_clean_openday.js 12345 --verbose
  node hubspot_clean_openday.js --test
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
 * Main function to clear open day properties for a contact
 */
async function clearOpenDayProperties() {
    // Get contact ID from command line arguments
    const contactId = args.filter(arg => !arg.startsWith('--'))[0];
    
    // Validate contact ID
    if (!contactId && !options.test) {
        console.error("Error: Contact ID is required");
        console.error("Usage: node hubspot_clean_openday.js <contact_id> [options]");
        console.error("Try 'node hubspot_clean_openday.js --help' for more information");
        process.exit(1);
    }
    
    // Use a test ID in test mode
    const effectiveContactId = options.test ? '12345' : contactId;
    
    try {
        console.log(`Clearing open day properties for contact ID: ${effectiveContactId}...`);
        
        // Properties to clear
        const propertiesToClear = {
            open_day__conferma_partecipazione_corsi_08_05_2025: "",
            open_day__conferma_partecipazione_corsi_10_05_2025: "",
            open_day__conferma_partecipazione_esperienze: ""
        };
        
        if (options.test) {
            console.log("[TEST MODE] Simulating property clearing");
            console.log("Properties that would be cleared:");
            console.log(JSON.stringify(propertiesToClear, null, 2));
            console.log("No actual API calls made in test mode");
        } else {
            // Make the API request to update the contact properties
            const response = await axios.patch(
                `https://api.hubapi.com/crm/v3/objects/contacts/${effectiveContactId}`,
                {
                    properties: propertiesToClear
                }
            );
            
            console.log("\n=== SUCCESS ===\n");
            console.log(`Contact ID: ${effectiveContactId} updated successfully`);
            console.log(`Updated: ${new Date(response.data.updatedAt).toLocaleString()}`);
            
            console.log("\n=== CLEARED PROPERTIES ===\n");
            Object.keys(propertiesToClear).forEach(propName => {
                console.log(`${propName}: cleared`);
            });
            
            console.log("\n=== UPDATED CONTACT ===\n");
            console.log(`Contact ID: ${response.data.id}`);
            console.log(`Created: ${new Date(response.data.createdAt).toLocaleString()}`);
            console.log(`Updated: ${new Date(response.data.updatedAt).toLocaleString()}`);
            
            if (options.verbose) {
                console.log("\n=== RAW RESPONSE ===\n");
                console.log(JSON.stringify(response.data, null, 2));
            }
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
clearOpenDayProperties();