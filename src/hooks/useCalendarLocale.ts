import { useTranslation } from 'react-i18next';
import { pt, enUS, es, fr, Locale } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  pt: pt,
  en: enUS,
  es: es,
  fr: fr,
};

export const useCalendarLocale = (): Locale => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language?.split('-')[0] || 'pt';
  return localeMap[currentLanguage] || pt;
};
