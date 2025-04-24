#!/usr/bin/env node

/**
 * Script for importing experiences from CSV file into the database
 * 
 * This script:
 * 1. Reads the exp.csv file
 * 2. Parses each row
 * 3. Maps the CSV fields to the database fields
 * 4. Generates values for the missing fields
 * 5. Inserts the data into the database
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// Database connection
const db = new sqlite3.Database('fcfs.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    logger.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to the database');
  logger.info('Connected to the database');
});

// Function to calculate duration from start and end times
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return '';
  
  try {
    // Parse times (format: HH.MM or HH:MM)
    const startParts = startTime.replace(':', '.').split('.');
    const endParts = endTime.replace(':', '.').split('.');
    
    const startHour = parseInt(startParts[0], 10);
    const startMinute = parseInt(startParts[1] || 0, 10);
    const endHour = parseInt(endParts[0], 10);
    const endMinute = parseInt(endParts[1] || 0, 10);
    
    // Calculate total minutes
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    if (durationMinutes <= 0) return '';
    
    // Format as "X minuti" or "X ore Y minuti"
    if (durationMinutes < 60) {
      return `${durationMinutes} minuti`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      if (minutes === 0) {
        return `${hours} ore`;
      } else {
        return `${hours} ore ${minutes} minuti`;
      }
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    logger.error('Error calculating duration:', error);
    return '';
  }
}

// Function to generate a unique experience_id
function generateExperienceId(course, title, index) {
  // Create a slug from course and title
  const baseSlug = `${course || 'exp'}-${title || 'activity'}`.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .substring(0, 30);        // Limit length
  
  // Add index to make it unique
  return `${baseSlug}-${index}`;
}

// Function to clean empty values
function cleanValue(value) {
  if (value === undefined || value === null) return '';
  return value.trim();
}

// Main function to import experiences from CSV
async function importExperiencesFromCsv() {
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedRows = [];
  
  console.log('Starting import of experiences from CSV...');
  logger.info('Starting import of experiences from CSV');
  
  // Clean the experiences table before importing
  console.log('Cleaning experiences table...');
  logger.info('Cleaning experiences table');
  
  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM experiences', (err) => {
        if (err) {
          console.error('Error cleaning experiences table:', err.message);
          logger.error('Error cleaning experiences table:', err);
          reject(err);
        } else {
          console.log('Experiences table cleaned successfully');
          logger.info('Experiences table cleaned successfully');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Failed to clean experiences table:', error);
    logger.error('Failed to clean experiences table:', error);
    // Continue with import even if cleaning fails
  }
  
  // Create a promise to handle the CSV parsing
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'exp.csv'))
      .pipe(csv({
        separator: ',',
        headers: ['corso', 'nome', 'orario_inizio', 'orario_fine', 'posti_disponibili', 'location', 'descrizione']
      }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Read ${results.length} rows from CSV`);
        logger.info(`Read ${results.length} rows from CSV`);
        
        // Process each row
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          
          try {
            // Clean and map CSV fields to database fields
            const corso = cleanValue(row.corso);
            const nome = cleanValue(row.nome);
            const orarioInizio = cleanValue(row.orario_inizio);
            const orarioFine = cleanValue(row.orario_fine);
            const postiDisponibili = cleanValue(row.posti_disponibili);
            const location = cleanValue(row.location);
            const descrizione = cleanValue(row.descrizione);
            
            // Skip rows with empty title (nome)
            if (!nome && i > 0) {
              // If nome is empty but corso is not, use the corso from the previous row
              if (corso) {
                results[i].corso = corso;
              } else if (results[i-1] && results[i-1].corso) {
                results[i].corso = results[i-1].corso;
              }
              
              // Track skipped row
              skippedRows.push({
                rowNumber: i + 1,
                reason: 'Empty title (nome)',
                data: { ...row }
              });
              
              continue;
            }
            
            // Generate values for missing fields
            const experienceId = generateExperienceId(corso, nome, i + 1);
            const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
            const duration = calculateDuration(orarioInizio, orarioFine);
            const language = 'it'; // Default to Italian
            const courseType = corso || 'general'; // Use corso as course_type
            const maxParticipants = parseInt(postiDisponibili, 10) || 0;
            const currentParticipants = 0; // Default to 0
            
            // No duplicate check needed as we cleaned the table at the beginning
            
            // Insert into database
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO experiences 
                (experience_id, title, course, location, date, duration, desc, language, 
                course_type, max_participants, current_participants, ora_inizio, ora_fine) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  experienceId, nome, corso, location, date, duration, descrizione, language,
                  courseType, maxParticipants, currentParticipants, orarioInizio, orarioFine
                ],
                function(err) {
                  if (err) {
                    console.error(`Error inserting experience ${nome}:`, err.message);
                    logger.error(`Error inserting experience ${nome}:`, err);
                    errorCount++;
                    reject(err);
                  } else {
                    console.log(`Inserted experience: ${nome} (${corso})`);
                    logger.info(`Inserted experience: ${nome} (${corso})`);
                    successCount++;
                    resolve();
                  }
                }
              );
            }).catch(err => {
              console.error(`Error processing row ${i + 1}:`, err);
              logger.error(`Error processing row ${i + 1}:`, err);
              errorCount++;
            });
          } catch (error) {
            console.error(`Error processing row ${i + 1}:`, error);
            logger.error(`Error processing row ${i + 1}:`, error);
            errorCount++;
          }
        }
        
        // Log summary
        console.log('Import completed:');
        console.log(`- Total rows: ${results.length}`);
        console.log(`- Successfully imported: ${successCount}`);
        console.log(`- Skipped rows: ${skippedRows.length}`);
        console.log(`- Errors: ${errorCount}`);
        
        // Log details of skipped rows
        if (skippedRows.length > 0) {
          console.log('\nSkipped rows details:');
          skippedRows.forEach(skipped => {
            console.log(`- Row ${skipped.rowNumber}: ${skipped.reason}`);
            console.log(`  Data: ${JSON.stringify(skipped.data)}`);
          });
        }
        
        logger.info('Import completed:');
        logger.info(`- Total rows: ${results.length}`);
        logger.info(`- Successfully imported: ${successCount}`);
        logger.info(`- Skipped rows: ${skippedRows.length}`);
        logger.info(`- Errors: ${errorCount}`);
        
        // Log details of skipped rows to logger
        if (skippedRows.length > 0) {
          logger.info('Skipped rows details:');
          skippedRows.forEach(skipped => {
            logger.info(`- Row ${skipped.rowNumber}: ${skipped.reason}`);
            logger.info(`  Data: ${JSON.stringify(skipped.data)}`);
          });
        }
        
        // Close database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            logger.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            logger.info('Database connection closed');
            resolve({
              total: results.length,
              success: successCount,
              skipped: skippedRows,
              errors: errorCount
            });
          }
        });
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        logger.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Run the import function
importExperiencesFromCsv()
  .then((result) => {
    console.log('Import process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during import process:', error);
    process.exit(1);
  });