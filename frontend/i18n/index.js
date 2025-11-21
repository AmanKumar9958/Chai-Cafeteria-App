// frontend/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

// Synchronous safe init with English fallback
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Async language resolution with defensive dynamic import.
// Avoid hard import of expo-localization so app does not crash if native module is missing/not built yet.
(async () => {
  let targetLang = 'en';
  try {
    const saved = await AsyncStorage.getItem('app_lang');
    if (saved) {
      targetLang = saved;
    } else {
      try {
        const Localization = await import('expo-localization');
        const locales = Localization.getLocales?.();
        if (Array.isArray(locales) && locales.length) {
          const code = locales[0].languageCode || 'en';
          targetLang = code.startsWith('hi') ? 'hi' : 'en';
        } else if (Localization.locale) {
          const code = Localization.locale.split('-')[0];
          targetLang = code.startsWith('hi') ? 'hi' : 'en';
        }
      } catch (e) {
        // expo-localization not available yet; keep 'en'
        console.warn('[i18n] expo-localization unavailable, falling back to en');
      }
    }
  } catch (e) {
    // storage read failed; keep 'en'
  }
  if (targetLang !== i18n.language) {
    try { await i18n.changeLanguage(targetLang); } catch {}
  }
})();

export async function setLanguage(lang) {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('app_lang', lang);
  } catch {}
}

export default i18n;
