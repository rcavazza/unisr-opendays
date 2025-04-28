import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { ActivityAccordion } from './ActivityAccordion';
import { ActivityDetails } from '../data/activities';
import { fetchExperiences } from '../services/experienceService';

export const OpenDayRegistration = () => {
  const { t, i18n } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  
  const [activities, setActivities] = useState<ActivityDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        console.log('Fetching experiences for contactID:', contactID, 'language:', i18n.language);
        const data = await fetchExperiences(contactID, i18n.language);
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
  }, [contactID, i18n.language, t]);
  
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Record<number, string>>({});
  
  const handleTimeSlotSelect = (activityId: number, timeSlotId: string) => {
    setSelectedTimeSlots(prev => ({
      ...prev,
      [activityId]: timeSlotId
    }));
  };
  
  const handleSubmit = () => {
    const selectedActivities = Object.entries(selectedTimeSlots).map(([activityId, timeSlotId]) => {
      const activity = activities.find(a => a.id === parseInt(activityId));
      const timeSlot = activity?.timeSlots.find(slot => slot.id === timeSlotId);
      return {
        activity: activity?.title,
        course: activity?.course,
        time: timeSlot?.time
      };
    });
    alert(t('registrationSuccess'));
    console.log('Selected activities:', selectedActivities);
  };
  
  const hasSelections = Object.keys(selectedTimeSlots).length > 0;
  
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full relative overflow-hidden">
   
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
            {activities.map(activity => (
              <ActivityAccordion
                key={activity.id}
                activity={activity}
                isOpen={openAccordion === activity.id}
                onClick={() => setOpenAccordion(openAccordion === activity.id ? null : activity.id)}
                selectedSlot={selectedTimeSlots[activity.id] || null}
                onTimeSlotSelect={handleTimeSlotSelect}
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