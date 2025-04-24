import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OpenDayRegistration } from './components/OpenDayRegistration';
import { LanguageProvider } from './components/LanguageProvider';
import './i18n'; // Import i18n configuration

// Helper component to handle default redirect with query parameters
const DefaultRedirect = () => {
  const location = useLocation();
  // Preserve query parameters when redirecting to default language
  return <Navigate to={`/en/front${location.search}`} replace />;
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
      </Routes>
    </BrowserRouter>
  );
};
