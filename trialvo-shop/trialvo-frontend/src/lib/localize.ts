import type { LocalizedString, MarketplaceLanguage } from "@/types/marketplace";

/** Pick bn/en text with a safe English fallback */
export function localize(
  value: LocalizedString | { bn?: string; en?: string } | null | undefined,
  language: MarketplaceLanguage,
  fallback = "",
): string {
  if (!value) return fallback;
  const preferred = value[language];
  if (preferred && preferred.trim()) return preferred;
  if (value.en && value.en.trim()) return value.en;
  if (value.bn && value.bn.trim()) return value.bn;
  return fallback;
}
