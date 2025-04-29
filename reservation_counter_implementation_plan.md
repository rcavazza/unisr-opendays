# Reservation Counter Implementation Plan

## Overview

We need to implement a system to manage reservation counters for experience time slots. When a reservation is made from the `/front` endpoint, the counter for available slots should be decremented. When there are no more available slots, the button should be disabled and a message should be displayed. The counter state should persist after application reboot.

## Database Changes

### 1. Create a New Table for Reservations

We'll create a new table called `opend_reservations` to store reservation details:

```sql
CREATE TABLE IF NOT EXISTS opend_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id TEXT NOT NULL,
    experience_id TEXT NOT NULL,
    time_slot_id TEXT NOT NULL,
    qr_code_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

This table will store:
- `contact_id`: The HubSpot contact ID
- `experience_id`: The ID of the experience
- `time_slot_id`: The ID of the selected time slot
- `qr_code_url`: URL for the QR code (initially empty)
- `created_at`: Timestamp of when the reservation was made

## Backend Implementation

### 1. Modify the Experience Service

We need to update the `getExperiencesByCustomObjectIds` function in `courseExperienceService.js` to calculate the available slots based on the number of reservations:

1. Query the `opend_reservations` table to get the count of reservations for each time slot
2. Subtract this count from the maximum capacity to get the available slots
3. Return this information as part of the experience data

### 2. Create a Reservation Service

Create a new file `reservationService.js` to handle reservation operations:

```javascript
/**
 * Service for managing reservations
 */
const logger = require('./logger');

/**
 * Save a new reservation
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @param {string} experienceId - Experience ID
 * @param {string} timeSlotId - Time slot ID
 * @param {string} qrCodeUrl - QR code URL (optional)
 * @returns {Promise<boolean>} - Success status
 */
async function saveReservation(db, contactId, experienceId, timeSlotId, qrCodeUrl = null) {
    try {
        logger.info(`Saving reservation for contact ${contactId}, experience ${experienceId}, time slot ${timeSlotId}`);
        
        // Check if a reservation already exists for this contact and experience
        const existingReservation = await new Promise((resolve, reject) => {
            db.get(
                "SELECT id FROM opend_reservations WHERE contact_id = ? AND experience_id = ?",
                [contactId, experienceId],
                (err, row) => {
                    if (err) {
                        logger.error(`Error checking existing reservation: ${err.message}`);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
        
        if (existingReservation) {
            // Update existing reservation
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE opend_reservations SET time_slot_id = ?, qr_code_url = ?, created_at = CURRENT_TIMESTAMP WHERE contact_id = ? AND experience_id = ?",
                    [timeSlotId, qrCodeUrl, contactId, experienceId],
                    (err) => {
                        if (err) {
                            logger.error(`Error updating reservation: ${err.message}`);
                            reject(err);
                        } else {
                            logger.info(`Updated reservation for contact ${contactId}, experience ${experienceId}`);
                            resolve();
                        }
                    }
                );
            });
        } else {
            // Create new reservation
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO opend_reservations (contact_id, experience_id, time_slot_id, qr_code_url) VALUES (?, ?, ?, ?)",
                    [contactId, experienceId, timeSlotId, qrCodeUrl],
                    (err) => {
                        if (err) {
                            logger.error(`Error creating reservation: ${err.message}`);
                            reject(err);
                        } else {
                            logger.info(`Created reservation for contact ${contactId}, experience ${experienceId}`);
                            resolve();
                        }
                    }
                );
            });
        }
        
        return true;
    } catch (error) {
        logger.error(`Error in saveReservation: ${error.message}`);
        throw error;
    }
}

/**
 * Get reservations for a contact
 * @param {Object} db - Database instance
 * @param {string} contactId - Contact ID
 * @returns {Promise<Array>} - Array of reservations
 */
