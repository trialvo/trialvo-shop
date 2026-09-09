import type { MarketplaceLanguage } from "@/types/marketplace";

/**
 * Month helpers shared by the wizard, home page and status hub so "3 months"
 * and its end date are formatted identically everywhere.
 */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** 3 → "৩" in Bengali, unchanged in English. */
export function localizeNumber(n: number, language: MarketplaceLanguage): string {
  const s = String(n);
  if (language !== "bn") return s;
  return s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** "1 month" / "৩ মাস" */
export function monthsLabel(months: number, language: MarketplaceLanguage): string {
  const n = localizeNumber(months, language);
  if (language === "bn") return `${n} মাস`;
  return `${n} month${months === 1 ? "" : "s"}`;
}

/** "1–3 months" / "১–৩ মাস" — collapses to a single value when only one preset exists. */
export function monthsRangeLabel(presets: number[], language: MarketplaceLanguage): string {
  const list = [...new Set(presets)].sort((a, b) => a - b);
  if (list.length === 0) return monthsLabel(1, language);
  if (list.length === 1) return monthsLabel(list[0], language);
  const lo = localizeNumber(list[0], language);
  const hi = localizeNumber(list[list.length - 1], language);
  return language === "bn" ? `${lo}–${hi} মাস` : `${lo}–${hi} months`;
}

/** "up to 3 months" / "৩ মাস পর্যন্ত" */
export function upToMonthsLabel(maxMonths: number, language: MarketplaceLanguage): string {
  const n = localizeNumber(maxMonths, language);
  return language === "bn" ? `${n} মাস পর্যন্ত` : `up to ${n} month${maxMonths === 1 ? "" : "s"}`;
}

/** Calendar-accurate end date `months` from `from` (defaults to today). */
export function endDateForMonths(months: number, from = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function formatDate(date: Date | string, language: MarketplaceLanguage): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "12 days left" / "১২ দিন বাকি" */
export function daysLeftLabel(days: number, language: MarketplaceLanguage): string {
  const n = localizeNumber(Math.max(0, days), language);
  if (language === "bn") return `${n} দিন বাকি`;
  return `${n} day${days === 1 ? "" : "s"} left`;
}
