"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Options = {
  storageKey: string;
  cooldownSeconds?: number;
  autoStart?: boolean;

  resetOnUnmount?: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatMMSS = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
};

const parseNumber = (raw: string | null) => {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export function usePersistedResendTimer({
  storageKey,
  cooldownSeconds = 180,
  autoStart = true,
  resetOnUnmount = false,
}: Options) {
  const [hydrated, setHydrated] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const endRef = useRef<number | null>(null);
  const nowRef = useRef<number>(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const now = Date.now();
      nowRef.current = now;

      const stored = parseNumber(window.localStorage.getItem(storageKey));
      if (stored && stored > now) {
        endRef.current = stored;
        setRemainingSeconds(Math.ceil((stored - now) / 1000));
        setHydrated(true);
        return;
      }

      window.localStorage.removeItem(storageKey);

      if (autoStart) {
        const end = now + cooldownSeconds * 1000;
        endRef.current = end;
        window.localStorage.setItem(storageKey, String(end));
        setRemainingSeconds(cooldownSeconds);
      } else {
        endRef.current = null;
        setRemainingSeconds(0);
      }

      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(t);
  }, [storageKey, cooldownSeconds, autoStart]);

  useEffect(() => {
    if (!hydrated) return;

    const id = window.setInterval(() => {
      const now = Date.now();
      nowRef.current = now;

      const end = endRef.current;
      if (!end) return;

      const left = Math.ceil((end - now) / 1000);
      if (left <= 0) {
        endRef.current = null;
        window.localStorage.removeItem(storageKey);
        setRemainingSeconds(0);
        return;
      }

      setRemainingSeconds(left);
    }, 1000);

    return () => window.clearInterval(id);
  }, [hydrated, storageKey]);

  useEffect(() => {
    if (!resetOnUnmount) return;

    return () => {
      endRef.current = null;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    };
  }, [resetOnUnmount, storageKey]);

  const canResend = hydrated && remainingSeconds <= 0;

  const restart = () => {
    if (!hydrated) return;
    if (!nowRef.current) return;

    const end = nowRef.current + cooldownSeconds * 1000;
    endRef.current = end;
    window.localStorage.setItem(storageKey, String(end));
    setRemainingSeconds(cooldownSeconds);
  };

  const clear = () => {
    if (!hydrated) return;
    endRef.current = null;
    window.localStorage.removeItem(storageKey);
    setRemainingSeconds(0);
  };

  const formatted = useMemo(() => formatMMSS(Math.max(0, remainingSeconds)), [remainingSeconds]);

  return {
    hydrated,
    remainingSeconds,
    formatted,
    canResend,
    restart,
    clear,
  };
}
