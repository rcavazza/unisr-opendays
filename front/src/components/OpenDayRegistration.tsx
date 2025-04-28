import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ActivityAccordion } from './ActivityAccordion';
import { ActivityDetails } from '../data/activities';
import { fetchExperiences, makeReservation } from '../services/experienceService';
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
        const data = await fetchExperiences(contactID, language);
        console.log('Received experiences data:', data);
        setActivities(data);
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
  const checkTimeSlotOverlaps = (selectedSlots: Record<string | number, string>) => {
    console.log('Checking for overlapping slots with selected slots:', selectedSlots);
    const overlaps: Record<string, boolean> = {};
    
    // If no slots are selected, return empty overlaps
    if (Object.keys(selectedSlots).length === 0) {
      console.log('No slots selected, returning empty overlaps');
      return overlaps;
    }
    
    // For each selected slot
    Object.entries(selectedSlots).forEach(([activityId, slotId]) => {
      console.log(`Processing selected slot: Activity ${activityId}, Slot ${slotId}`);
      
      // Try to find the activity by ID (could be string or number)
      const activity = activities.find(a => {
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
      activities.forEach(otherActivity => {
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
    // Set submitting state
    setSubmitting(true);
    setReservationError(null);
    
    try {
      // Make reservations for all selected time slots
      for (const [activityId, timeSlotId] of Object.entries(selectedTimeSlots)) {
        console.log(`Making reservation for activity ${activityId}, time slot ${timeSlotId}`);
        
        // Make the reservation
        const result = await makeReservation(contactID, activityId, timeSlotId);
        
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
      
      // All reservations successful, prepare data for confirmation page
      const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
        // Use String comparison to handle both string and number IDs
        const activity = activities.find(a => String(a.id) === String(activityId));
        const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
        return {
          activity: activity?.title,
          course: activity?.course,
          time: timeSlot?.time
        };
      });
      
      // Refresh the experiences data to get updated availability
      const language = lang || 'en';
      await fetchExperiences(contactID, language);
      
      // Navigate to the confirmation page with the selected activities
      navigate(`/${lang}/front/confirmation`, { state: { activities: selectedActivities } });
    } catch (error) {
      console.error('Error making reservations:', error);
      setReservationError('An error occurred while making the reservations');
      setSubmitting(false);
    }
  };
  
  const hasSelections = Object.keys(selectedTimeSlots).length > 0;
  
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full relative overflow-hidden">
      {/* Add the LoadingOverlay */}
      <LoadingOverlay
        visible={submitting}
        message={t('processingRegistration')}
      />
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <img src="/Group_96.svg" className="absolute top-0 right-0 w-96 h-96" alt="" />
        <img src="/Frame_94-3.svg" className="absolute bottom-0 left-0 w-96 h-96" alt="" />
        <img src="/Frame_94-2.svg" className="absolute top-1/4 left-1/4 w-96 h-96" alt="" />
      </div>
      <div className="max-w-4xl mx-auto py-12 px-4 relative">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-viridian text-yellow-300 tracking-wide leading-tight inline-block">
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
              className={`bg-yellow-300 text-[#00A4E4] font-bold text-xl px-16 py-4 rounded-full hover:bg-yellow-400 transition-colors `}>
          {t('submitRegistration')}
          </button>
          </div>
        )}
      </div>
    </main>
  );
};