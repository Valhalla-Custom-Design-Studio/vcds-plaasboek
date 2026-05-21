import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en.json';
import af from './af.json';

const i18n = new I18n({ en, af });
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
export type SupportedLocale = 'en' | 'af';
export const setLocale = (locale: SupportedLocale) => { i18n.locale = locale; };
export const t = (key: string, options?: object) => i18n.t(key, options);
