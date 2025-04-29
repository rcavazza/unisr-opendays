/**
 * Script to fix the slot calculation double-counting issue in courseExperienceService.js
 */
const fs = require('fs');
const path = require('path');

console.log('Patching courseExperienceService.js to fix slot calculation double-counting issue...');

// Read the original file
const filePath = path.join(__dirname, 'courseExperienceService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the section where the available slots are adjusted
const searchPattern = /slot\.available = Math\.max\(0, originalAvailable - reservationCount\);/;
const replacementPattern = `// Don't subtract reservation count as it's already accounted for in current_participants
                                                        slot.available = originalAvailable;`;

// Replace the available slots adjustment
content = content.replace(searchPattern, replacementPattern);

// Find the section where the slot is logged
const searchPattern2 = /logger\.info\(`Slot \${directKey} \(or \${key}\): original=\${originalAvailable}, reservations=\${reservationCount}, available=\${slot\.available}\`\);/;
const replacementPattern2 = `logger.info(\`Slot \${directKey} (or \${key}): available=\${slot.available}, reservations=\${reservationCount} (already accounted for in current_participants)\`);`;

// Replace the logging section
content = content.replace(searchPattern2, replacementPattern2);

// Write the modified content back to the file
fs.writeFileSync(filePath, content);

console.log('Successfully patched courseExperienceService.js to fix slot calculation double-counting issue.');