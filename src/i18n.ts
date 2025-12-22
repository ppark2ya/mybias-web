import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./locales";

i18n
  .use(LanguageDetector) // ✅ Detect user browser language (navigator.language)
  .use(initReactI18next) // ✅ Connect with React
  .init({
    resources,
    supportedLngs: ["en", "ko", "es", "ja", "zh"], // Supported languages
    fallbackLng: "en", // Default language if detection fails
    debug: false, // Set to false in production

    interpolation: {
      escapeValue: false, // React already prevents XSS
    },

    // Detection options
    detection: {
      order: ["localStorage", "navigator", "htmlTag"], // Check localStorage first, then browser language
      caches: ["localStorage"], // Save selected language
      lookupLocalStorage: "i18nextLng",
      convertDetectedLanguage: (lng: string) => lng.split("-")[0], // Convert "ko-KR" to "ko"
    },
  });

export default i18n;
