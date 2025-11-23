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
    }
    // Default to English if no saved language is found
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
