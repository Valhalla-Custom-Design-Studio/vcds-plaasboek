import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/en.json';
import af from '../i18n/af.json';

type Lang = 'en' | 'af';
const translations: Record<Lang, Record<string, any>> = { en, af };

function getNestedValue(obj: Record<string, any>, key: string): string {
  return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : key), obj) as string;
}

interface LanguageContextType {
  lang: Lang;
  language: Lang; // alias for lang
  setLang: (lang: Lang) => void;
  setLanguage: (lang: Lang) => void; // alias for setLang
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('af');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(saved => {
      if (saved === 'en' || saved === 'af') setLangState(saved);
    }).catch((e) => console.warn('[LanguageContext]', e));
  }, []);

  const setLang = async (newLang: Lang) => {
    setLangState(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  const toggleLanguage = () => setLang(lang === 'af' ? 'en' : 'af');

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[lang], key);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, setLanguage: setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
