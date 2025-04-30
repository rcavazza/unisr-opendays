import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { fetchQRCode } from '../services/experienceService';

interface SelectedActivity {
  activity?: string;
  course?: string;
  time?: string;
  location?: string;  // Add location field
  duration?: string;  // Add duration field
}

interface Course {
  id: string;
  name: string;
  orario_inizio?: string;
  orario_fine?: string;
  location?: string;
}

interface ConfirmationPageProps {
  activities: SelectedActivity[];
  contactID?: string; // Add contactID prop
  matchingCourseIds?: string[]; // Add matching course IDs
}

export const ConfirmationPage = ({ activities, contactID, matchingCourseIds = [] }: ConfirmationPageProps) => {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('/images/qr.png'); // Default to static image
  const [matchingCourses, setMatchingCourses] = useState<Course[]>([]);
  
  useEffect(() => {
    // Fetch QR code if contactID is provided
    if (contactID) {
      console.log('Fetching QR code for contact ID:', contactID);
      fetchQRCode(contactID)
        .then(url => setQrCodeUrl(url))
        .catch(error => console.error('Error fetching QR code:', error));
    }
  }, [contactID]);
  
  // Fetch matching courses from corsi.json
  useEffect(() => {
    if (matchingCourseIds.length > 0) {
      const fetchCourses = async () => {
        try {
          const response = await fetch('/corsi.json');
          if (!response.ok) {
            console.error('Failed to fetch courses:', response.statusText);
            return;
          }
          
          const allCourses: Course[] = await response.json();
          
          // Filter courses by matching IDs
          const courses = allCourses.filter(course =>
            matchingCourseIds.includes(course.id)
          );
          
          console.log('Matching courses:', courses);
          setMatchingCourses(courses);
        } catch (error) {
          console.error('Error fetching courses:', error);
        }
      };
      
      fetchCourses();
    }
  }, [matchingCourseIds]);
  
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-6xl font-viridian text-white tracking-wide leading-tight text-center mb-12">
          {t('welcomeToOpenDays')}
        </h1>
        <div className="max-w-lg mx-auto">
          <div className="text-center text-white text-xl mb-8 font-bold">
            {t('emailRecapSent')}
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg mb-12">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-full aspect-square object-contain"
            />
          </div>
          {/* Display matching courses FIRST */}
          {matchingCourses.length > 0 && (
            <div className="space-y-4 mb-16">
              <h2 className="text-2xl text-white font-bold text-center mb-4">
                {t('matchingCourses', 'Your Courses')}
              </h2>
              {matchingCourses.map((course, index) => (
                <div key={index} className="bg-[#0082b6] p-6 rounded">
                  <h2 className="text-xl text-white font-extrabold mb-2">
                    {course.name}
                  </h2>
                  <div className="flex justify-between mt-2">
                    <div className="text-yellow-300 font-bold">
                      {t('location')}: {course.location || t('locationNotAvailable')}
                    </div>
                    {(course.orario_inizio || course.orario_fine) && (
                      <div className="text-yellow-300 font-bold">
                        {t('time', 'Time')}: {course.orario_inizio || ''}
                        {course.orario_inizio && course.orario_fine ? ' - ' : ''}
                        {course.orario_fine || ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Then display selected activities */}
          {activities.length > 0 && (
            <div className="space-y-4 mb-16">
              <h2 className="text-2xl text-white font-bold text-center mb-4">
                {t('selectedActivities', 'Your Activities')}
              </h2>
              {activities.map((activity, index) => (
                <div key={index} className="bg-[#0082b6] p-6 rounded">
                  <h2 className="text-xl text-white font-extrabold mb-2">
                    {activity.activity}
                  </h2>
                  <div className="text-yellow-300 font-bold">
                    {activity.course}
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="text-yellow-300 font-bold">
                      {t('location')}: {activity.location || t('locationNotAvailable')}
                    </div>
                    <div className="text-yellow-300 font-bold">
                      {t('duration')}: {activity.duration || t('durationNotAvailable')}
                    </div>
                  </div>
                  <div className="text-yellow-300 mt-2 font-bold">
                    ({t('booked')}: {activity.time})
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <img
              src="https://uploadthingy.s3.us-west-1.amazonaws.com/w1w55NpM45wFShyM85TXCC/Group_96.svg"
              alt="UniSR Logo"
              className="h-16"
            />
          </div>
        </div>
      </div>
    </main>
  );
};