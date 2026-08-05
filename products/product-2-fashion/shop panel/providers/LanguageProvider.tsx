"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "bn";

type LanguageContextType = {
 language: Language | null;
 isLangReady: boolean;
 toggleLanguage: () => void;
 setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType>({
 language: null,
 isLangReady: false,
 toggleLanguage: () => { },
 setLanguage: () => { },
});

const STORAGE_KEY = "app_language";
const DEFAULT_LANG: Language = "bn";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [language, setLanguageState] = useState<Language | null>(null);

 // Sync from localStorage on mount
 useEffect(() => {
  if (typeof window !== "undefined") {
   const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
   const resolved = stored === "en" || stored === "bn" ? stored : DEFAULT_LANG;
   setLanguageState(resolved);
   document.documentElement.lang = resolved;
  }
 }, []);

 const isLangReady = language !== null;

 const setLanguage = useCallback((lang: Language) => {
  setLanguageState(lang);
  if (typeof window !== "undefined") {
   localStorage.setItem(STORAGE_KEY, lang);
   document.documentElement.lang = lang;
  }
 }, []);

 const toggleLanguage = useCallback(() => {
  setLanguageState((prev) => {
   const next: Language = prev === "en" ? "bn" : "en";
   if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
   }
   return next;
  });
 }, []);

 return (
  <LanguageContext.Provider value={{ language, isLangReady, toggleLanguage, setLanguage }}>
   {children}
  </LanguageContext.Provider>
 );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
