"use client";

import * as React from "react";

type CodeResponse = {
  code: string;
  scope?: string;
};

type RequestCodeConfig = {
  redirect_uri?: string;
};

type CodeClient = {
  requestCode: (config?: RequestCodeConfig) => void;
};

type InitCodeClientConfig = {
  client_id: string;
  scope: string;
  ux_mode?: "popup";
  callback: (resp: CodeResponse) => void;
  error_callback?: (err: { type: string }) => void;
};

type GoogleOauth2 = {
  initCodeClient: (config: InitCodeClientConfig) => CodeClient;
};

type GoogleAccounts = {
  oauth2: GoogleOauth2;
};

type GoogleNamespace = {
  accounts: GoogleAccounts;
};

export type GoogleAuthPayload = {
  code?: string;
  idToken?: string;
  source: "code" | "id_token";
};

declare global {
  interface Window {
    google?: unknown;
  }
}

const GOOGLE_SDK_SRC = "https://accounts.google.com/gsi/client";

let sdkLoadPromise: Promise<void> | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasInitCodeClient(google: unknown): google is GoogleNamespace {
  if (!isRecord(google)) return false;

  const accounts = google["accounts"];
  if (!isRecord(accounts)) return false;

  const oauth2 = accounts["oauth2"];
  if (!isRecord(oauth2)) return false;

  const initCodeClient = oauth2["initCodeClient"];
  return typeof initCodeClient === "function";
}

function ensureGoogleScript(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    if (hasInitCodeClient(window.google)) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SDK_SRC}"]`);
    const script =
      existing ??
      (() => {
        const s = document.createElement("script");
        s.src = GOOGLE_SDK_SRC;
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
        return s;
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
      reject(new Error("Failed to load Google SDK"));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    const start = Date.now();
    const poll = () => {
      if (hasInitCodeClient(window.google)) {
        cleanup();
        resolve();
        return;
      }
      if (Date.now() - start > 3500) {
        // don't reject here; `waitForGoogle` will handle the final error message
        cleanup();
        resolve();
        return;
      }
      window.setTimeout(poll, 50);
    };

    poll();
  });

  return sdkLoadPromise;
}

function waitForGoogleReady(maxMs: number): Promise<GoogleNamespace> {
  const start = Date.now();

  return new Promise<GoogleNamespace>((resolve, reject) => {
    const tick = () => {
      if (hasInitCodeClient(window.google)) {
        resolve(window.google);
        return;
      }

      if (Date.now() - start > maxMs) {
        reject(new Error("Google SDK not available"));
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
}

type Args = {
  clientId: string;
  scope?: string;
  onAuth: (payload: GoogleAuthPayload) => void | Promise<void>;
  onError?: (message: string) => void;
};

export function useGoogleCodeClient({
  clientId,
  scope = "openid email profile",
  onAuth,
  onError,
}: Args) {
  const [ready, setReady] = React.useState<boolean>(false);
  const [isRequesting, setIsRequesting] = React.useState<boolean>(false);
  const clientRef = React.useRef<CodeClient | null>(null);
  const requestInFlightRef = React.useRef<boolean>(false);
  const releaseTimerRef = React.useRef<number | null>(null);

  const onAuthRef = React.useRef<Args["onAuth"]>(onAuth);
  const onErrorRef = React.useRef<Args["onError"]>(onError);

  const clearReleaseTimer = React.useCallback(() => {
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

  const releaseRequestLock = React.useCallback(() => {
    requestInFlightRef.current = false;
    setIsRequesting(false);
    clearReleaseTimer();
  }, [clearReleaseTimer]);

  React.useEffect(() => {
    onAuthRef.current = onAuth;
    onErrorRef.current = onError;
  }, [onAuth, onError]);

  React.useEffect(() => {
    let mounted = true;

    setReady(false);
    releaseRequestLock();
    clientRef.current = null;

    if (!clientId) {
      onErrorRef.current?.("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    ensureGoogleScript()
      .then(() => waitForGoogleReady(5000))
      .then((google) => {
        if (!mounted) return;

        const client = google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope,
          ux_mode: "popup",
          callback: async (resp) => {
            if (!resp?.code) {
              releaseRequestLock();
              onErrorRef.current?.("No code returned from Google");
              return;
            }
            try {
              await Promise.resolve(onAuthRef.current({ code: resp.code, source: "code" }));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Google auth failed";
              onErrorRef.current?.(msg);
            } finally {
              releaseRequestLock();
            }
          },
          error_callback: (err) => {
            releaseRequestLock();

            const type = err?.type?.trim();
            if (type === "popup_closed" || type === "popup_closed_by_user") {
              // User cancelled popup; avoid noisy console errors.
              return;
            }

            const msg = err?.type ? `Google auth error: ${err.type}` : "Google auth error";
            onErrorRef.current?.(msg);
          },
        });

        clientRef.current = client;
        setReady(true);
      })
      .catch((e: unknown) => {
        releaseRequestLock();
        const msg = e instanceof Error ? e.message : "Google auth error";
        onErrorRef.current?.(msg);
      });

    return () => {
      mounted = false;
      releaseRequestLock();
    };
  }, [clientId, scope, releaseRequestLock]);

  const requestCode = async () => {
    if (!ready || requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    setIsRequesting(true);
    clearReleaseTimer();
    releaseTimerRef.current = window.setTimeout(() => {
      releaseRequestLock();
    }, 30000);

    try {
      clientRef.current?.requestCode();
    } catch {
      releaseRequestLock();
      onErrorRef.current?.("Google popup could not be opened. Please try again.");
    }
  };

  return { ready, requestCode, isRequesting };
}
