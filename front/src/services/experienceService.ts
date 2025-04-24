import { ActivityDetails } from '../data/activities';

/**
 * Fetches experiences from the API based on contactID and language
 * @param contactID The ID of the contact
 * @param lang The language code (en/it)
 * @returns Promise with array of ActivityDetails
 */
export const fetchExperiences = async (contactID: string, lang: string): Promise<ActivityDetails[]> => {
  try {
    // Use the full URL including the backend server's port
    const response = await fetch(`http://localhost:3000/api/get_experiences?contactID=${contactID}&lang=${lang}`);
    if (!response.ok) {
      throw new Error('Failed to fetch experiences');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return [];
  }
};