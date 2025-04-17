/**
 * Reservation Summary Script
 * 
 * This script reads reservation data from the fcfs.sqlite database and provides
 * a detailed breakdown of reserved spots and remaining spots for each day-location
 * combination, with the output printed to the terminal.
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file path
const DB_PATH = 'fcfs.sqlite';

// Reservation options file path
const OPTIONS_PATH = './reservationOptions.json';

/**
 * Main function to run the script
 */
async function main() {
  console.log('Reservation Summary Report');
  console.log('=========================\n');

  // Connect to the database
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error(`Error connecting to database: ${err.message}`);
      process.exit(1);
    }
    console.log(`Connected to database: ${DB_PATH}`);
  });

  try {
    // Load reservation options
    const reservationOptions = loadReservationOptions();
    const limits = reservationOptions.limits || {};

    // Get reservation counts from database
    const reservationCounts = await getReservationCounts(db);

    // Calculate summaries
    let summaries = calculateSummaries(reservationCounts, limits);
    
    // Filter out invalid entries
    summaries = filterValidEntries(summaries);

    // Display results
    displayResults(summaries);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      } else {
        console.log('\nDatabase connection closed');
      }
    });
  }
}

/**
 * Load reservation options from JSON file
 * @returns {Object} The parsed reservation options
 */
function loadReservationOptions() {
  try {
    const data = fs.readFileSync(OPTIONS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load reservation options: ${error.message}`);
  }
}

/**
 * Get reservation counts from database
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} Array of reservation counts by day and location
 */
function getReservationCounts(db) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT day, custom_object_location, COUNT(*) as reserved_count 
      FROM reservations 
      GROUP BY day, custom_object_location
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(new Error(`Database query failed: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Calculate summaries for each day-location combination
 * @param {Array} reservationCounts - Array of reservation counts
 * @param {Object} limits - Object containing limits for each day-location combination
 * @returns {Array} Array of summary objects
 */
function calculateSummaries(reservationCounts, limits) {
  const summaries = [];

  // First, create entries for all limits defined in reservationOptions
  for (const [key, limit] of Object.entries(limits)) {
    // Skip non-day-location keys (like the "909" key in the example)
    if (!key.includes('_')) continue;

    const [day, location] = key.split('_');
    
    summaries.push({
      day,
      location: location || '(Default)',
      limit,
      reserved: 0,
      remaining: limit,
      percentageUsed: 0
    });
  }

  // Then update with actual reservation counts
  for (const row of reservationCounts) {
    const location = row.custom_object_location || '';
    const day = row.day || '';
    const key = `${day}_${location}`;
    
    // Find the corresponding summary
    const summary = summaries.find(s => 
      s.day === day && (s.location === location || (s.location === '(Default)' && location === ''))
    );

    if (summary) {
      summary.reserved = row.reserved_count;
      summary.remaining = Math.max(0, summary.limit - summary.reserved);
      summary.percentageUsed = (summary.reserved / summary.limit * 100).toFixed(2);
    } else {
      // If we have reservations for a day-location not in the limits, add it
      const limit = limits[key] || limits[`${day}_`] || 0;
      
      summaries.push({
        day,
        location: location || '(Default)',
        limit,
        reserved: row.reserved_count,
        remaining: Math.max(0, limit - row.reserved_count),
        percentageUsed: limit ? (row.reserved_count / limit * 100).toFixed(2) : 'N/A'
      });
    }
  }

  // Sort by day and then by location
  return summaries.sort((a, b) => {
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    return a.location.localeCompare(b.location);
  });
}

/**
 * Display results in a formatted table
 * @param {Array} summaries - Array of summary objects
 */
function displayResults(summaries) {
  console.log('\nReservation Summary by Day and Location:');
  console.log('---------------------------------------\n');

  if (summaries.length === 0) {
    console.log('No reservation data found.');
    return;
  }

  // Use console.table for better formatting
  const tableData = summaries.map(s => ({
    'Day': s.day,
    'Location': s.location,
    'Total Limit': s.limit,
    'Reserved': s.reserved,
    'Remaining': s.remaining,
    '% Used': s.percentageUsed + '%'
  }));

  console.table(tableData);

  // Calculate totals
  const totalLimit = summaries.reduce((sum, s) => sum + s.limit, 0);
  const totalReserved = summaries.reduce((sum, s) => sum + s.reserved, 0);
  const totalRemaining = summaries.reduce((sum, s) => sum + s.remaining, 0);
  const overallPercentage = (totalReserved / totalLimit * 100).toFixed(2);

  console.log('\nTOTALS:');
  console.log(`Total Limit: ${totalLimit}`);
  console.log(`Total Reserved: ${totalReserved}`);
  console.log(`Total Remaining: ${totalRemaining}`);
  console.log(`Overall Usage: ${overallPercentage}%`);

}

/**
 * Filter out invalid or test data entries
 * @param {Array} summaries - Array of summary objects
 * @returns {Array} Filtered array of summary objects
 */
function filterValidEntries(summaries) {
  // Filter out entries with invalid dates (like 2025-03-07 which might be test data)
  const validDates = ['2025-04-07', '2025-04-08', '2025-04-09'];
  return summaries.filter(s => validDates.includes(s.day));
}

// Run the script
main();