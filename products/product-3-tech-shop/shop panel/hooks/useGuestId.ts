"use client";

import { useAuthContext } from "@/context/AuthContext";
import {
  clearGuestIdStorage,
  ensureGuestId,
  getGuestIdFromStorage,
  isValidGuestId,
} from "@/lib/guest-order/guestId";
import { useCallback, useEffect, useState } from "react";

export {
  clearGuestIdStorage,
  ensureGuestId,
  getGuestIdFromStorage,
  isValidGuestId,
} from "@/lib/guest-order/guestId";

type UseGuestIdOptions = {
  /** Auto-load / generate on mount when guest */
  auto?: boolean;
};

/**
 * Guest order session id for checkout sync.
 * `refresh` reuses a valid stored id (does not mint a new one unless missing).
 */
export function useGuestId(options?: UseGuestIdOptions) {
  const auto = options?.auto ?? true;
  const { isAuthenticated } = useAuthContext();
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (isAuthenticated) {
      setId(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const next = ensureGuestId();
      setId(next);
      return next;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create guest session";
      setError(message);
      return getGuestIdFromStorage();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setId(null);
      setLoading(false);
      return;
    }

    const stored = getGuestIdFromStorage();
    if (stored && isValidGuestId(stored)) {
      setId(stored);
      setLoading(false);
      return;
    }

    if (!auto) {
      setLoading(false);
      return;
    }

    void refresh();
  }, [auto, isAuthenticated, refresh]);

  return { id, loading, error, refresh };
}
