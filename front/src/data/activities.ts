import { TFunction } from 'i18next';

export interface TimeSlot {
  id: string;
  time: string;
  endTime?: string; // Added endTime field (optional for backward compatibility)
  available: number;
  selected?: boolean; // Flag to indicate if this slot is already reserved by the user
}

export interface ActivityDetails {
  id: number | string;
  title: string;
  course: string;
  location: string;
  duration: string;
  desc: string; // New field for description
  timeSlots: TimeSlot[];
}

export const getActivities = (t: TFunction): ActivityDetails[] => [
  {
    id: 1,
    title: t('activities.1.title'),
    course: t('activities.1.course'),
    location: t('activities.1.location'),
    duration: t('activities.1.duration'),
    desc: t('activities.1.desc'),
    timeSlots: [
      {
        id: '1-1',
        time: '09:00 AM',
        available: 5
      },
      {
        id: '1-2',
        time: '11:00 AM',
        available: 3
      },
      {
        id: '1-3',
        time: '02:00 PM',
        available: 4
      }
    ]
  },
  {
    id: 2,
    title: t('activities.2.title'),
    course: t('activities.2.course'),
    location: t('activities.2.location'),
    duration: t('activities.2.duration'),
    desc: t('activities.2.desc'),
    timeSlots: [
      {
        id: '2-1',
        time: '10:00 AM',
        available: 4
      },
      {
        id: '2-2',
        time: '01:00 PM',
        available: 6
      },
      {
        id: '2-3',
        time: '03:00 PM',
        available: 2
      }
    ]
  },
  {
    id: 3,
    title: t('activities.3.title'),
    course: t('activities.3.course'),
    location: t('activities.3.location'),
    duration: t('activities.3.duration'),
    desc: t('activities.3.desc'),
    timeSlots: [
      {
        id: '3-1',
        time: '09:30 AM',
        available: 8
      },
      {
        id: '3-2',
        time: '11:30 AM',
        available: 5
      },
      {
        id: '3-3',
        time: '02:30 PM',
        available: 6
      }
    ]
  },
  {
    id: 4,
    title: t('activities.4.title'),
    course: t('activities.4.course'),
    location: t('activities.4.location'),
    duration: t('activities.4.duration'),
    desc: t('activities.4.desc'),
    timeSlots: [
      {
        id: '4-1',
        time: '10:30 AM',
        available: 6
      },
      {
        id: '4-2',
        time: '01:30 PM',
        available: 4
      }
    ]
  },
  {
    id: 5,
    title: t('activities.5.title'),
    course: t('activities.5.course'),
    location: t('activities.5.location'),
    duration: t('activities.5.duration'),
    desc: t('activities.5.desc'),
    timeSlots: [
      {
        id: '5-1',
        time: '09:00 AM',
        available: 4
      },
      {
        id: '5-2',
        time: '11:00 AM',
        available: 4
      }
    ]
  }
];