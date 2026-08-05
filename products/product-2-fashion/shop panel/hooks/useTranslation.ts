"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import en from "@/locales/en.json";
import bn from "@/locales/bn.json";

type TranslationDict = typeof en;

/**
 * Dot-path accessor for nested translation keys.
 * Example: get(t, "cart.title") → "Shopping Cart"
 */
function get(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return path; // fallback to key if not found
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === "string") return current;
  return path; // fallback to key
}

export type TranslationKey = string;

export function useTranslation() {
  const { language, isLangReady } = useLanguage();
  const dict = (language === "bn" ? bn : en) as Record<string, unknown>;

  const t = (key: TranslationKey): string => {
    return get(dict, key);
  };

  return { t, language, isLangReady };
}

export default useTranslation;
