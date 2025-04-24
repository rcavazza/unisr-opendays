/**
 * Service for retrieving HubSpot custom objects related to experiences
 */

const axios = require('axios');
const logger = require('./logger');
require('dotenv').config();

/**
 * Gets all custom object types from HubSpot
 * @returns {Promise<Array<string>>} - Array of custom object type IDs
 */
async function getAllCustomObjectTypes() {
    try {
        logger.info("Retrieving all custom object types...");
        const response = await axios.get('https://api.hubapi.com/crm/v3/schemas');
        
        // Filter to get only custom objects (excluding standard objects like contact, company, deal)
        const customObjectTypes = response.data.results
            .filter(schema => schema.objectTypeId !== 'contact' && 
                             schema.objectTypeId !== 'company' && 
                             schema.objectTypeId !== 'deal' &&
                             schema.objectTypeId !== 'ticket' &&
                             schema.objectTypeId !== 'product')
            .map(schema => schema.objectTypeId);
        
        logger.info(`Found ${customObjectTypes.length} custom object types`);
        return customObjectTypes;
    } catch (error) {
        logger.error('Error retrieving custom object types:', error);
        return [];
    }
}

/**
 * Gets properties for a specific custom object type
 * @param {string} objectTypeId - The custom object type ID
 * @returns {Promise<Array<string>>} - Array of property names
 */
async function getCustomObjectProperties(objectTypeId) {
    try {
        logger.info(`Retrieving properties for custom object type: ${objectTypeId}`);
        const response = await axios.get(`https://api.hubapi.com/crm/v3/properties/${objectTypeId}`);
        
        // Extract property names
        const propertyNames = response.data.results.map(prop => prop.name);
        logger.info(`Found ${propertyNames.length} properties for type ${objectTypeId}`);
        
        return propertyNames;
    } catch (error) {
        logger.error(`Error retrieving properties for type ${objectTypeId}:`, error);
        // Return at least system properties
        return ['hs_object_id', 'hs_createdate', 'hs_lastmodifieddate'];
    }
}

/**
 * Gets all custom objects associated with a contact
 * @param {string} contactId - The HubSpot contact ID
 * @returns {Promise<Array<Object>|Object>} - Array of custom objects or error object
 */
async function getAllCustomObjects(contactId) {
    try {
        // Get the custom object type ID from the .env file
        const objectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID;
        
        if (!objectTypeId) {
            return { error: "HUBSPOT_CUSTOM_OBJECT_TYPE_ID is not defined in .env file" };
        }
        
        logger.info(`Retrieving custom objects of type ${objectTypeId} for contact ID: ${contactId}`);
        
        // Get properties for this custom object type
        const propertyNames = await getCustomObjectProperties(objectTypeId);
        
        // Find associations between the contact and this custom object type
        const associationsResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/${objectTypeId}`
        );
        
        const allCustomObjects = [];
        
        // If associations were found
        if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
            logger.info(`Found ${associationsResponse.data.results.length} associations for type ${objectTypeId}`);
            
            // For each associated custom object
            for (const association of associationsResponse.data.results) {
                const customObjectId = association.toObjectId;
                
                logger.info(`Retrieving details for custom object ID: ${customObjectId}`);
                
                // Create the properties parameter string
                const propertiesParam = propertyNames.join(',');
                
                // Get the custom object details with all properties
                const customObjectResponse = await axios.get(
                    `https://api.hubapi.com/crm/v3/objects/${objectTypeId}/${customObjectId}?properties=${propertiesParam}`
                );
                
                // Add to the results with ID and event name
                allCustomObjects.push({
                    id: customObjectId,
                    name: customObjectResponse.data.properties.evento_open_day || '',
                    ...customObjectResponse.data
                });
            }
        } else {
            logger.info(`No associations found for type ${objectTypeId}`);
        }
        
        return allCustomObjects;
    } catch (error) {
        logger.error('Error getting all custom objects:', error);
        return { error: `Error getting custom objects: ${error.message}` };
    }
}

module.exports = {
    getAllCustomObjectTypes,
    getCustomObjectProperties,
    getAllCustomObjects
};