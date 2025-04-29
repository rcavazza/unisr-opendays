/**
 * Database migration script to synchronize current_participants with actual reservation counts
 */
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

/**
 * Synchronize current_participants with actual reservation counts
 */
async function syncCurrentParticipants() {
    const db = new sqlite3.Database('fcfs.sqlite', (err) => {
        if (err) {
            logger.error(`Error opening database: ${err.message}`);
            process.exit(1);
        }
        logger.info('Connected to the database');
    });

    try {
        // Get all experiences
        const experiences = await new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id FROM experiences",
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });

        logger.info(`Found ${experiences.length} experiences to sync`);

        // For each experience, count reservations and update current_participants
        for (const exp of experiences) {
            const baseExperienceId = exp.experience_id.replace(/-\d+$/, '');
            
            // Count reservations for this experience
            const reservationCount = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT COUNT(*) as count FROM opend_reservations WHERE experience_id LIKE ?",
                    [`${baseExperienceId}%`],
                    (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row ? row.count : 0);
                        }
                    }
                );
            });

            // Update current_participants
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE experiences SET current_participants = ? WHERE experience_id = ?",
                    [reservationCount, exp.experience_id],
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            logger.info(`Updated ${exp.experience_id}: set current_participants to ${reservationCount}`);
                            resolve();
                        }
                    }
                );
            });
        }

        logger.info('Synchronization completed successfully');
    } catch (error) {
        logger.error(`Error during synchronization: ${error.message}`);
    } finally {
        db.close();
    }
}

// Run the synchronization
syncCurrentParticipants().then(() => {
    logger.info('Script completed');
}).catch(err => {
    logger.error(`Script failed: ${err.message}`);
});