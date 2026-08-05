"use client";

/**
 * useCompareStore
 * Lightweight client-side store (localStorage + React context) for the compare feature.
 * Holds up to 2 product slots. Components can call addToCompare / removeFromCompare / clearCompare.
 * On the /compare page the ProductComparator reads these slots and auto-loads comparison.
 */

import * as React from "react";
import type { ProductListItem } from "@/lib/api/product/service";

export type CompareSlot = Pick<ProductListItem, "id" | "name" | "slug" | "images"> & {
  thumbnail?: string | null;
};

interface CompareStore {
  slots: [CompareSlot | null, CompareSlot | null];
  addToCompare: (product: CompareSlot) => void;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
  isFull: boolean;
}

const CompareContext = React.createContext<CompareStore | null>(null);

const STORAGE_KEY = "gf_compare_slots";

function loadFromStorage(): [CompareSlot | null, CompareSlot | null] {
  if (typeof window === "undefined") return [null, null];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [null, null];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 2) {
      return [parsed[0] ?? null, parsed[1] ?? null];
    }
  } catch {}
  return [null, null];
}

function saveToStorage(slots: [CompareSlot | null, CompareSlot | null]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)); } catch {}
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = React.useState<[CompareSlot | null, CompareSlot | null]>([null, null]);

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    setSlots(loadFromStorage());
  }, []);

  const addToCompare = React.useCallback((product: CompareSlot) => {
    setSlots(prev => {
      // Already in compare — no-op
      if (prev[0]?.id === product.id || prev[1]?.id === product.id) return prev;
      let next: [CompareSlot | null, CompareSlot | null];
      if (prev[0] === null) next = [product, prev[1]];
      else if (prev[1] === null) next = [prev[0], product];
      else next = [prev[0], product]; // Replace slot B when full
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeFromCompare = React.useCallback((productId: number) => {
    setSlots(prev => {
      const next: [CompareSlot | null, CompareSlot | null] = [
        prev[0]?.id === productId ? null : prev[0],
        prev[1]?.id === productId ? null : prev[1],
      ];
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearCompare = React.useCallback(() => {
    const empty: [CompareSlot | null, CompareSlot | null] = [null, null];
    saveToStorage(empty);
    setSlots(empty);
  }, []);

  const isInCompare = React.useCallback((productId: number) => {
    return slots[0]?.id === productId || slots[1]?.id === productId;
  }, [slots]);

  const isFull = slots[0] !== null && slots[1] !== null;

  const value = React.useMemo(() => ({
    slots, addToCompare, removeFromCompare, clearCompare, isInCompare, isFull
  }), [slots, addToCompare, removeFromCompare, clearCompare, isInCompare, isFull]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompareStore(): CompareStore {
  const ctx = React.useContext(CompareContext);
  if (!ctx) throw new Error("useCompareStore must be used inside <CompareProvider>");
  return ctx;
}
