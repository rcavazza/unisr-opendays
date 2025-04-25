import React, { useState } from 'react';
import { ActivityAccordion, ActivityDetails } from './ActivityAccordion';
import { ConfirmationPage } from './ConfirmationPage';
const activities: ActivityDetails[] = [{
  id: 1,
  title: 'Manichino con ascolto e visione del timpano',
  course: 'Medical Diagnostics',
  location: 'Medical Lab A',
  duration: '45 minutes',
  timeSlots: [{
    id: '1-1',
    time: '09:00 AM',
    available: 5
  }, {
    id: '1-2',
    time: '11:00 AM',
    available: 3
  }, {
    id: '1-3',
    time: '02:00 PM',
    available: 4
  }]
}, {
  id: 2,
  title: 'Piccola chirurgia, sutura',
  course: 'Basic Surgery',
  location: 'Surgical Lab B',
  duration: '60 minutes',
  timeSlots: [{
    id: '2-1',
    time: '10:00 AM',
    available: 4
  }, {
    id: '2-2',
    time: '01:00 PM',
    available: 6
  }, {
    id: '2-3',
    time: '03:00 PM',
    available: 2
  }]
}, {
  id: 3,
  title: 'Manovra di disostruzione delle vie aeree con manichino',
  course: 'Emergency Medicine',
  location: 'Emergency Lab C',
  duration: '30 minutes',
  timeSlots: [{
    id: '3-1',
    time: '09:30 AM',
    available: 8
  }, {
    id: '3-2',
    time: '11:30 AM',
    available: 5
  }, {
    id: '3-3',
    time: '02:30 PM',
    available: 6
  }]
}, {
  id: 4,
  title: 'Semiotica',
  course: 'Medical Diagnostics',
  location: 'Room 101',
  duration: '45 minutes',
  timeSlots: [{
    id: '4-1',
    time: '10:30 AM',
    available: 6
  }, {
    id: '4-2',
    time: '01:30 PM',
    available: 4
  }]
}, {
  id: 5,
  title: 'Estrazione DNA',
  course: 'Laboratory Medicine',
  location: 'Lab D',
  duration: '90 minutes',
  timeSlots: [{
    id: '5-1',
    time: '09:00 AM',
    available: 4
  }, {
    id: '5-2',
    time: '11:00 AM',
    available: 4
  }]
}];
export const OpenDayRegistration = () => {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedActivities, setSubmittedActivities] = useState<any[]>([]);
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
    setSubmittedActivities(selectedActivities);
    setIsSubmitted(true);
  };
  if (isSubmitted) {
    return <ConfirmationPage activities={submittedActivities} />;
  }
  const hasSelections = Object.keys(selectedTimeSlots).length > 0;
  return <main className="min-h-screen bg-[#00A4E4] w-full">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-viridian text-white tracking-wide leading-tight inline-block">
            Welcome to Open Day
          </h1>
        </div>
        <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg p-6 mb-8">
          <p className="text-white/90 leading-relaxed">
            Join us for an exciting Open Day at our Medical University! This is
            your opportunity to experience hands-on medical training and explore
            our facilities. Each activity has limited seats available, so we
            recommend registering early for your preferred sessions. Select the
            activities you're interested in and choose your preferred time slot
            to secure your spot.
          </p>
        </div>
        <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg divide-y divide-white/10 mb-8">
          {activities.map(activity => <ActivityAccordion key={activity.id} activity={activity} isOpen={openAccordion === activity.id} onClick={() => setOpenAccordion(openAccordion === activity.id ? null : activity.id)} selectedSlot={selectedTimeSlots[activity.id] || null} onTimeSlotSelect={handleTimeSlotSelect} />)}
        </div>
        <div className="flex justify-center">
          <button onClick={handleSubmit} disabled={!hasSelections} className={`px-8 py-4 rounded-md text-white tracking-wide transition-colors font-viridian text-xl ${hasSelections ? 'bg-[#0082b6]/80 hover:bg-[#0082b6]' : 'bg-white/20 cursor-not-allowed'}`}>
            Submit Registration
          </button>
        </div>
      </div>
    </main>;
};