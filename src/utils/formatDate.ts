import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { af as afLocale, enZA } from 'date-fns/locale';
export type SupportedLocale = 'en' | 'af';
const LOCALES = { en: enZA, af: afLocale };
export const formatDate = (date: string | Date, locale: SupportedLocale = 'en', pattern = 'dd/MM/yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, pattern, { locale: LOCALES[locale] });
};
export const formatDateTime = (date: string | Date, locale: SupportedLocale = 'en'): string =>
  formatDate(date, locale, 'dd/MM/yyyy HH:mm');
export const formatRelativeDate = (date: string | Date, locale: SupportedLocale = 'en'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: LOCALES[locale] });
};
