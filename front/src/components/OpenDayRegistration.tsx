import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ActivityAccordion } from './ActivityAccordion';
import { ActivityDetails } from '../data/activities';
import { fetchExperiences, makeReservation, updateSelectedExperiences } from '../services/experienceService';
import { LoadingOverlay } from './LoadingOverlay';

export const OpenDayRegistration = () => {
  const { t, i18n } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  
  const [activities, setActivities] = useState<ActivityDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationStatus, setReservationStatus] = useState<Record<string | number, 'pending' | 'success' | 'error'>>({});
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Get contactID from URL query parameters
  const urlParams = new URLSearchParams(location.search);
  const contactID = urlParams.get('contactID') || '';
  
  // Check if contactID is present
  const [contactIdMissing, setContactIdMissing] = useState(false);
  
  useEffect(() => {
    if (!contactID) {
      setContactIdMissing(true);
      setLoading(false);
      return;
    }
    
    setContactIdMissing(false);
    
    const loadExperiences = async () => {
      try {
        setLoading(true);
        // Use the URL language parameter instead of i18n.language
        const language = lang || 'en';
        console.log('Fetching experiences for contactID:', contactID, 'language:', language);
        
        // Add a debug function to inspect the data before setting it
        const inspectExperienceData = (data: ActivityDetails[]) => {
          console.log('=== EXPERIENCE DATA INSPECTION ===');
          console.log(`Total experiences: ${data.length}`);
          
          // Check for any experiences with 0 available slots
          const zeroSlotExperiences = data.filter(exp =>
            exp.timeSlots.some(slot => slot.available === 0)
          );
          
          if (zeroSlotExperiences.length > 0) {
            console.log(`Found ${zeroSlotExperiences.length} experiences with zero available slots:`);
            zeroSlotExperiences.forEach(exp => {
              console.log(`- Experience ID: ${exp.id}, Title: ${exp.title}`);
              const zeroSlots = exp.timeSlots.filter(slot => slot.available === 0);
              zeroSlots.forEach(slot => {
                console.log(`  - Slot ID: ${slot.id}, Time: ${slot.time}, Available: ${slot.available}`);
              });
            });
          }
          
          // Check for any experiences with non-numeric available slots
          const nonNumericSlotExperiences = data.filter(exp =>
            exp.timeSlots.some(slot => typeof slot.available !== 'number')
          );
          
          if (nonNumericSlotExperiences.length > 0) {
            console.log(`Found ${nonNumericSlotExperiences.length} experiences with non-numeric available slots:`);
            nonNumericSlotExperiences.forEach(exp => {
              console.log(`- Experience ID: ${exp.id}, Title: ${exp.title}`);
              const nonNumericSlots = exp.timeSlots.filter(slot => typeof slot.available !== 'number');
              nonNumericSlots.forEach(slot => {
                console.log(`  - Slot ID: ${slot.id}, Time: ${slot.time}, Available: ${slot.available}, Type: ${typeof slot.available}`);
              });
            });
          }
          
          // Check for any experiences with string available slots that could be parsed as numbers
          const stringSlotExperiences = data.filter(exp =>
            exp.timeSlots.some(slot => typeof slot.available === 'string')
          );
          
          if (stringSlotExperiences.length > 0) {
            console.log(`Found ${stringSlotExperiences.length} experiences with string available slots:`);
            stringSlotExperiences.forEach(exp => {
              console.log(`- Experience ID: ${exp.id}, Title: ${exp.title}`);
              const stringSlots = exp.timeSlots.filter(slot => typeof slot.available === 'string');
              stringSlots.forEach(slot => {
                console.log(`  - Slot ID: ${slot.id}, Time: ${slot.time}, Available: ${slot.available}, Type: ${typeof slot.available}`);
                // Try to parse as number
                const parsedValue = parseInt(String(slot.available), 10);
                console.log(`  - Parsed value: ${parsedValue}, isNaN: ${isNaN(parsedValue)}`);
              });
            });
          }
          
          // Check for any pre-selected slots
          const preSelectedExperiences = data.filter(exp =>
            exp.timeSlots.some(slot => slot.selected)
          );
          
          if (preSelectedExperiences.length > 0) {
            console.log(`Found ${preSelectedExperiences.length} experiences with pre-selected slots:`);
            preSelectedExperiences.forEach(exp => {
              console.log(`- Experience ID: ${exp.id}, Title: ${exp.title}`);
              const selectedSlots = exp.timeSlots.filter(slot => slot.selected);
              selectedSlots.forEach(slot => {
                console.log(`  - Slot ID: ${slot.id}, Time: ${slot.time}, Selected: ${slot.selected}`);
              });
            });
          }
          
          console.log('=== END INSPECTION ===');
          return data;
        };
        
        const data = await fetchExperiences(contactID, language);
        
        // Inspect the data
        const inspectedData = inspectExperienceData(data);
        
        // Fix any string available slots by converting them to numbers
        // Make sure to preserve the selected flag
        const fixedData = inspectedData.map(exp => ({
          ...exp,
          timeSlots: exp.timeSlots.map(slot => ({
            ...slot,
            available: typeof slot.available === 'string'
              ? parseInt(String(slot.available), 10)
              : slot.available,
            selected: slot.selected || false // Ensure selected flag is preserved
          }))
        }));
        
        console.log('Fixed data:', fixedData);
        setActivities(fixedData);
        
        // Initialize selectedTimeSlots with pre-selected slots from the API
        const initialSelectedSlots: Record<string | number, string> = {};
        fixedData.forEach(activity => {
          activity.timeSlots.forEach(slot => {
            if (slot.selected) {
              console.log(`Found pre-selected slot: Activity ${activity.id}, Slot ${slot.id}`);
              initialSelectedSlots[activity.id] = slot.id;
            }
          });
        });
        
        console.log('Initial selected slots:', initialSelectedSlots);
        
        // Only update selectedTimeSlots if there are pre-selected slots
        if (Object.keys(initialSelectedSlots).length > 0) {
          setSelectedTimeSlots(initialSelectedSlots);
          
          // Calculate overlapping slots based on initial selections
          const initialOverlappingSlots = checkTimeSlotOverlaps(initialSelectedSlots, fixedData);
          setOverlappingSlots(initialOverlappingSlots);
          console.log('Initial overlapping slots:', initialOverlappingSlots);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load experiences');
        console.error('Error loading experiences:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadExperiences();
  }, [contactID, lang]); // Only depend on contactID and lang
  
  const [openAccordion, setOpenAccordion] = useState<number | string | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Record<string | number, string>>({});
  const [overlappingSlots, setOverlappingSlots] = useState<Record<string, boolean>>({});
  
  // Helper function to parse time string to minutes
  const parseTimeToMinutes = (timeStr: string): number => {
    console.log(`Parsing time: ${timeStr}`);
    
    // Handle empty time strings
    if (!timeStr || timeStr.trim() === '') {
      console.warn('Empty time string provided');
      return 0;
    }
    
    try {
      // Normalize the time string format
      let normalizedTime = timeStr.trim().toLowerCase();
      
      // Check if it's in 12-hour format with AM/PM
      const isPM = normalizedTime.includes('pm');
      const isAM = normalizedTime.includes('am');
      
      // Remove AM/PM indicators
      normalizedTime = normalizedTime.replace(/\s*(am|pm)\s*$/i, '');
      
      // Replace dots with colons for consistent parsing
      normalizedTime = normalizedTime.replace('.', ':');
      
      // Split hours and minutes
      let hours = 0;
      let minutes = 0;
      
      if (normalizedTime.includes(':')) {
        const [hoursStr, minutesStr] = normalizedTime.split(':');
        hours = parseInt(hoursStr, 10);
        minutes = parseInt(minutesStr, 10);
      } else {
        // If only hours are provided
        hours = parseInt(normalizedTime, 10);
        minutes = 0;
      }
      
      // Adjust for 12-hour format
      if (isPM && hours < 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }
      
      const totalMinutes = hours * 60 + minutes;
      console.log(`Parsed ${timeStr} to ${totalMinutes} minutes (${hours}h ${minutes}m)`);
      return totalMinutes;
    } catch (error) {
      console.error(`Error parsing time ${timeStr}:`, error);
      return 0;
    }
  };
  
  // Function to check for time slot overlaps
  const checkTimeSlotOverlaps = (selectedSlots: Record<string | number, string>, activitiesData = activities) => {
    console.log('Checking for overlapping slots with selected slots:', selectedSlots);
    const overlaps: Record<string, boolean> = {};
    
    // If no slots are selected, return empty overlaps
    if (Object.keys(selectedSlots).length === 0) {
      console.log('No slots selected, returning empty overlaps');
      return overlaps;
    }
    
    // If no activities data, return empty overlaps
    if (!activitiesData || activitiesData.length === 0) {
      console.log('No activities data available, returning empty overlaps');
      return overlaps;
    }
    
    // For each selected slot
    Object.entries(selectedSlots).forEach(([activityId, slotId]) => {
      console.log(`Processing selected slot: Activity ${activityId}, Slot ${slotId}`);
      
      // Try to find the activity by ID (could be string or number)
      const activity = activitiesData.find(a => {
        // Compare as strings to be safe
        return String(a.id) === String(activityId);
      });
      
      if (!activity) {
        console.warn(`Activity ${activityId} not found`);
        return;
      }
      
      const selectedSlot = activity.timeSlots.find(s => s.id === slotId);
      if (!selectedSlot) {
        console.warn(`Slot ${slotId} not found in activity ${activityId}`);
        return;
      }
      
      console.log(`Selected slot details:`, selectedSlot);
      
      // Parse the selected slot's time range
      const selectedStartMinutes = parseTimeToMinutes(selectedSlot.time);
      const selectedEndMinutes = selectedSlot.endTime
        ? parseTimeToMinutes(selectedSlot.endTime)
        : selectedStartMinutes + 60; // Default to 1 hour if no end time
      
      console.log(`Selected slot time range: ${selectedStartMinutes} - ${selectedEndMinutes} minutes`);
      
      // Check all other activities for overlaps
      activitiesData.forEach(otherActivity => {
        // Compare as strings to be safe
        if (String(otherActivity.id) !== String(activityId)) {
          console.log(`Checking activity ${otherActivity.id} for overlaps`);
          
          otherActivity.timeSlots.forEach(otherSlot => {
            console.log(`Checking slot ${otherSlot.id} in activity ${otherActivity.id}`);
            
            // Parse the other slot's time range
            const otherStartMinutes = parseTimeToMinutes(otherSlot.time);
            const otherEndMinutes = otherSlot.endTime
              ? parseTimeToMinutes(otherSlot.endTime)
              : otherStartMinutes + 60; // Default to 1 hour if no end time
            
            console.log(`Other slot time range: ${otherStartMinutes} - ${otherEndMinutes} minutes`);
            
            // Check if the slots overlap
            const isOverlapping =
              (otherStartMinutes >= selectedStartMinutes && otherStartMinutes < selectedEndMinutes) || // Other slot starts during selected slot
              (otherEndMinutes > selectedStartMinutes && otherEndMinutes <= selectedEndMinutes) || // Other slot ends during selected slot
              (otherStartMinutes <= selectedStartMinutes && otherEndMinutes >= selectedEndMinutes); // Other slot contains selected slot
            
            console.log(`Overlap check result for ${otherSlot.id}: ${isOverlapping}`);
            
            if (isOverlapping) {
              console.log(`Marking slot ${otherSlot.id} as overlapping`);
              overlaps[otherSlot.id] = true;
            }
          });
        }
      });
    });
    
    console.log('Final overlapping slots:', overlaps);
    return overlaps;
  };
  
  const handleTimeSlotSelect = (activityId: number | string, timeSlotId: string) => {
    console.log(`Time slot selection: Activity ${activityId}, Slot ${timeSlotId}`);
    
    // Check if this is a deselection (clicking the same slot again)
    const isDeselection = selectedTimeSlots[activityId] === timeSlotId;
    console.log(`Is deselection: ${isDeselection}`);
    
    let newSelectedTimeSlots;
    
    if (isDeselection) {
      // Create a new object without the deselected slot
      newSelectedTimeSlots = { ...selectedTimeSlots };
      delete newSelectedTimeSlots[activityId];
      console.log('Slot deselected, new selected slots:', newSelectedTimeSlots);
    } else {
      // Add or update the selected slot
      newSelectedTimeSlots = {
        ...selectedTimeSlots,
        [activityId]: timeSlotId
      };
      console.log('Slot selected, new selected slots:', newSelectedTimeSlots);
    }
    
    // Update the selected time slots state
    setSelectedTimeSlots(newSelectedTimeSlots);
    
    // Calculate overlapping slots
    console.log('Calculating overlapping slots...');
    const newOverlappingSlots = checkTimeSlotOverlaps(newSelectedTimeSlots);
    console.log('New overlapping slots:', newOverlappingSlots);
    
    // Update the overlapping slots state
    setOverlappingSlots(newOverlappingSlots);
  };
  
  // Handle reservation
  const handleReservation = async (activityId: number | string, timeSlotId: string) => {
    if (!contactID) {
      setReservationError('Contact ID is required');
      return;
    }
    
    try {
      setReservationStatus(prev => ({ ...prev, [String(activityId)]: 'pending' }));
      
      // Make the reservation
      const result = await makeReservation(contactID, activityId, timeSlotId);
      
      if (result.success) {
        setReservationStatus(prev => ({ ...prev, [String(activityId)]: 'success' }));
        
        // Refresh the experiences data to get updated availability
        const updatedData = await fetchExperiences(contactID, i18n.language);
        setActivities(updatedData);
      } else {
        setReservationStatus(prev => ({ ...prev, [String(activityId)]: 'error' }));
        setReservationError('Failed to make reservation');
      }
    } catch (error) {
      console.error('Error making reservation:', error);
      setReservationStatus(prev => ({ ...prev, [String(activityId)]: 'error' }));
      setReservationError('An error occurred while making the reservation');
    }
  };
  
  const navigate = useNavigate();

  const handleSubmit = async () => {
    console.log('handleSubmit called - this should appear in the console when the submit button is clicked');
    // Set submitting state
    setSubmitting(true);
    setReservationError(null);
    
    try {
      console.log('Starting to make reservations for selected time slots');
      // Make reservations for all selected time slots
      const selectedSlots = Object.entries(selectedTimeSlots);
      
      for (let i = 0; i < selectedSlots.length; i++) {
        const [activityId, timeSlotId] = selectedSlots[i];
        console.log(`Making reservation for activity ${activityId}, time slot ${timeSlotId}`);
        
        // Set replaceAll to true for the first reservation only
        const isFirstReservation = i === 0;
        
        // Make the reservation
        const result = await makeReservation(contactID, activityId, timeSlotId, isFirstReservation);
        console.log(`Reservation result for ${activityId}:`, result);
        
        if (!result.success) {
          // Check if this is a "no spots available" error
          if (result.errorCode === 'NO_SPOTS_AVAILABLE') {
            const activity = activities.find(a => String(a.id) === String(activityId));
            const activityTitle = activity?.title || 'activity';
            
            setReservationError(t('noSpotsAvailableForActivity', { activity: activityTitle }));
            
            // Refresh the experiences data to get updated availability
            const language = lang || 'en';
            const updatedData = await fetchExperiences(contactID, language);
            setActivities(updatedData);
            
            // Clear the selection for this activity
            const newSelectedTimeSlots = { ...selectedTimeSlots };
            delete newSelectedTimeSlots[activityId];
            setSelectedTimeSlots(newSelectedTimeSlots);
            
            setSubmitting(false);
            return;
          } else {
            // For other errors
            setReservationError(`Failed to make reservation for ${
              activities.find(a => String(a.id) === String(activityId))?.title || 'activity'
            }`);
            setSubmitting(false);
            return;
          }
        }
      }
      
      console.log('All reservations completed successfully');
      
      // All reservations successful
      
      // Extract just the activity IDs from the selected time slots
      const selectedActivityIds = Object.keys(selectedTimeSlots);
      console.log('Selected activity IDs for HubSpot update:', selectedActivityIds);
      console.log('Contact ID for HubSpot update:', contactID);
      
      // Prepare data for confirmation page
      const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
        // Use String comparison to handle both string and number IDs
        const activity = activities.find(a => String(a.id) === String(activityId));
        const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
        return {
          activity: activity?.title,
          course: activity?.course,
          time: timeSlot?.time,
          location: activity?.location,  // Add location
          duration: activity?.duration   // Add duration
        };
      });
      
      // Update the HubSpot contact with the selected experience IDs
      console.log('Now updating HubSpot contact with selected experiences');
      try {
        console.log('Calling updateSelectedExperiences with:', { contactID, selectedActivityIds });
        const result = await updateSelectedExperiences(contactID, selectedActivityIds);
        console.log('Result from updateSelectedExperiences:', result);
        console.log('Successfully updated HubSpot contact with selected experiences');
      } catch (updateError) {
        console.error('Error updating HubSpot contact with selected experiences:', updateError);
        if (updateError instanceof Error) {
          console.error('Error details:', updateError.message);
        }
        // Continue with the flow even if this update fails
      }
      
      // Refresh the experiences data to get updated availability
      const language = lang || 'en';
      await fetchExperiences(contactID, language);
      
      // Navigate to the confirmation page with the selected activities
      console.log('Navigation to confirmation page with contactID:', contactID);
      navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, { state: { activities: selectedActivities } });
    } catch (error) {
      console.error('Error making reservations:', error);
      setReservationError('An error occurred while making the reservations');
      setSubmitting(false);
    }
  };
  
  const hasSelections = Object.keys(selectedTimeSlots).length > 0;
  
  // State for debug panel
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [rawSlotData, setRawSlotData] = useState<Record<string, number>>({});
  const [discrepancies, setDiscrepancies] = useState<Array<{id: string, displayed: number, expected: number}>>([]);
  
  // Function to verify displayed values against raw data
  const verifySlotDisplay = async () => {
    try {
      console.log('Verifying slot display against raw data...');
      
      // Fetch raw slot data from the API
      const response = await fetch('/api/get_raw_slots');
      const data = await response.json();
      
      console.log('Raw slot data:', data);
      setRawSlotData(data);
      
      // Check for discrepancies
      const foundDiscrepancies: Array<{id: string, displayed: number, expected: number}> = [];
      
      activities.forEach(activity => {
        activity.timeSlots.forEach(slot => {
          // Try both key formats
          const key1 = `${activity.id}_${slot.id}`;
          const key2 = `${String(activity.id).replace(/-\d+$/, '')}_${slot.id}`;
          
          const expected = data[key1] !== undefined ? data[key1] : data[key2];
          
          if (expected !== undefined && slot.available !== expected) {
            console.log(`Discrepancy found for ${key1}:`);
            console.log(`- Displayed: ${slot.available}, Expected: ${expected}`);
            
            foundDiscrepancies.push({
              id: key1,
              displayed: slot.available,
              expected: expected
            });
          }
        });
      });
      
      setDiscrepancies(foundDiscrepancies);
      console.log(`Found ${foundDiscrepancies.length} discrepancies`);
      
    } catch (error) {
      console.error('Error verifying slot display:', error);
    }
  };
  
  // Function to fix discrepancies
  const fixDiscrepancies = () => {
    if (discrepancies.length === 0) {
      console.log('No discrepancies to fix');
      return;
    }
    
    console.log(`Fixing ${discrepancies.length} discrepancies...`);
    
    // Create a copy of the activities array
    const updatedActivities = [...activities];
    
    // Fix each discrepancy
    discrepancies.forEach(d => {
      // Parse the key to get activity ID and slot ID
      const [activityId, slotId] = d.id.split('_');
      
      // Find the activity
      const activityIndex = updatedActivities.findIndex(a =>
        String(a.id) === activityId || String(a.id).replace(/-\d+$/, '') === activityId
      );
      
      if (activityIndex !== -1) {
        // Find the time slot
        const slotIndex = updatedActivities[activityIndex].timeSlots.findIndex(s => s.id === slotId);
        
        if (slotIndex !== -1) {
          // Update the available slots
          console.log(`Updating activity ${activityId}, slot ${slotId} from ${updatedActivities[activityIndex].timeSlots[slotIndex].available} to ${d.expected}`);
          updatedActivities[activityIndex].timeSlots[slotIndex].available = d.expected;
        }
      }
    });
    
    // Update the activities state
    setActivities(updatedActivities);
    
    // Clear discrepancies
    setDiscrepancies([]);
    
    console.log('Discrepancies fixed');
  };
  
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full relative overflow-hidden">
      {/* Add the LoadingOverlay */}
      <LoadingOverlay
        visible={submitting}
        message={t('processingRegistration')}
      />
      
      {/* Debug Panel */}
      <div className="fixed top-0 right-0 z-50">
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="bg-gray-800 text-white px-3 py-1 text-xs"
        >
          {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
        </button>
        
        {showDebugPanel && (
          <div className="bg-gray-800 text-white p-4 max-w-md max-h-screen overflow-auto text-xs">
            <h3 className="font-bold mb-2">Debug Information</h3>
            
            <div className="mb-4">
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={verifySlotDisplay}
                  className="bg-blue-600 text-white px-3 py-1 text-xs"
                >
                  Verify Slot Display
                </button>
                
                <button
                  onClick={fixDiscrepancies}
                  className={`px-3 py-1 text-xs ${discrepancies.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
                  disabled={discrepancies.length === 0}
                >
                  Fix Discrepancies ({discrepancies.length})
                </button>
              </div>
              
              {discrepancies.length > 0 && (
                <div className="mb-4 bg-red-900/30 p-2 rounded">
                  <h4 className="font-semibold text-red-300">Discrepancies Found ({discrepancies.length})</h4>
                  {discrepancies.map((d, index) => (
                    <div key={index} className="mb-1">
                      <p><strong>ID:</strong> {d.id}</p>
                      <p><strong>Displayed:</strong> {d.displayed}</p>
                      <p><strong>Expected:</strong> {d.expected}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {Object.keys(rawSlotData).length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold">Raw Slot Data</h4>
                  <div className="max-h-40 overflow-auto">
                    <pre>{JSON.stringify(rawSlotData, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold">Activities ({activities.length})</h4>
              {activities.map((activity, index) => (
                <div key={activity.id} className="mb-2 border-t border-gray-700 pt-1">
                  <p><strong>Activity {index + 1}:</strong> {activity.title}</p>
                  <p><strong>ID:</strong> {activity.id}</p>
                  <p><strong>Time Slots:</strong> {activity.timeSlots.length}</p>
                  <div className="pl-2 border-l border-gray-700">
                    {activity.timeSlots.map((slot, slotIndex) => (
                      <div key={slot.id} className="mb-1">
                        <p><strong>Slot {slotIndex + 1}:</strong> {slot.time} {slot.endTime ? `- ${slot.endTime}` : ''}</p>
                        <p><strong>ID:</strong> {slot.id}</p>
                        <p><strong>Available:</strong> {slot.available} (type: {typeof slot.available})</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-semibold">Selected Time Slots</h4>
              <pre>{JSON.stringify(selectedTimeSlots, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
      <div className="max-w-4xl mx-auto py-12 px-4 relative">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-viridian text-white tracking-wide leading-tight inline-block">
            {t('welcome')}
          </h1>
        </div>
        <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-xl">
          <p className="text-white/90 leading-relaxed">
            {t('intro')}
          </p>
        </div>
        
        {contactIdMissing ? (
          <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-xl">
            <p className="text-white/90 leading-relaxed">{t('contactIdRequired')}</p>
          </div>
        ) : loading ? (
          <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-xl">
            <p className="text-white/90 leading-relaxed">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-xl">
            <p className="text-white/90 leading-relaxed">{t('error')}: {error}</p>
          </div>
        ) : (
          <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg divide-y divide-white/10 mb-8 shadow-xl">
            {reservationError && (
              <div className="p-4 bg-red-900/20 text-white">
                <p className="text-sm">{reservationError}</p>
              </div>
            )}
            {activities.map(activity => (
              <ActivityAccordion
                key={activity.id}
                activity={activity}
                isOpen={openAccordion === activity.id}
                onClick={() => setOpenAccordion(openAccordion === activity.id ? null : activity.id)}
                selectedSlot={selectedTimeSlots[activity.id] || null}
                onTimeSlotSelect={handleTimeSlotSelect}
                overlappingSlots={overlappingSlots}
              />
            ))}
          </div>
        )}
        
        {!contactIdMissing && (
            <div className="flex justify-center mb-16">
          <button onClick={handleSubmit}
              disabled={!hasSelections || loading}
              className={`bg-yellow-300 text-white font-bold text-xl px-16 py-4 rounded-full border-2 border-white hover:bg-yellow-400 transition-colors `}>
          {t('submitRegistration')}
          </button>
       
          </div>
        )}
      </div>
    </main>
  );
};