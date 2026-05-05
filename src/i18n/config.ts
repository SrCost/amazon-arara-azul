import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
    },
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en', 'es', 'fr', 'de'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Keep <html lang> in sync with the active language for SEO/accessibility
const syncHtmlLang = (lng: string) => {
  const base = (lng || 'pt').split('-')[0];
  const map: Record<string, string> = {
    pt: 'pt-BR',
    en: 'en',
    es: 'es',
    fr: 'fr',
    de: 'de',
  };
  if (typeof document !== 'undefined') {
    document.documentElement.lang = map[base] ?? base;
  }
};

syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
