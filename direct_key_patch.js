/**
 * Script to patch courseExperienceService.js to support direct key format
 */
const fs = require('fs');
const path = require('path');

console.log('Patching courseExperienceService.js to support direct key format...');

// Read the original file
const filePath = path.join(__dirname, 'courseExperienceService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the section where the key is created
const searchPattern = /const key = `\${experience\.id}_\${slot\.id}`;/;
const replacementPattern = `// Extract the slot number from the slot ID (e.g., "1" from "imdp-e-medicina-chirurgia-mani-2-1")
                                                        const slotNumber = slot.id.split('-').pop();
                                                        
                                                        // Try different key formats
                                                        const directKey = \`\${slot.id.split('-').slice(0, -1).join('-')}:\${slotNumber}\`; // New direct format: experienceId:slotNumber
                                                        const key = \`\${experience.id}_\${slot.id}\`; // Original format: baseExperienceId_timeSlotId`;

// Replace the key creation section
content = content.replace(searchPattern, replacementPattern);

// Find the section where the reservation count is retrieved
const searchPattern2 = /const reservationCount = reservationCounts\[key\] \|\| 0;/;
const replacementPattern2 = `// Try the direct key format first, then fall back to the original format
                                                        const reservationCount = reservationCounts[directKey] !== undefined ? reservationCounts[directKey] : (reservationCounts[key] || 0);`;

// Replace the reservation count retrieval section
content = content.replace(searchPattern2, replacementPattern2);

// Find the section where the slot is logged
const searchPattern3 = /logger\.info\(`Slot \${key}: original=\${originalAvailable}, reservations=\${reservationCount}, available=\${slot\.available}\`\);/;
const replacementPattern3 = `logger.info(\`Slot \${directKey} (or \${key}): original=\${originalAvailable}, reservations=\${reservationCount}, available=\${slot.available}\`);`;

// Replace the logging section
content = content.replace(searchPattern3, replacementPattern3);

// Write the modified content back to the file
fs.writeFileSync(filePath, content);

console.log('Successfully patched courseExperienceService.js to support direct key format.');