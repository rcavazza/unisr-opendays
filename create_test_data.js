/**
 * Script to create test data for the reservation system
 */
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

// Connect to the database
const db = new sqlite3.Database("fcfs.sqlite", (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the database');
});

// Test contact ID
const contactId = '12345';

// Function to create test experiences
async function createTestExperiences() {
    return new Promise((resolve, reject) => {
        console.log('Creating test experiences...');
        
        // First, check if experiences already exist
        db.all("SELECT * FROM experiences WHERE language = 'en'", (err, rows) => {
            if (err) {
                console.error('Error checking experiences:', err.message);
                reject(err);
                return;
            }
            
            if (rows && rows.length > 0) {
                console.log(`Found ${rows.length} existing experiences, skipping creation`);
                resolve(rows);
                return;
            }
            
            // Create test experiences
            const experiences = [
                {
                    experience_id: 'exp1-1',
                    title: 'Laboratory Visit',
                    course: 'Medicina e Chirurgia 3',
                    location: 'Building A',
                    desc: 'Visit our research laboratory',
                    max_participants: 10,
                    current_participants: 0,
                    duration: '60 min',
                    ora_inizio: '10:00 AM',
                    ora_fine: '11:00 AM',
                    language: 'en',
                    course_type: '137482513655'
                },
                {
                    experience_id: 'exp1-2',
                    title: 'Laboratory Visit',
                    course: 'Medicina e Chirurgia 3',
                    location: 'Building A',
                    desc: 'Visit our research laboratory',
                    max_participants: 10,
                    current_participants: 0,
                    duration: '60 min',
                    ora_inizio: '11:30 AM',
                    ora_fine: '12:30 PM',
                    language: 'en',
                    course_type: '137482513655'
                },
                {
                    experience_id: 'exp2-1',
                    title: 'Dental Simulation',
                    course: 'Odontoiatria e Igiene Dentale',
                    location: 'Dental Clinic',
                    desc: 'Try our dental simulation equipment',
                    max_participants: 8,
                    current_participants: 0,
                    duration: '45 min',
                    ora_inizio: '10:00 AM',
                    ora_fine: '10:45 AM',
                    language: 'en',
                    course_type: '137482513654'
                },
                {
                    experience_id: 'exp2-2',
                    title: 'Dental Simulation',
                    course: 'Odontoiatria e Igiene Dentale',
                    location: 'Dental Clinic',
                    desc: 'Try our dental simulation equipment',
                    max_participants: 8,
                    current_participants: 0,
                    duration: '45 min',
                    ora_inizio: '11:00 AM',
                    ora_fine: '11:45 AM',
                    language: 'en',
                    course_type: '137482513654'
                }
            ];
            
            // Insert experiences
            const stmt = db.prepare(`
                INSERT INTO experiences (
                    experience_id, title, course, location, desc, 
                    max_participants, current_participants, duration, 
                    ora_inizio, ora_fine, language, course_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            experiences.forEach(exp => {
                stmt.run(
                    exp.experience_id, exp.title, exp.course, exp.location, exp.desc,
                    exp.max_participants, exp.current_participants, exp.duration,
                    exp.ora_inizio, exp.ora_fine, exp.language, exp.course_type,
                    function(err) {
                        if (err) {
                            console.error(`Error inserting experience ${exp.experience_id}:`, err.message);
                        } else {
                            console.log(`Inserted experience ${exp.experience_id}`);
                        }
                    }
                );
            });
            
            stmt.finalize(err => {
                if (err) {
                    console.error('Error finalizing statement:', err.message);
                    reject(err);
                } else {
                    console.log('All experiences inserted successfully');
                    resolve(experiences);
                }
            });
        });
    });
}

// Function to clear existing reservations
async function clearReservations() {
    return new Promise((resolve, reject) => {
        console.log('Clearing existing reservations...');
        
        db.run("DELETE FROM opend_reservations", function(err) {
            if (err) {
                console.error('Error clearing reservations:', err.message);
                reject(err);
            } else {
                console.log(`Deleted ${this.changes} reservations`);
                resolve();
            }
        });
    });
}

// Main function
async function main() {
    try {
        // Create test experiences
        await createTestExperiences();
        
        // Clear existing reservations
        await clearReservations();
        
        console.log('Test data created successfully');
    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

// Run the main function
main();