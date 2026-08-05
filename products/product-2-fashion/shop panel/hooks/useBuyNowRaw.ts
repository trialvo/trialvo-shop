"use client";

import * as React from "react";

export const BUY_NOW_KEY = "BUY_NOW_ITEM";
export const BUY_NOW_EVENT = "buyNow:change";

function safeGetBuyNowRaw(): string | null {
  try {
    return window.localStorage.getItem(BUY_NOW_KEY);
  } catch {
    return null;
  }
}

export function useBuyNowRaw(): string | null {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => {};

    const onStorage = (e: StorageEvent) => {
      if (e.key === BUY_NOW_KEY) onStoreChange();
    };

    const onBuyNowChange = () => {
      onStoreChange();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(BUY_NOW_EVENT, onBuyNowChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BUY_NOW_EVENT, onBuyNowChange);
    };
  }, []);

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    return safeGetBuyNowRaw();
  }, []);

  const getServerSnapshot = React.useCallback(() => null, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function emitBuyNowChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BUY_NOW_EVENT));
}
