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

// Helper component to handle the confirmation page with location state or URL parameters
const ConfirmationPageWrapper = () => {
  const location = useLocation();
  const activities = location.state?.activities || [];
  
  console.log('ConfirmationPageWrapper - location:', location);
  console.log('ConfirmationPageWrapper - location.search:', location.search);
  
  // Determine if the user is coming from the selection page
  // Invece di basarsi sulla lunghezza dell'array activities, controlliamo se l'oggetto state esiste
  // e se contiene la proprietà activities (anche se è un array vuoto)
  const isFromSelectionPage = !!location.state && 'activities' in location.state;
  console.log('ConfirmationPageWrapper - isFromSelectionPage:', isFromSelectionPage);
  console.log('ConfirmationPageWrapper - location.state:', location.state);
  
  // Extract parameters from URL query parameters
  const urlParams = new URLSearchParams(location.search);
  console.log('ConfirmationPageWrapper - urlParams entries:', Array.from(urlParams.entries()));
  
  const contactID = urlParams.get('contactID') || '';
  console.log('ConfirmationPageWrapper - contactID from URL:', contactID);
  
  // Get matchingCourseIds from either location state or URL query parameters
  let matchingCourseIds = location.state?.matchingCourseIds || [];
  console.log('ConfirmationPageWrapper - initial matchingCourseIds from state:', matchingCourseIds);
  
  // If matchingCourseIds is not in location state, check URL query parameters
  const matchingCourseIdsParam = urlParams.get('matchingCourseIds');
  console.log('ConfirmationPageWrapper - matchingCourseIdsParam from URL:', matchingCourseIdsParam);
  
  // Always prioritize URL parameters over state
  if (matchingCourseIdsParam) {
    // Split the comma-separated list of IDs
    matchingCourseIds = matchingCourseIdsParam.split(',');
    console.log('ConfirmationPageWrapper - matchingCourseIds after split:', matchingCourseIds);
    console.log('ConfirmationPageWrapper - matchingCourseIds length after split:', matchingCourseIds.length);
    console.log('ConfirmationPageWrapper - matchingCourseIds is array after split:', Array.isArray(matchingCourseIds));
  } else if (matchingCourseIds.length > 0) {
    console.log('ConfirmationPageWrapper - using matchingCourseIds from state:', matchingCourseIds);
  } else {
    console.log('ConfirmationPageWrapper - no matchingCourseIds found in URL or state');
  }
  
  return (
    <LanguageProvider>
      <ConfirmationPage
        activities={activities}
        contactID={contactID}
        matchingCourseIds={matchingCourseIds}
        isFromSelectionPage={isFromSelectionPage}
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
