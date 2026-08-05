import { sanitizeSearchQuery } from "@/lib/security/search";

const STORAGE_KEY = "shoplinkbd_recent_searches";
const MAX_RECENT = 8;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => sanitizeSearchQuery(item))
      .filter(Boolean)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRaw(items: string[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function getRecentSearches(): string[] {
  return readRaw();
}

export function addRecentSearch(term: string): string[] {
  const cleaned = sanitizeSearchQuery(term);
  if (!cleaned) return readRaw();

  const next = [
    cleaned,
    ...readRaw().filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
  ].slice(0, MAX_RECENT);

  writeRaw(next);
  return next;
}

export function removeRecentSearch(term: string): string[] {
  const cleaned = sanitizeSearchQuery(term).toLowerCase();
  const next = readRaw().filter((item) => item.toLowerCase() !== cleaned);
  writeRaw(next);
  return next;
}

export function clearRecentSearches(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* quota / private mode — ignore */
  }
}
