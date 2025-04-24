# Implementation Plan for Italian and English Versions of the Frontend

## 1. Technology Stack and Dependencies

We'll need to add the following dependencies to the project:
- `react-router-dom` - For handling routing and separate language URLs
- `react-i18next` and `i18next` - For internationalization support
- `i18next-browser-languagedetector` - For detecting browser language (optional)

## 2. Project Structure

We'll modify the project structure to support internationalization:

```
front/
├── src/
│   ├── App.tsx                  # Main application component with routing
│   ├── index.tsx                # Entry point
│   ├── components/              # UI components
│   │   ├── OpenDayRegistration.tsx
│   │   ├── ActivityAccordion.tsx
│   │   └── LanguageSwitcher.tsx # New component for language switching
│   ├── locales/                 # Translation files
│   │   ├── en/                  # English translations
│   │   │   └── translation.json
│   │   └── it/                  # Italian translations
│   │       └── translation.json
│   ├── data/                    # Separate data folder
│   │   └── activities.ts        # Activities data with language support
│   └── i18n.ts                  # i18n configuration
```

## 3. Implementation Steps

### 3.1. Install Required Dependencies

We'll add the necessary packages to the project:
```bash
npm install react-router-dom react-i18next i18next i18next-browser-languagedetector
```

### 3.2. Create i18n Configuration

We'll create an i18n.ts file to configure the internationalization:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import itTranslation from './locales/it/translation.json';

