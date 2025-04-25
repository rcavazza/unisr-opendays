# Implementation Plan for hubspot_contact.js

## Objective
Modify the `hubspot_contact.js` script to explicitly check if a contact has the property `open_day__conferma_partecipazione_corsi_08_05_2025` and display its value if it exists.

## Current Behavior
Currently, the `hubspot_contact.js` script retrieves all properties of a HubSpot contact and displays them alphabetically in the "PROPERTIES" section. If the property `open_day__conferma_partecipazione_corsi_08_05_2025` exists, it would already be displayed along with all other properties.

## Proposed Modification
We'll add an explicit check for the property `open_day__conferma_partecipazione_corsi_08_05_2025` and display it in a more prominent way, in a dedicated section after the existing properties section.

## Implementation Steps

1. Locate the section in the `getContactInfo()` function where contact properties are displayed (around line 386).

2. After displaying all properties, add a new section specifically for the `open_day__conferma_partecipazione_corsi_08_05_2025` property.

3. Check if the property exists in the contact properties and display its value if it does.

## Code Changes

Here's the code we'll add after the existing properties section:

```javascript
// Check specifically for the open_day__conferma_partecipazione_corsi_08_05_2025 property
console.log("\n=== CONFERMA PARTECIPAZIONE CORSI OPEN DAY 08/05/2025 ===\n");
if (properties.open_day__conferma_partecipazione_corsi_08_05_2025) {
    console.log(`Conferma Partecipazione: ${properties.open_day__conferma_partecipazione_corsi_08_05_2025}`);
} else {
    console.log("Proprietà 'open_day__conferma_partecipazione_corsi_08_05_2025' non trovata per questo contatto.");
}
```

This code will:
1. Add a new section with a clear heading
2. Check if the property exists
3. Display the property value if it exists, or a message indicating it wasn't found

## Location in the File
The code will be added in the `getContactInfo()` function, after the existing properties section (around line 398) and before the custom objects section (around line 401).

## Test Plan
After implementing this change, we can test it by:
1. Running the script with a contact ID that has the property
2. Running the script with a contact ID that doesn't have the property
3. Verifying that the property value is displayed correctly in both cases

## Next Steps
1. Switch to Code mode to implement the changes
2. Test the modified script with different contact IDs
3. Verify that the property is correctly checked and displayed