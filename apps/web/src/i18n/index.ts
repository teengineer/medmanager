import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  const chain = isBrowser ? i18n.use(LanguageDetector) : i18n;
  void chain.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    lng: isBrowser ? undefined : "tr",
    fallbackLng: "tr",
    supportedLngs: ["tr", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "bundanvar.lang",
    },
  });
}

export default i18n;
