import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
interface TimeSlot {
  id: string;
  time: string;
  available: number;
}
export interface ActivityDetails {
  id: number;
  title: string;
  course: string;
  location: string;
  duration: string;
  timeSlots: TimeSlot[];
}
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
  return <div className="border-b border-white/10">
      <button className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors" onClick={onClick} aria-expanded={isOpen}>
        <div className="flex flex-col">
          <span className="text-lg text-white font-bold tracking-wide">
            {activity.title}
            {selectedSlot && <span className="ml-2 text-sm text-yellow-300 font-normal">
                (Booked:{' '}
                {activity.timeSlots.find(slot => slot.id === selectedSlot)?.time}
                )
              </span>}
          </span>
          <span className="text-sm text-white/80 mt-1">{activity.course}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-yellow-300 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-6 py-4 bg-white/10">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-white/90">
              <div>
                <span className="font-medium text-yellow-300">Location:</span>{' '}
                {activity.location}
              </div>
              <div>
                <span className="font-medium text-yellow-300">Duration:</span>{' '}
                {activity.duration}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-300">
                Available Time Slots:
              </h3>
              <div className="space-y-2">
                {activity.timeSlots.map(slot => <label key={slot.id} className="flex items-center space-x-3 p-2 rounded hover:bg-white/5">
                    <input type="radio" name={`timeSlot-${activity.id}`} value={slot.id} checked={selectedSlot === slot.id} onChange={() => onTimeSlotSelect(activity.id, slot.id)} className="h-4 w-4 text-yellow-300 border-white/30" />
                    <span className="text-white">{slot.time}</span>
                    <span className="text-sm text-white/70">
                      ({slot.available} spots available)
                    </span>
                  </label>)}
              </div>
            </div>
            {selectedSlot ? <div className="bg-white/10 p-3 rounded-md">
                <p className="text-yellow-300 text-sm">
                  You're registered for the{' '}
                  {activity.timeSlots.find(slot => slot.id === selectedSlot)?.time}{' '}
                  session
                </p>
              </div> : <p className="text-white/70 text-sm">
                Please select a time slot to register for this activity.
              </p>}
          </div>
        </div>}
    </div>;
};