import { I18n } from 'i18n-js';
import en from './en.json';
import af from './af.json';

const i18n = new I18n({ en, af });
i18n.defaultLocale = 'af';
i18n.locale = 'af';
i18n.enableFallback = true;

export default i18n;