i18n
  // Use language detector (optional)
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      it: {
        translation: itTranslation
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
```

### 3.3. Create Translation Files

We'll create translation files for both languages:

**English (en/translation.json)**:
```json
{
  "welcome": "Welcome to Open Day",
  "intro": "Join us for an exciting Open Day at our Medical University! This is your opportunity to experience hands-on medical training and explore our facilities. Each activity has limited seats available, so we recommend registering early for your preferred sessions. Select the activities you're interested in and choose your preferred time slot to secure your spot.",
  "location": "Location",
  "duration": "Duration",
  "availableTimeSlots": "Available Time Slots",
  "spotsAvailable": "{{count}} spots available",
  "registeredFor": "You're registered for the {{time}} session",
  "selectTimeSlot": "Please select a time slot to register for this activity.",
  "booked": "Booked",
  "submitRegistration": "Submit Registration",
  "registrationSuccess": "Registration submitted successfully!",
  "activities": {
    "1": {
      "title": "Mannequin with listening and viewing of the eardrum",
      "course": "Medical Diagnostics",
      "location": "Medical Lab A",
      "duration": "45 minutes"
    },
    "2": {
      "title": "Minor surgery, suturing",
      "course": "Basic Surgery",
      "location": "Surgical Lab B",
      "duration": "60 minutes"
    },
    "3": {
      "title": "Airway obstruction maneuver with mannequin",
      "course": "Emergency Medicine",
      "location": "Emergency Lab C",
      "duration": "30 minutes"
    },
    "4": {
      "title": "Semiotics",
      "course": "Medical Diagnostics",
      "location": "Room 101",
      "duration": "45 minutes"
    },
    "5": {
      "title": "DNA Extraction",
      "course": "Laboratory Medicine",
      "location": "Lab D",
      "duration": "90 minutes"
    }
  }
}
```

**Italian (it/translation.json)**:
```json
{
  "welcome": "Benvenuti all'Open Day",
  "intro": "Unisciti a noi per un emozionante Open Day presso la nostra Università di Medicina! Questa è la tua opportunità per sperimentare la formazione medica pratica ed esplorare le nostre strutture. Ogni attività ha posti limitati disponibili, quindi consigliamo di registrarsi in anticipo per le sessioni preferite. Seleziona le attività che ti interessano e scegli la fascia oraria preferita per assicurarti il tuo posto.",
  "location": "Posizione",
  "duration": "Durata",
  "availableTimeSlots": "Fasce Orarie Disponibili",
  "spotsAvailable": "{{count}} posti disponibili",
  "registeredFor": "Sei registrato per la sessione delle {{time}}",
  "selectTimeSlot": "Seleziona una fascia oraria per registrarti a questa attività.",
  "booked": "Prenotato",
  "submitRegistration": "Invia Registrazione",
  "registrationSuccess": "Registrazione inviata con successo!",
  "activities": {
    "1": {
      "title": "Manichino con ascolto e visione del timpano",
      "course": "Diagnostica Medica",
      "location": "Laboratorio Medico A",
      "duration": "45 minuti"
    },
    "2": {
      "title": "Piccola chirurgia, sutura",
      "course": "Chirurgia di Base",
      "location": "Laboratorio Chirurgico B",
      "duration": "60 minuti"
    },
    "3": {
      "title": "Manovra di disostruzione delle vie aeree con manichino",
      "course": "Medicina d'Emergenza",
      "location": "Laboratorio di Emergenza C",
      "duration": "30 minuti"
    },
    "4": {
      "title": "Semiotica",
      "course": "Diagnostica Medica",
      "location": "Stanza 101",
      "duration": "45 minuti"
    },
    "5": {
      "title": "Estrazione DNA",
      "course": "Medicina di Laboratorio",
      "location": "Laboratorio D",
      "duration": "90 minuti"
    }
  }
}
```

### 3.4. Modify Activity Data Structure

We'll modify the activities data to use translation keys instead of hardcoded text:

```typescript
// src/data/activities.ts
export const getActivities = (t: any) => [
  {
    id: 1,
    title: t('activities.1.title'),
    course: t('activities.1.course'),
    location: t('activities.1.location'),
    duration: t('activities.1.duration'),
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
  // ... other activities
];
```

### 3.5. Update Components to Use i18n

We'll update the OpenDayRegistration and ActivityAccordion components to use the translation functions:

```typescript
// OpenDayRegistration.tsx
import { useTranslation } from 'react-i18next';
import { getActivities } from '../data/activities';

export const OpenDayRegistration = () => {
  const { t } = useTranslation();
  const activities = getActivities(t);
  
  // ... rest of the component
  
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full relative overflow-hidden">
      {/* ... */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-viridian text-yellow-300 tracking-wide leading-tight inline-block">
          {t('welcome')}
        </h1>
      </div>
      <div className="bg-[#0082b6]/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-xl">
        <p className="text-white/90 leading-relaxed">
          {t('intro')}
        </p>
      </div>
      {/* ... */}
      <button onClick={handleSubmit} disabled={!hasSelections} className={`...`}>
        {t('submitRegistration')}
      </button>
    </main>
  );
};
```

### 3.6. Implement Routing for Language Support

We'll update the App.tsx file to implement routing with language paths:

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OpenDayRegistration } from './components/OpenDayRegistration';
import './i18n'; // Import i18n configuration

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/en/front" replace />} />
        <Route path="/:lang/front" element={<OpenDayRegistration />} />
      </Routes>
    </BrowserRouter>
  );
};
```

### 3.7. Create a Language Provider Component

We'll create a LanguageProvider component to set the language based on the URL:

```typescript
// src/components/LanguageProvider.tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang && (lang === 'en' || lang === 'it')) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return <>{children}</>;
};
```

And update the App.tsx to use this provider:

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OpenDayRegistration } from './components/OpenDayRegistration';
import { LanguageProvider } from './components/LanguageProvider';
import './i18n'; // Import i18n configuration

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/en/front" replace />} />
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
```

### 3.8. Create a Language Switcher Component (Optional)

We'll create a LanguageSwitcher component to allow users to switch between languages:

```typescript
// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const switchLanguage = (newLang: string) => {
    if (newLang !== lang) {
      navigate(`/${newLang}/front`, { replace: true });
    }
  };

  return (
    <div className="absolute top-4 right-4 flex space-x-2">
      <button
        onClick={() => switchLanguage('en')}
        className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-yellow-300 text-blue-900' : 'bg-white/20 text-white'}`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('it')}
        className={`px-2 py-1 rounded ${lang === 'it' ? 'bg-yellow-300 text-blue-900' : 'bg-white/20 text-white'}`}
      >
        IT
      </button>
    </div>
  );
};
```

And add it to the OpenDayRegistration component:

```typescript
// OpenDayRegistration.tsx
import { LanguageSwitcher } from './LanguageSwitcher';

export const OpenDayRegistration = () => {
  // ...
  
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full relative overflow-hidden">
      <LanguageSwitcher />
      {/* ... rest of the component */}
    </main>
  );
};
```

## 4. Testing Strategy

1. Test both language routes (/en/front and /it/front) to ensure they load correctly
2. Verify that all text is properly translated in both languages
3. Test the language switcher to ensure it correctly changes the language
4. Test the form submission in both languages
5. Test that the correct language is loaded based on the URL path

## 5. Deployment Considerations

1. Ensure that the server is configured to handle the language-specific routes
2. Update any existing links to the frontend to include the language prefix
3. Consider implementing server-side language detection for the root path

## 6. Mermaid Diagram of the Implementation

```mermaid
graph TD
    A[Browser Request] --> B{URL Path}
    B -->|/| C[Redirect to /en/front]
    B -->|/en/front| D[Load English Version]
    B -->|/it/front| E[Load Italian Version]
    
    D --> F[OpenDayRegistration Component]
    E --> F
    
    F --> G[Load i18n Translations]
    G -->|en| H[English Translations]
    G -->|it| I[Italian Translations]
    
    F --> J[Render UI with Translations]
    J --> K[Activity Data]
    J --> L[UI Elements]
    
    M[Language Switcher] --> N{Switch Language}
    N -->|to English| D
    N -->|to Italian| E