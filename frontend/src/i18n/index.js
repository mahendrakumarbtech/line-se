import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import { getLocal, setLocal, STORAGE_KEYS } from "../utils/custom";

// STORAGE_KEYS me add: LANG: "linese_lang"

const saved = getLocal(STORAGE_KEYS.LANG) || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: saved,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lng) {
  setLocal(STORAGE_KEYS.LANG, lng);
  return i18n.changeLanguage(lng);
}

export default i18n;