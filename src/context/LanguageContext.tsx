import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n, setLocale } from '../i18n';

interface LanguageContextType {
  language: 'af' | 'en';
  toggleLanguage: () => void;
  t: (key: string, opts?: object) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'af',
  toggleLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'af' | 'en'>('af');

  useEffect(() => {
    AsyncStorage.getItem('language').then(lang => {
      if (lang === 'af' || lang === 'en') {
        setLanguage(lang);
        i18n.locale = lang;
      }
    });
  }, []);

  const toggleLanguage = async () => {
    const next = language === 'af' ? 'en' : 'af';
    await setLocale(next);
    setLanguage(next);
  };

  const t = (key: string, opts?: object) => i18n.t(key, opts);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
