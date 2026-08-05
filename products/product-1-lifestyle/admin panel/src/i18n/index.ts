import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./resources/en.json";
import bn from "./resources/bn.json";

const SUPPORTED_LANGS = ["en", "bn"] as const;

type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const normalizeLang = (lng: string | undefined | null): SupportedLang => {
  if (!lng) return "en";
  const base = lng.split("-")[0].toLowerCase();
  return (SUPPORTED_LANGS.includes(base as SupportedLang)
    ? (base as SupportedLang)
    : "en");
};

const applyDocumentLanguage = (lng: string | undefined | null) => {
  if (typeof document === "undefined") return;
  const resolved = normalizeLang(lng);
  const root = document.documentElement;
  const body = document.body;
  root.lang = resolved;
  root.classList.toggle("lang-bn", resolved === "bn");
  root.classList.toggle("lang-en", resolved === "en");
  if (body) {
    body.classList.toggle("lang-bn", resolved === "bn");
    body.classList.toggle("lang-en", resolved === "en");
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bn: { translation: bn }
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "app:lang",
      caches: ["localStorage"]
    },
    returnNull: false,
    returnEmptyString: false
  });

applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);

i18n.on("languageChanged", (lng) => {
  applyDocumentLanguage(lng);
});

export const setLanguage = (lng: SupportedLang) => i18n.changeLanguage(lng);
export const getLanguage = () => normalizeLang(i18n.resolvedLanguage ?? i18n.language);

export default i18n;
