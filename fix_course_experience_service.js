/**
 * Script to fix the courseExperienceService.js file to support direct key format
 */
const fs = require('fs');
const path = require('path');

console.log('Fixing courseExperienceService.js to support direct key format...');

// Read the original file
const filePath = path.join(__dirname, 'courseExperienceService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the section where the available slots are looked up
const searchPattern = /\/\/ Try different key formats[\s\S]*?const key1 = `\${experience\.id}_\${slot\.id}`[\s\S]*?const key2 = `\${slotExperienceId}_\${slot\.id}`;/;
const replacementPattern = `// Try different key formats
                                                        // Extract the slot number from the slot ID (e.g., "1" from "imdp-e-medicina-chirurgia-mani-2-1")
                                                        const slotNumber = slot.id.split('-').pop();
                                                        
                                                        const directKey = \`\${slotExperienceId}:\${slotNumber}\`; // New direct format: experienceId:slotNumber
                                                        const key1 = \`\${experience.id}_\${slot.id}\`; // Original format: baseExperienceId_timeSlotId
                                                        const key2 = \`\${slotExperienceId}_\${slot.id}\`; // Format used in slotCalculationService: experienceId_timeSlotId`;

// Replace the key formats section
content = content.replace(searchPattern, replacementPattern);

// Find the section where the available slots are assigned
const searchPattern2 = /\/\/ Try the new format first[\s\S]*?if \(availableSlots\[key2\] !== undefined\)[\s\S]*?slot\.available = availableSlots\[key2\];[\s\S]*?} else {[\s\S]*?slot\.available = availableSlots\[key1\] \|\| 0;/;
const replacementPattern2 = `// Try the direct key format first, then fall back to the other formats
                                                        if (availableSlots[directKey] !== undefined) {
                                                            slot.available = availableSlots[directKey];
                                                            logger.info(\`Found available slots using directKey: \${directKey} = \${slot.available}\`);
                                                        } else if (availableSlots[key2] !== undefined) {
                                                            slot.available = availableSlots[key2];
                                                            logger.info(\`Found available slots using key2: \${key2} = \${slot.available}\`);
                                                        } else {
                                                            slot.available = availableSlots[key1] || 0;`;

// Replace the available slots assignment section
content = content.replace(searchPattern2, replacementPattern2);

// Find the section where the slot is logged
const searchPattern3 = /logger\.info\(`Slot \${key2}: max=\${maxParticipants}, available=\${slot\.available}, reserved=\${slot\.reserved}\`\);/;
const replacementPattern3 = `logger.info(\`Slot \${directKey}: max=\${maxParticipants}, available=\${slot.available}, reserved=\${slot.reserved}\`);`;

// Replace the logging section
content = content.replace(searchPattern3, replacementPattern3);

// Write the modified content back to the file
fs.writeFileSync(filePath, content);

console.log('Successfully fixed courseExperienceService.js to support direct key format.');