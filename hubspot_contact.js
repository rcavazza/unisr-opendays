#!/usr/bin/env node

/**
 * HubSpot Contact Query Script
 * 
 * This script retrieves and displays all available properties for a HubSpot contact
 * using the contact ID provided as a command-line argument.
 * 
 * Usage: node hubspot_contact.js <contact_id>
 */

// Import required dependencies
require('dotenv').config();
const axios = require('axios');

// Get HubSpot API configuration from environment variables
const HUBSPOT_DEV = process.env.HUBSPOT_DEV;
const HUBSPOT_CUSTOM_OBJECT_TYPE_ID = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
let apiKey = "";

// Validate custom object type ID
if (!HUBSPOT_CUSTOM_OBJECT_TYPE_ID) {
    console.warn("Warning: HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in environment variables");
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
    console.log('Making request to:', request.url);
    return request;
});

/**
 * Function to fetch custom object associated with a contact
 */
async function getCustomObject(contactId) {
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
    const contactId = process.argv[2];
    
    // Validate contact ID
    if (!contactId) {
        console.error("Error: Contact ID is required");
        console.error("Usage: node hubspot_contact.js <contact_id>");
        process.exit(1);
    }
    
    try {
        console.log(`Fetching contact information for ID: ${contactId}...`);
        
        // Make the API request to HubSpot
        const response = await axios.get(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`);
        
        // Extract and display the contact data
        const contact = response.data;
        
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
        
        // Fetch and display custom object information
        if (HUBSPOT_CUSTOM_OBJECT_TYPE_ID) {
            console.log("\n=== CUSTOM OBJECT INFORMATION ===\n");
            
            const customObject = await getCustomObject(contactId);
            
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
        
        console.log("\n=== RAW RESPONSE ===\n");
        console.log(JSON.stringify(contact, null, 2));
        
    } catch (error) {
        console.error("\n=== ERROR ===\n");
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`Status: ${error.response.status}`);
            console.error(`Message: ${error.response.statusText}`);
            
            if (error.response.status === 404) {
                console.error(`Contact with ID ${contactId} not found.`);
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