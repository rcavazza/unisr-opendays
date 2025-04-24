import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const switchLanguage = (newLang: string) => {
    if (newLang !== lang) {
      // Preserve query parameters when switching languages
      navigate(`/${newLang}/front${location.search}`, { replace: true });
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