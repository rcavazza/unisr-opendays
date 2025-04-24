import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActivityDetails } from '../data/activities';

interface ActivityAccordionProps {
  activity: ActivityDetails;
  isOpen: boolean;
  onClick: () => void;
  selectedSlot: string | null;
  onTimeSlotSelect: (activityId: number, timeSlotId: string) => void;
}

export const ActivityAccordion = ({
  activity,
  isOpen,
  onClick,
  selectedSlot,
  onTimeSlotSelect
}: ActivityAccordionProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="border-b border-white/10">
      <button 
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors" 
        onClick={onClick} 
        aria-expanded={isOpen}
      >
        <div className="flex flex-col">
          <span className="text-lg text-white font-bold tracking-wide">
            {activity.title}
            {selectedSlot && (
              <span className="ml-2 text-sm text-yellow-300 font-normal">
                ({t('booked')}: {activity.timeSlots.find(slot => slot.id === selectedSlot)?.time})
              </span>
            )}
          </span>
          <span className="text-sm text-white/80 mt-1">{activity.course}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-yellow-300 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-6 py-4 bg-white/10">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-white/90">
              <div>
                <span className="font-medium text-yellow-300">{t('location')}:</span>{' '}
                {activity.location}
              </div>
              <div>
                <span className="font-medium text-yellow-300">{t('duration')}:</span>{' '}
                {activity.duration}
              </div>
            </div>
            
            {/* Display the description */}
            <div className="text-sm text-white/90">
              <p>{activity.desc}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-300">
                {t('availableTimeSlots')}:
              </h3>
              <div className="space-y-2">
                {activity.timeSlots.map(slot => (
                  <label key={slot.id} className="flex items-center space-x-3 p-2 rounded hover:bg-white/5">
                    <input 
                      type="radio" 
                      name={`timeSlot-${activity.id}`} 
                      value={slot.id} 
                      checked={selectedSlot === slot.id} 
                      onChange={() => onTimeSlotSelect(activity.id, slot.id)} 
                      className="h-4 w-4 text-yellow-300 border-white/30" 
                    />
                    <span className="text-white">{slot.time}</span>
                    <span className="text-sm text-white/70">
                      ({t('spotsAvailable', { count: slot.available })})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {selectedSlot ? (
              <div className="bg-white/10 p-3 rounded-md">
                <p className="text-yellow-300 text-sm">
                  {t('registeredFor', { time: activity.timeSlots.find(slot => slot.id === selectedSlot)?.time })}
                </p>
              </div>
            ) : (
              <p className="text-white/70 text-sm">
                {t('selectTimeSlot')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};