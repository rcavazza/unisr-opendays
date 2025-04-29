import { ActivityDetails } from '../data/activities';

/**
 * Fetches experiences from the API based on contactID and language
 * @param contactID The ID of the contact
 * @param lang The language code (en/it)
 * @returns Promise with array of ActivityDetails
 */
export const fetchExperiences = async (contactID: string, lang: string): Promise<ActivityDetails[]> => {
  try {
    // Ensure we're using a simple language code (en or it)
    const simpleLang = lang.startsWith('en') ? 'en' : lang.startsWith('it') ? 'it' : 'en';
    
    // Add a cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    
    // Use the full URL including the backend server's port
    console.log('Making API request to:', `http://localhost:3000/api/get_experiences?contactID=${contactID}&lang=${simpleLang}&_=${timestamp}`);
    
    const response = await fetch(`http://localhost:3000/api/get_experiences?contactID=${contactID}&lang=${simpleLang}&_=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch experiences');
    }
    
    const data = await response.json();
    
    // Enhanced logging for debugging
    console.log('API response data:', data);
    
    // Log each experience and its time slots
    if (data && data.length > 0) {
      data.forEach((experience: ActivityDetails, index: number) => {
        console.log(`Experience ${index + 1}:`, experience);
        console.log(`- ID: ${experience.id}`);
        console.log(`- Title: ${experience.title}`);
        
        if (experience.timeSlots && experience.timeSlots.length > 0) {
          console.log(`- Time Slots (${experience.timeSlots.length}):`);
          experience.timeSlots.forEach((slot, slotIndex) => {
            console.log(`  - Slot ${slotIndex + 1}: ID=${slot.id}, Time=${slot.time}, Available=${slot.available}`);
          });
        } else {
          console.log('- No time slots found');
        }
      });
    } else {
      console.log('No experiences returned from API');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return [];
  }
};

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
): Promise<{ success: boolean, error?: string, errorCode?: string }> => {
  try {
    console.log('Making reservation:', { contactID, experienceId, timeSlotId });
    const response = await fetch('http://localhost:3000/api/reserve', {
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
    
    const data = await response.json();
    console.log('Reservation response:', data);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText, data);
      
      // Check if this is a "no spots available" error
      if (response.status === 409 && data.errorCode === 'NO_SPOTS_AVAILABLE') {
        return {
          success: false,
          error: data.error || 'No spots available',
          errorCode: 'NO_SPOTS_AVAILABLE'
        };
      }
      
      // For other errors
      return {
        success: false,
        error: data.error || 'Failed to make reservation'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error making reservation:', error);
    throw error;
  }
};

/**
 * Fetches the current state of all reservation counters
 * @returns Promise with the counter state
 */
export const fetchReservationCounters = async (): Promise<Record<string, number>> => {
  try {
    console.log('Fetching reservation counters');
    const response = await fetch('http://localhost:3000/api/reservation-counters');
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch reservation counters');
    }
    
    const data = await response.json();
    console.log('Reservation counters response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching reservation counters:', error);
    return {};
  }
};

/**
 * Updates the HubSpot contact with selected experiences
 * @param contactID The ID of the contact
 * @param experienceIds Array of selected experience IDs
 * @returns Promise with the update result
 */
export const updateSelectedExperiences = async (
  contactID: string,
  experienceIds: (string | number)[]
): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log('Updating selected experiences:', { contactID, experienceIds });
    
    // Log the request details
    const requestBody = {
      contactID,
      experienceIds
    };
    console.log('Request body:', JSON.stringify(requestBody));
    
    const response = await fetch('http://localhost:3000/api/update-selected-experiences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.json();
    console.log('Update response data:', data);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText, data);
      return {
        success: false,
        error: data.error || 'Failed to update selected experiences'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating selected experiences:', error);
    throw error;
  }
};