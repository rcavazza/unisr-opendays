import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OpenDayRegistration } from './components/OpenDayRegistration';
import { ConfirmationPage } from './components/ConfirmationPage';
import { LanguageProvider } from './components/LanguageProvider';
import { GenitoriPage } from './components/GenitoriPage'; // Importa il nuovo componente
import './i18n'; // Import i18n configuration

// Helper component to handle default redirect with query parameters
const DefaultRedirect = () => {
  const location = useLocation();
  // Preserve query parameters when redirecting to default language
  return <Navigate to={`/en/opendays${location.search}`} replace />;
};

// Helper component to handle the confirmation page with location state
const ConfirmationPageWrapper = () => {
  const location = useLocation();
  const activities = location.state?.activities || [];
  const matchingCourseIds = location.state?.matchingCourseIds || [];
  
  // Extract contactID from URL query parameters
  const urlParams = new URLSearchParams(location.search);
  const contactID = urlParams.get('contactID') || '';
  
  console.log('ConfirmationPageWrapper - matchingCourseIds:', matchingCourseIds);
  
  return (
    <LanguageProvider>
      <ConfirmationPage
        activities={activities}
        contactID={contactID}
        matchingCourseIds={matchingCourseIds}
      />
    </LanguageProvider>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultRedirect />} />
        <Route
          path="/:lang/opendays"
          element={
            <LanguageProvider>
              <OpenDayRegistration />
            </LanguageProvider>
          }
        />
        <Route
          path="/:lang/opendays/confirmation"
          element={<ConfirmationPageWrapper />}
        />
        <Route
          path="/:lang/opendays/genitori" // Aggiungi questa nuova route
          element={
            <LanguageProvider>
              <GenitoriPage />
            </LanguageProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
