import { ActivityDetails } from '../data/activities';

/**
 * Fetches experiences from the API based on contactID and language
 * @param contactID The ID of the contact
 * @param lang The language code (en/it)
 * @returns Promise with experiences and matching course IDs
 */
export const fetchExperiences = async (contactID: string, lang: string): Promise<{
  experiences: ActivityDetails[];
  matchingCourseIds: string[];
}> => {
  try {
    // Ensure we're using a simple language code (en or it)
    const simpleLang = lang.startsWith('en') ? 'en' : lang.startsWith('it') ? 'it' : 'en';
    
    // Add a cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    
    // Use the full URL including the backend server's port
    console.log('Making API request to:', ` /api/get_experiences?contactID=${contactID}&lang=${simpleLang}&_=${timestamp}`);
    
    const response = await fetch(` /api/get_experiences?contactID=${contactID}&lang=${simpleLang}&_=${timestamp}`, {
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
    
    // Extract experiences from the response
    const experiences = data.experiences || [];
    
    // Log each experience and its time slots
    if (experiences && experiences.length > 0) {
      experiences.forEach((experience: ActivityDetails, index: number) => {
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
    
    return {
      experiences: experiences,
      matchingCourseIds: data.matchingCourseIds || []
    };
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return { experiences: [], matchingCourseIds: [] };
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
  timeSlotId: string,
  dbId?: number, // Aggiunto parametro dbId opzionale
  replaceAll: boolean = false
): Promise<{ success: boolean, error?: string, errorCode?: string }> => {
  try {
    console.log('Making reservation:', { contactID, experienceId, timeSlotId, dbId, replaceAll });
    
    // Log dettagliati per il debugging
    if (dbId) {
      console.log(`✅ Sending dbId ${dbId} to backend for slot ${timeSlotId}`);
    } else {
      console.warn(`⚠️ No dbId provided for slot ${timeSlotId}! This may cause incorrect participant counting.`);
    }
    const response = await fetch(' /api/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactID,
        experienceId,
        timeSlotId,
        dbId, // Incluso dbId nella richiesta
        replaceAll
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
    const response = await fetch(' /api/reservation-counters');
    
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
  experienceIds: (string | number)[],
  lang: string = 'en' // Add language parameter with default value
): Promise<{ success: boolean, error?: string }> => {
  try {
    // Ensure we're using a simple language code (en or it)
    const simpleLang = lang.startsWith('en') ? 'en' : lang.startsWith('it') ? 'it' : 'en';
    
    console.log('Updating selected experiences:', { contactID, experienceIds, language: simpleLang });
    
    // Log the request details
    const requestBody = {
      contactID,
      experienceIds
    };
    console.log('Request body:', JSON.stringify(requestBody));
    
    // Add language as a query parameter
    const response = await fetch(` /api/update-selected-experiences?lang=${simpleLang}`, {
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

/**
 * Fetches a QR code for a contact
 * @param contactID The ID of the contact
 * @returns Promise with the URL to the QR code
 */
export const fetchQRCode = async (contactID: string): Promise<string> => {
  try {
    console.log('Fetching QR code for contact:', contactID);
    
    // Add a cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    
    const response = await fetch(` /api/generate-qr/${contactID}?_=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch QR code');
    }
    
    const data = await response.json();
    console.log('QR code response:', data);
    return data.qrCodeUrl;
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return '/images/qr.png'; // Fallback to the static image
  }
};