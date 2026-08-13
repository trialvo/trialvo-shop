/**
 * lib/firebase.ts  — V2-050
 * Firebase app + FCM messaging singleton for Vellora (Next.js).
 *
 * Config is fetched from the API at runtime (GET /config/firebase-client-config)
 * and cached in localStorage. No hardcoded Firebase config in the codebase.
 */

"use client";

import { initializeApp, getApps, getApp, deleteApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

import { API_URL } from "@/config/env";

// ── Types ────────────────────────────────────────────────────────────────────
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

type CachedFirebaseConfig = {
  firebase_config: FirebaseConfig;
  vapid_key: string | null;
  config_version?: number;
};

// ── Cache key ────────────────────────────────────────────────────────────────
const CACHE_KEY = "gf_firebase_client_config";

/** Browser → same-origin BFF; server → configured API_URL. */
function firebaseConfigUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1/config/firebase-client-config";
  }
  return `${String(API_URL || "").replace(/\/+$/, "")}/api/v1/config/firebase-client-config`;
}

// ── In-memory singleton ──────────────────────────────────────────────────────
let _configPromise: Promise<CachedFirebaseConfig | null> | null = null;
let _firebaseApp: FirebaseApp | null = null;
let _configVersionChanged = false;

/**
 * Fetch Firebase client config from the API with localStorage caching.
 * Returns null if no config is configured in the DB.
 */
export async function getFirebaseConfig(): Promise<CachedFirebaseConfig | null> {
  if (_configPromise) return _configPromise;

  _configPromise = (async () => {
    // 1. Check localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedFirebaseConfig;
        if (parsed?.firebase_config?.apiKey) {
          // Trigger a background refresh (non-blocking)
          _refreshConfigInBackground();
          return parsed;
        }
      }
    } catch { /* ignore corrupt cache */ }

    // 2. Fetch from API
    return _fetchAndCacheConfig();
  })();

  return _configPromise;
}

async function _fetchAndCacheConfig(): Promise<CachedFirebaseConfig | null> {
  try {
    const res = await fetch(firebaseConfigUrl());
    const json = await res.json();
    if (json?.success && json?.data?.firebase_config) {
      const config: CachedFirebaseConfig = json.data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(config));
      return config;
    }
    return null;
  } catch (err) {
    console.warn("[FCM] Failed to fetch firebase client config:", err);
    return null;
  }
}

function _refreshConfigInBackground(): void {
  const oldCached = localStorage.getItem(CACHE_KEY);
  const oldVersion = oldCached ? (JSON.parse(oldCached) as CachedFirebaseConfig).config_version : undefined;
  _fetchAndCacheConfig().then((cfg) => {
    if (cfg && oldVersion !== undefined && cfg.config_version !== oldVersion) {
      console.info(`[FCM] Config version changed (${oldVersion} → ${cfg.config_version}). Will re-register token.`);
      _configVersionChanged = true;
    }
  }).catch(() => { /* silent */ });
}

/** Check if config_version changed since last token registration. */
export function consumeConfigVersionChanged(): boolean {
  if (_configVersionChanged) {
    _configVersionChanged = false;
    return true;
  }
  return false;
}

/**
 * Force-delete the existing FCM token and push subscription.
 * Call this before requestAndGetToken() when config version changes.
 */
export async function forceDeleteExistingToken(): Promise<void> {
  try {
    if (_firebaseApp) {
      try { await deleteApp(_firebaseApp); } catch { /* ignore */ }
      _firebaseApp = null;
    }
    const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        console.info("[FCM] Old push subscription unsubscribed.");
      }
    }
  } catch (err) {
    console.warn("[FCM] forceDeleteExistingToken error:", err);
  }
}

/**
 * Clear the cached config.
 */
export function clearFirebaseConfigCache(): void {
  localStorage.removeItem(CACHE_KEY);
  _configPromise = null;
}

// ── Re-exports for backwards compatibility ───────────────────────────────────
// These are no longer used as static imports but kept for consumers that check them.
export const FIREBASE_CONFIG = {} as FirebaseConfig;
export const FIREBASE_VAPID_KEY = "";

// ── Firebase App + Messaging ─────────────────────────────────────────────────

function getFirebaseApp(config: FirebaseConfig): FirebaseApp {
  if (!_firebaseApp) {
    _firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
  }
  return _firebaseApp;
}

function getFirebaseMessaging(config: FirebaseConfig): Messaging | null {
  try {
    if (typeof window === "undefined") return null;
    return getMessaging(getFirebaseApp(config));
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Request browser notification permission and return an FCM token.
 * Returns null if denied, not configured, or on error.
 */
export async function requestAndGetToken(): Promise<string | null> {
  try {
    const cfg = await getFirebaseConfig();
    if (!cfg?.firebase_config?.apiKey) {
      console.info("[FCM] No Firebase client config available. Push disabled.");
      return null;
    }

    if (!cfg.vapid_key) {
      console.warn("[FCM] VAPID_KEY is not set. Push token cannot be fetched.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info("[FCM] Notification permission denied.");
      return null;
    }

    const messaging = getFirebaseMessaging(cfg.firebase_config);
    if (!messaging) return null;

    // Register the SW and post config to it
    let swReg: ServiceWorkerRegistration | undefined;
    try {
      swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;
      const sw = swReg.active ?? swReg.installing ?? swReg.waiting;
      sw?.postMessage({ type: "FIREBASE_CONFIG", config: cfg.firebase_config });
    } catch {
      swReg = undefined;
    }

    const token = await getToken(messaging, {
      vapidKey: cfg.vapid_key,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      console.info("[FCM] Token obtained:", token.slice(0, 20) + "…");
      return token;
    }

    console.warn("[FCM] No token returned.");
    return null;
  } catch (err) {
    console.error("[FCM] requestAndGetToken error:", err);
    return null;
  }
}

/**
 * Subscribe to foreground messages. Returns an unsubscribe function.
 */
export function onForegroundMessage(
  handler: (payload: {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }) => void
): () => void {
  if (!_firebaseApp) return () => {};
  try {
    const messaging = getMessaging(_firebaseApp);
    return onMessage(messaging, handler);
  } catch {
    return () => {};
  }
}
