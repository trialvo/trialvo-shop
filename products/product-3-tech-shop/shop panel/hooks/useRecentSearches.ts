"use client";

import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/search/recentSearches";
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

/** Stable snapshot cache so useSyncExternalStore does not infinite-loop */
let cachedRecent: string[] = [];
/** `null` means cache is dirty and must be re-read from storage */
let cachedKey: string | null = null;

function readCached(): string[] {
  const next = getRecentSearches();
  const key = next.join("\0");
  // Must treat null as dirty — empty list also has key "" so `cachedKey = ""`
  // in emit() previously prevented clear()/forget-last from updating UI
  if (cachedKey === null || key !== cachedKey) {
    cachedKey = key;
    cachedRecent = next;
  }
  return cachedRecent;
}

function emit(): void {
  cachedKey = null;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Must be a stable reference — a fresh [] each call causes an infinite re-render loop */
const EMPTY_RECENT: string[] = [];

function getServerSnapshot(): string[] {
  return EMPTY_RECENT;
}

export const useRecentSearches = () => {
  const recent = useSyncExternalStore(subscribe, readCached, getServerSnapshot);

  const remember = useCallback((term: string) => {
    addRecentSearch(term);
    emit();
  }, []);

  const forget = useCallback((term: string) => {
    removeRecentSearch(term);
    emit();
  }, []);

  const clear = useCallback(() => {
    clearRecentSearches();
    emit();
  }, []);

  return { recent, remember, forget, clear } as const;
};
