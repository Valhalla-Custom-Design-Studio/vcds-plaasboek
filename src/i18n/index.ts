import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import af from './af.json';

export const i18n = new I18n({ en, af });
i18n.defaultLocale = 'af';
i18n.locale = 'af';
i18n.enableFallback = true;

export async function loadLocale() {
  try {
    const saved = await AsyncStorage.getItem('language');
    if (saved) i18n.locale = saved;
  } catch {}
}

export async function setLocale(lang: 'af' | 'en') {
  i18n.locale = lang;
  await AsyncStorage.setItem('language', lang);
}

export const t = (key: string, opts?: object) => i18n.t(key, opts);
