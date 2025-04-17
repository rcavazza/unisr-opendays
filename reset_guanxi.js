const axios = require('axios');
var apiKey = "";
require('dotenv').config();

apiKey = process.env.HUBSPOT_APIKEY_PROD;

const apiHeader = "Bearer " + apiKey;
axios.defaults.headers.common['Authorization'] = apiHeader;

// var contactID = 64317223271; guanxi_1
var contactID = 62162311806; // guanxi_2
axios.patch('https://api.hubapi.com/crm/v3/objects/contacts/' + contactID, {
    "properties": {
    	"cc_codice_descrittivo_corso_contatto": "10213"
    	// "posto_prenotato": 1000
    }
});

