import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OpenDayRegistration } from './components/OpenDayRegistration';
import { ConfirmationPage } from './components/ConfirmationPage';
import { LanguageProvider } from './components/LanguageProvider';
import './i18n'; // Import i18n configuration

// Helper component to handle default redirect with query parameters
const DefaultRedirect = () => {
  const location = useLocation();
  // Preserve query parameters when redirecting to default language
  return <Navigate to={`/en/front${location.search}`} replace />;
};

// Helper component to handle the confirmation page with location state
const ConfirmationPageWrapper = () => {
  const location = useLocation();
  const activities = location.state?.activities || [];
  
  // Extract contactID from URL query parameters
  const urlParams = new URLSearchParams(location.search);
  const contactID = urlParams.get('contactID') || '';
  
  return (
    <LanguageProvider>
      <ConfirmationPage activities={activities} contactID={contactID} />
    </LanguageProvider>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultRedirect />} />
        <Route
          path="/:lang/front"
          element={
            <LanguageProvider>
              <OpenDayRegistration />
            </LanguageProvider>
          }
        />
        <Route
          path="/:lang/front/confirmation"
          element={<ConfirmationPageWrapper />}
        />
      </Routes>
    </BrowserRouter>
  );
};