async function getReservationsForContact(db, contactId) {
    try {
        logger.info(`Getting reservations for contact ${contactId}`);
        
        return new Promise((resolve, reject) => {
            db.all(
                "SELECT * FROM opend_reservations WHERE contact_id = ?",
                [contactId],
                (err, rows) => {
                    if (err) {
                        logger.error(`Error getting reservations: ${err.message}`);
                        reject(err);
                    } else {
                        logger.info(`Found ${rows.length} reservations for contact ${contactId}`);
                        resolve(rows);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in getReservationsForContact: ${error.message}`);
        throw error;
    }
}

/**
 * Get reservation counts for all time slots
 * @param {Object} db - Database instance
 * @returns {Promise<Object>} - Object with time slot IDs as keys and counts as values
 */
async function getReservationCounts(db) {
    try {
        logger.info('Getting reservation counts for all time slots');
        
        return new Promise((resolve, reject) => {
            db.all(
                "SELECT experience_id, time_slot_id, COUNT(*) as count FROM opend_reservations GROUP BY experience_id, time_slot_id",
                [],
                (err, rows) => {
                    if (err) {
                        logger.error(`Error getting reservation counts: ${err.message}`);
                        reject(err);
                    } else {
                        const counts = {};
                        rows.forEach(row => {
                            const key = `${row.experience_id}_${row.time_slot_id}`;
                            counts[key] = row.count;
                        });
                        logger.info(`Found counts for ${rows.length} time slots`);
                        resolve(counts);
                    }
                }
            );
        });
    } catch (error) {
        logger.error(`Error in getReservationCounts: ${error.message}`);
        throw error;
    }
}

module.exports = {
    saveReservation,
    getReservationsForContact,
    getReservationCounts
};
```

### 3. Update the Course Experience Service

Modify the `getExperiencesByCustomObjectIds` function in `courseExperienceService.js` to include reservation counts:

```javascript
// Add this to the imports at the top
const reservationService = require('./reservationService');

// Inside the getExperiencesByCustomObjectIds function, before returning the results:
// Get reservation counts for all time slots
const reservationCounts = await reservationService.getReservationCounts(db);

// Update the available slots for each time slot based on reservation counts
experienceMap.forEach((experience) => {
    experience.timeSlots.forEach((slot) => {
        const key = `${experience.id}_${slot.id}`;
        const reservationCount = reservationCounts[key] || 0;
        // Calculate available slots (max - current)
        slot.available = Math.max(0, slot.available - reservationCount);
    });
});
```

### 4. Create an API Endpoint for Reservations

Add a new endpoint in `server.js` to handle reservations:

```javascript
// Add this to the imports at the top
const reservationService = require('./reservationService');

// Add this endpoint
app.post('/api/reserve', async (req, res) => {
    const { contactID, experienceId, timeSlotId } = req.body;
    
    if (!contactID || !experienceId || !timeSlotId) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }
    
    try {
        // Save the reservation
        await reservationService.saveReservation(db, contactID, experienceId, timeSlotId);
        
        // Return success
        res.json({
            success: true
        });
    } catch (error) {
        logger.error('Error in /api/reserve:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
```

### 5. Initialize the Database Table

Create a script to initialize the `opend_reservations` table:

```javascript
// create_reservation_table.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fcfs.sqlite');
const logger = require('./logger');

console.log('Creating opend_reservations table...');
logger.info('Creating opend_reservations table');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS opend_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        experience_id TEXT NOT NULL,
        time_slot_id TEXT NOT NULL,
        qr_code_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating opend_reservations table:', err.message);
            logger.error('Error creating opend_reservations table:', err);
        } else {
            console.log('opend_reservations table created successfully');
            logger.info('opend_reservations table created successfully');
        }
    });
});

setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            logger.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
            logger.info('Database connection closed');
        }
    });
}, 1000);
```

## Frontend Implementation

### 1. Update the Experience Service

Modify the `experienceService.ts` file to add a function for making reservations:

```typescript
/**
 * Makes a reservation for a specific experience and time slot
 * @param contactID The ID of the contact
 * @param experienceId The ID of the experience
 * @param timeSlotId The ID of the time slot
 * @returns Promise with the reservation result
 */
export const makeReservation = async (
    contactID: string,
    experienceId: string | number,
    timeSlotId: string
): Promise<{ success: boolean }> => {
    try {
        console.log('Making reservation:', { contactID, experienceId, timeSlotId });
        const response = await fetch(' /api/reserve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contactID,
                experienceId,
                timeSlotId
            })
        });
        
        if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText);
            throw new Error('Failed to make reservation');
        }
        
        const data = await response.json();
        console.log('Reservation response:', data);
        return data;
    } catch (error) {
        console.error('Error making reservation:', error);
        throw error;
    }
};
```

### 2. Update the OpenDayRegistration Component

Modify the `OpenDayRegistration.tsx` component to handle reservations:

1. Add a function to handle the reservation process
2. Update the UI to disable radio buttons and show messages for full slots

```typescript
// Add this import
import { makeReservation } from '../services/experienceService';

// Add these state variables
const [reservationStatus, setReservationStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
const [reservationError, setReservationError] = useState<string | null>(null);

// Add this function to handle reservations
const handleReservation = async (activityId: number | string, timeSlotId: string) => {
  if (!contactID) {
    setReservationError('Contact ID is required');
    return;
  }
  
  try {
    setReservationStatus(prev => ({ ...prev, [activityId]: 'pending' }));
    
    // Make the reservation
    const result = await makeReservation(contactID, activityId, timeSlotId);
    
    if (result.success) {
      setReservationStatus(prev => ({ ...prev, [activityId]: 'success' }));
      
      // Refresh the experiences data to get updated availability
      const updatedData = await fetchExperiences(contactID, i18n.language);
      setActivities(updatedData);
    } else {
      setReservationStatus(prev => ({ ...prev, [activityId]: 'error' }));
      setReservationError('Failed to make reservation');
    }
  } catch (error) {
    console.error('Error making reservation:', error);
    setReservationStatus(prev => ({ ...prev, [activityId]: 'error' }));
    setReservationError('An error occurred while making the reservation');
  }
};
```

### 3. Update the ActivityAccordion Component

Modify the `ActivityAccordion.tsx` component to handle disabled slots:

```typescript
// Update the props interface
interface ActivityAccordionProps {
  activity: ActivityDetails;
  isOpen: boolean;
  onClick: () => void;
  selectedSlot: string | null;
  onTimeSlotSelect: (activityId: number | string, timeSlotId: string) => void;
  overlappingSlots?: Record<string, boolean>;
  onReservation?: (activityId: number | string, timeSlotId: string) => void;
  reservationStatus?: Record<string, 'pending' | 'success' | 'error'>;
}

// Update the component to handle disabled slots
export const ActivityAccordion = ({
  activity,
  isOpen,
  onClick,
  selectedSlot,
  onTimeSlotSelect,
  overlappingSlots = {},
  onReservation,
  reservationStatus = {}
}: ActivityAccordionProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="border-b border-white/10">
      {/* ... existing code ... */}
      
      {isOpen && (
        <div className="px-6 py-4 bg-white/10">
          {/* ... existing code ... */}
          
          <div className="space-y-2">
            <h3 className="font-medium text-yellow-300">
              {t('availableTimeSlots')}:
            </h3>
            <div className="space-y-2">
              {activity.timeSlots.map(slot => {
                const isOverlapping = overlappingSlots[slot.id];
                const isFull = slot.available <= 0;
                const isDisabled = isOverlapping || isFull;
                
                return (
                  <div
                    key={slot.id}
                    className={`flex items-start space-x-3 p-2 rounded ${
                      isOverlapping ? 'bg-red-900/20' : 
                      isFull ? 'bg-gray-900/20' : 
                      'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`timeSlot-${activity.id}`}
                        value={slot.id}
                        checked={selectedSlot === slot.id}
                        onChange={() => onTimeSlotSelect(activity.id, slot.id)}
                        className="h-4 w-4 text-yellow-300 border-white/30"
                        disabled={isDisabled}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className={`text-white ${isDisabled ? 'opacity-50' : ''}`}>
                          {slot.endTime ? `${slot.time} - ${slot.endTime}` : slot.time}
                        </span>
                        {isOverlapping && (
                          <span className="ml-2 text-sm font-medium text-red-300 bg-red-900/30 px-2 py-0.5 rounded">
                            {t('alreadyBusy')}
                          </span>
                        )}
                        {isFull && !isOverlapping && (
                          <span className="ml-2 text-sm font-medium text-gray-300 bg-gray-900/30 px-2 py-0.5 rounded">
                            {t('noSpotsAvailable')}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-white/70">
                        ({t('spotsAvailable', { count: slot.available })})
                      </span>
                      
                      {selectedSlot === slot.id && onReservation && (
                        <div className="mt-2">
                          <button
                            onClick={() => onReservation(activity.id, slot.id)}
                            disabled={reservationStatus[activity.id] === 'pending'}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              reservationStatus[activity.id] === 'success' ? 'bg-green-600 text-white' :
                              reservationStatus[activity.id] === 'error' ? 'bg-red-600 text-white' :
                              reservationStatus[activity.id] === 'pending' ? 'bg-yellow-600 text-white cursor-wait' :
                              'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {reservationStatus[activity.id] === 'success' ? t('reserved') :
                             reservationStatus[activity.id] === 'error' ? t('tryAgain') :
                             reservationStatus[activity.id] === 'pending' ? t('reserving') :
                             t('reserve')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* ... existing code ... */}
        </div>
      )}
    </div>
  );
};
```

### 4. Update the Translation Files

Add new translation keys for the reservation-related messages:

```json
{
  "noSpotsAvailable": "No spots available",
  "reserve": "Reserve",
  "reserving": "Reserving...",
  "reserved": "Reserved",
  "tryAgain": "Try Again"
}
```

## Implementation Steps

1. **Database Setup**:
   - Create the `opend_reservations` table

2. **Backend Implementation**:
   - Create the `reservationService.js` file
   - Update the `courseExperienceService.js` file
   - Add the `/api/reserve` endpoint to `server.js`

3. **Frontend Implementation**:
   - Update the `experienceService.ts` file
   - Modify the `OpenDayRegistration.tsx` component
   - Update the `ActivityAccordion.tsx` component
   - Add new translation keys

4. **Testing**:
   - Test the reservation process
   - Verify that the counter decrements correctly
   - Check that the UI updates to show disabled slots
   - Verify that the counter state persists after application restart

## Conclusion

This implementation plan provides a comprehensive solution for managing reservation counters in the application. The system will:

1. Store reservations in a new `opend_reservations` table
2. Calculate available slots based on the maximum capacity and the number of reservations
3. Update the UI to disable slots when they are full
4. Persist the counter state in the database for resilience against application restarts
5. Provide an API endpoint to check the current state of all counters

The implementation leverages the existing `/api/get_experiences` endpoint to provide the counter information as part of the experience data, making it seamless to integrate with the current frontend.