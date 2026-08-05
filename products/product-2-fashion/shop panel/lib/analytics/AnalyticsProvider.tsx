"use client";

/**
 * AnalyticsProvider
 *
 * Fetches analytics config from the API, initialises GTM + Clarity,
 * and exposes the config via React context to all children.
 *
 * ARCHITECTURE:
 * ─────────────
 * - GTM is the ONLY script we bootstrap here. FB Pixel and GA4 are
 *   loaded as GTM tags — not directly by this provider.
 * - Microsoft Clarity is initialized via initClarity() (injects script
 *   if not already loaded by next/script in layout.tsx).
 * - The GTM script tag itself is in layout.tsx via next/script "afterInteractive".
 *   initGTM() here only sets up the dataLayer array + gtm.start event.
 * - Auth state is pushed to dataLayer so GTM tags have user context.
 *
 * PERFORMANCE:
 * ─────────────
 * 1. Config cached in localStorage (stale-while-revalidate, 30 min TTL).
 * 2. SDK init deferred via requestIdleCallback — never blocks LCP or FID.
 * 3. Route-change page_view events deferred with setTimeout(0).
 */

import { analyticsConfigService } from "@/lib/api/analytics/config-service";
import { usePathname } from "next/navigation";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { initClarity, tagClarity } from "./clarity";
import { initGTM, pushDataLayer, pushUserContext } from "./gtm";
import type { AnalyticsConfig } from "./types";

/* ── localStorage cache ────────────────────────────────────── */

const CACHE_KEY = "analytics_config_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type CachedConfig = { config: AnalyticsConfig; timestamp: number };

function getCachedConfig(): AnalyticsConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedConfig = JSON.parse(raw);
    if (parsed?.config) return parsed.config;
  } catch { /* corrupted cache */ }
  return null;
}

function setCachedConfig(config: AnalyticsConfig): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ config, timestamp: Date.now() }));
  } catch { /* storage full */ }
}

function isCacheStale(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return true;
    const parsed: CachedConfig = JSON.parse(raw);
    return Date.now() - parsed.timestamp > CACHE_TTL_MS;
  } catch { return true; }
}

/* ── requestIdleCallback polyfill ──────────────────────────── */

const scheduleIdle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 50);

/* ── Context ───────────────────────────────────────────────── */

type AnalyticsCtx = { config: AnalyticsConfig | null; ready: boolean };

const AnalyticsContext = createContext<AnalyticsCtx>({ config: null, ready: false });

export const useAnalyticsConfig = () => useContext(AnalyticsContext);

/* ── Provider ──────────────────────────────────────────────── */

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const initDone = useRef(false);
  const isFirstPageView = useRef(true);

  /* 1 — Load config: cached first, then fetch */
  useEffect(() => {
    let cancelled = false;

    const cached = getCachedConfig();
    if (cached) { setConfig(cached); setReady(true); }

    const shouldFetch = !cached || isCacheStale();
    if (shouldFetch) {
      analyticsConfigService
        .getConfig()
        .then((res) => {
          if (cancelled) return;
          if (res.success && res.config) {
            setCachedConfig(res.config);
            setConfig(res.config);
          }
          setReady(true);
        })
        .catch(() => { if (!cancelled) setReady(true); });
    }

    return () => { cancelled = true; };
  }, []);

  /* 2 — Initialise GTM + Clarity (deferred until browser is idle) */
  useEffect(() => {
    if (!config) return;
    if (initDone.current) return;
    initDone.current = true;

    const env = config.meta?.environment ?? "production";
    const currency = config.meta?.currency ?? "BDT";

    scheduleIdle(() => {
      // ── GTM ────────────────────────────────────────────────
      // initGTM sets up the dataLayer + gtm.start event.
      // The actual <script> tag is in layout.tsx via next/script "afterInteractive".
      try {
        if (config.analytics?.google_tag_manager?.enabled) {
          initGTM(config.analytics.google_tag_manager);

          // Push initial page context — available to ALL subsequent GTM events
          pushDataLayer({
            event: "init",
            currency,
            environment: env,
            user_logged_in: false, // auth state updated below via pushUserContext
          });
        }
      } catch (err) {
        console.warn("[Analytics] GTM init error:", err);
      }

      // ── Microsoft Clarity ───────────────────────────────────
      try {
        if (config.analytics?.microsoft_clarity?.enabled) {
          initClarity(config.analytics.microsoft_clarity);
          // Tag the session with environment context
          tagClarity("env", env);
        }
      } catch (err) {
        console.warn("[Analytics] Clarity init error:", err);
      }
    });
  }, [config]);

  /* 3 — Push user context to GTM whenever userQuery resolves */
  /* We get user from AnalyticsContext but it's not loaded here   */
  /* Instead read from AuthCookies in an effect                    */
  useEffect(() => {
    if (!config?.analytics?.google_tag_manager?.enabled) return;
    // Attempt to read user from AuthCookies (no import cycle)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AuthCookies = require("@/lib/auth/cookies").default;
      const user = AuthCookies.getUser();
      pushUserContext({
        user_logged_in: !!user,
        ...(user?.id
          ? { user_data: { external_id: String(user.id) } }
          : {}),
      });
    } catch {
      /* AuthCookies not available in SSR — skip */
    }
  }, [config]);

  /* 4 — Auto page_view on route changes */
  useEffect(() => {
    if (!config?.tracking?.auto_page_view) return;
    if (!config.analytics?.google_tag_manager?.enabled) return;

    // Skip the very first page_view: GTM fires it automatically on load
    if (isFirstPageView.current) {
      isFirstPageView.current = false;
      return;
    }

    const timer = setTimeout(() => {
      try {
        pushDataLayer({
          event: "page_view",
          page_location: typeof window !== "undefined" ? window.location.href : "",
          page_path: pathname,
        });
      } catch { /* noop */ }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname, config]);

  return (
    <AnalyticsContext.Provider value={{ config, ready }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
