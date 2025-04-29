import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActivityDetails } from '../data/activities';

interface ActivityAccordionProps {
  activity: ActivityDetails;
  isOpen: boolean;
  onClick: () => void;
  selectedSlot: string | null;
  onTimeSlotSelect: (activityId: number | string, timeSlotId: string) => void;
  overlappingSlots?: Record<string, boolean>;
}

export const ActivityAccordion = ({
  activity,
  isOpen,
  onClick,
  selectedSlot,
  onTimeSlotSelect,
  overlappingSlots = {}
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
          <span className="text-lg text-white tracking-wide">
            {activity.title}
            {selectedSlot && (
              <span className="ml-2 text-sm text-yellow-300 font-normal">
                ({t('booked')}: {
                  (() => {
                    const slot = activity.timeSlots.find(slot => slot.id === selectedSlot);
                    return slot?.endTime ? `${slot.time} - ${slot.endTime}` : slot?.time;
                  })()
                })
              </span>
            )}
          </span>
          <span className="font-bold text-sm text-yellow-300 mt-1">{activity.course}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-yellow-300 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-6 py-4 bg-white/10">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-white/90">
              <div>
                <span className="font-medium text-yellow-300">{t('location')}:</span>{' '}
                <span className="font-bold">{activity.location}</span>
              </div>
              <div>
                <span className="font-medium text-yellow-300">{t('duration')}:</span>{' '}
                <span className="font-bold"> {activity.duration}</span>
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
                {activity.timeSlots.map(slot => {
                  // Debug logging for each time slot
                  console.log(`Rendering slot ${slot.id} for activity ${activity.id}:`);
                  console.log(`- Available: ${slot.available}, Type: ${typeof slot.available}`);
                  console.log(`- Time: ${slot.time}, EndTime: ${slot.endTime || 'N/A'}`);
                  
                  const isOverlapping = overlappingSlots[slot.id];
                  const isFull = slot.available <= 0;
                  const isDisabled = isOverlapping || isFull;
                  
                  // Log the calculated state
                  console.log(`- isOverlapping: ${isOverlapping}, isFull: ${isFull}, isDisabled: ${isDisabled}`);
                  
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-start space-x-3 p-2 rounded ${
                        isOverlapping ? 'bg-red-900/20' :
                        isFull ? 'bg-gray-900/20' :
                        'hover:bg-white/5'
                      }`}
                      data-slot-id={slot.id}
                      data-available={slot.available}
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
                        <span className="text-sm text-white/70 available-slots" data-experience-id={activity.id} data-time-slot-id={slot.id}>
                          ({t('spotsAvailable', { count: slot.available })})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedSlot ? (
              <div className="bg-white/10 p-3 rounded-md">
                <p className="text-yellow-300 text-sm">
                  {(() => {
                    const slot = activity.timeSlots.find(slot => slot.id === selectedSlot);
                    const timeDisplay = slot?.endTime ? `${slot.time} - ${slot.endTime}` : slot?.time;
                    return t('registeredFor', { time: timeDisplay });
                  })()}
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