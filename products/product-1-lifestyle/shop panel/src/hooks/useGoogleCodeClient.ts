"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AuthCookies from "@/lib/auth/cookies";

type GoogleCodeResponse = {
  code?: string;
  scope?: string;
  state?: string;
};

type GoogleCodeClient = {
  requestCode: () => void;
};

type GoogleCodeClientConfig = {
  client_id: string;
  scope: string;
  ux_mode: "popup";
  state: string;
  callback: (response: GoogleCodeResponse) => void;
  error_callback?: (error: { type?: string }) => void;
};

type GoogleNamespace = {
  accounts: {
    oauth2: {
      initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
    };
  };
};

export type GoogleAuthPayload = {
  code: string;
  state: string;
  source: "code";
};

type UseGoogleCodeClientArgs = {
  clientId: string;
  scope?: string;
  onAuth: (payload: GoogleAuthPayload) => void | Promise<void>;
  onError?: (message: string) => void;
};

declare global {
  interface Window {
    google?: unknown;
  }
}

const GOOGLE_SDK_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_READY_TIMEOUT_MS = 5000;
const GOOGLE_REQUEST_TIMEOUT_MS = 30000;

let sdkLoadPromise: Promise<void> | null = null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasGoogleCodeClient = (google: unknown): google is GoogleNamespace => {
  if (!isRecord(google)) return false;

  const accounts = google.accounts;
  if (!isRecord(accounts)) return false;

  const oauth2 = accounts.oauth2;
  if (!isRecord(oauth2)) return false;

  return typeof oauth2.initCodeClient === "function";
};

const ensureGoogleScript = (): Promise<void> => {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    if (hasGoogleCodeClient(window.google)) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SDK_SRC}"]`,
    );
    const script =
      existing ??
      (() => {
        const element = document.createElement("script");
        element.src = GOOGLE_SDK_SRC;
        element.async = true;
        element.defer = true;
        document.head.appendChild(element);
        return element;
      })();

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const onLoad = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      sdkLoadPromise = null;
      reject(new Error("Failed to load Google sign-in"));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    const startedAt = Date.now();
    const poll = () => {
      if (hasGoogleCodeClient(window.google)) {
        cleanup();
        resolve();
        return;
      }

      if (Date.now() - startedAt > GOOGLE_READY_TIMEOUT_MS) {
        cleanup();
        resolve();
        return;
      }

      window.setTimeout(poll, 50);
    };

    poll();
  });

  return sdkLoadPromise;
};

const waitForGoogle = (maxMs: number): Promise<GoogleNamespace> => {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      if (hasGoogleCodeClient(window.google)) {
        resolve(window.google);
        return;
      }

      if (Date.now() - startedAt > maxMs) {
        reject(new Error("Google sign-in is not available"));
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
};

const createOAuthState = (): string => {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export function useGoogleCodeClient({
  clientId,
  scope = "openid email profile",
  onAuth,
  onError,
}: UseGoogleCodeClientArgs) {
  const [ready, setReady] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const clientRef = useRef<GoogleCodeClient | null>(null);
  const googleRef = useRef<GoogleNamespace | null>(null);
  const oauthStateRef = useRef<string | null>(null);
  const requestInFlightRef = useRef(false);
  const releaseTimerRef = useRef<number | null>(null);
  const onAuthRef = useRef(onAuth);
  const onErrorRef = useRef(onError);

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimerRef.current === null) return;
    window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = null;
  }, []);

  const releaseRequestLock = useCallback(() => {
    requestInFlightRef.current = false;
    setIsRequesting(false);
    clearReleaseTimer();
  }, [clearReleaseTimer]);

  useEffect(() => {
    onAuthRef.current = onAuth;
    onErrorRef.current = onError;
  }, [onAuth, onError]);

  useEffect(() => {
    let mounted = true;

    setReady(false);
    releaseRequestLock();
    clientRef.current = null;
    googleRef.current = null;

    if (!clientId) {
      onErrorRef.current?.("Missing Google client ID");
      return;
    }

    ensureGoogleScript()
      .then(() => waitForGoogle(GOOGLE_READY_TIMEOUT_MS))
      .then((google) => {
        if (!mounted) return;

        googleRef.current = google;
        setReady(true);
      })
      .catch((error) => {
        releaseRequestLock();
        const message =
          error instanceof Error ? error.message : "Google sign-in failed";
        onErrorRef.current?.(message);
      });

    return () => {
      mounted = false;
      AuthCookies.removeOAuthState();
      releaseRequestLock();
    };
  }, [clientId, releaseRequestLock]);

  const createClient = useCallback(
    (state: string): GoogleCodeClient | null => {
      const google = googleRef.current;
      if (!google) return null;

      return google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope,
          ux_mode: "popup",
          state,
          callback: async (response) => {
            if (!response.code) {
              releaseRequestLock();
              onErrorRef.current?.("Google did not return an auth code");
              return;
            }

            if (!response.state || response.state !== oauthStateRef.current) {
              AuthCookies.removeOAuthState();
              releaseRequestLock();
              onErrorRef.current?.("Google sign-in state validation failed");
              return;
            }

            try {
              await Promise.resolve(
                onAuthRef.current({
                  code: response.code,
                  state: response.state,
                  source: "code",
                }),
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Google sign-in failed";
              onErrorRef.current?.(message);
            } finally {
              AuthCookies.removeOAuthState();
              releaseRequestLock();
            }
          },
          error_callback: (error) => {
            releaseRequestLock();

            const type = error.type?.trim();
            if (type === "popup_closed" || type === "popup_closed_by_user") {
              return;
            }

            onErrorRef.current?.(
              type ? `Google sign-in error: ${type}` : "Google sign-in failed",
            );
          },
        });
    },
    [clientId, scope, releaseRequestLock],
  );

  const requestCode = useCallback(() => {
    if (!ready || requestInFlightRef.current) return;

    const state = createOAuthState();
    oauthStateRef.current = state;
    AuthCookies.setOAuthState(state);
    clientRef.current = createClient(state);

    if (!clientRef.current) {
      AuthCookies.removeOAuthState();
      releaseRequestLock();
      onErrorRef.current?.("Google sign-in is not available");
      return;
    }

    requestInFlightRef.current = true;
    setIsRequesting(true);
    clearReleaseTimer();
    releaseTimerRef.current = window.setTimeout(
      releaseRequestLock,
      GOOGLE_REQUEST_TIMEOUT_MS,
    );

    try {
      clientRef.current?.requestCode();
    } catch {
      AuthCookies.removeOAuthState();
      releaseRequestLock();
      onErrorRef.current?.("Google popup could not be opened. Please try again.");
    }
  }, [clearReleaseTimer, createClient, ready, releaseRequestLock]);

  return { ready, requestCode, isRequesting };
}
