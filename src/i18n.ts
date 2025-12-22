import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./locales";

i18n
  .use(LanguageDetector) // ✅ Detect user browser language (navigator.language)
  .use(initReactI18next) // ✅ Connect with React
  .init({
    resources,
    fallbackLng: "en", // Default language if detection fails
    debug: false, // Set to false in production

    interpolation: {
      escapeValue: false, // React already prevents XSS
    },

    // Detection options
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"], // Save selected language in browser
    },
  });

export default i18n;
