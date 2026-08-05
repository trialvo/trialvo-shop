/**
 * Microsoft Clarity helper.
 *
 * Clarity captures session recordings, heatmaps, and user behaviour analytics.
 * https://clarity.microsoft.com
 */

import type { MicrosoftClarityConfig } from "./types";

/* ── Global Clarity declaration ────────────────────────────── */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clarity?: (...args: any[]) => void;
  }
}

/* ── Internal state ─────────────────────────────────────────── */

let clarityInitialised = false;

/* ── Initialisation ─────────────────────────────────────────── */

export function initClarity(config: MicrosoftClarityConfig): void {
  if (typeof window === "undefined") return;
  if (!config.enabled || !config.project_id) return;
  if (clarityInitialised) return;

  try {
    clarityInitialised = true;

    // Standard Microsoft Clarity inline snippet
    const script = document.createElement("script");
    script.textContent =
      "(function(c,l,a,r,i,t,y){" +
      "c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};" +
      "t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;" +
      "y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);" +
      "})(window,document,'clarity','script','" +
      config.project_id +
      "');";

    document.head.appendChild(script);

    if (process.env.NODE_ENV === "development") {
      console.info(
        "[Analytics] Microsoft Clarity initialised:",
        config.project_id,
      );
    }
  } catch (err) {
    console.warn("[Analytics] Clarity init failed:", err);
    clarityInitialised = false;
  }
}

/* ── User identification ────────────────────────────────────── */

/**
 * Identify a logged-in user so Clarity can stitch sessions across devices.
 * Call this after the user signs in.
 */
export function clarityIdentify(
  userId: string,
  sessionId?: string,
  friendlyName?: string,
): void {
  if (typeof window === "undefined" || !clarityInitialised) return;

  try {
    if (typeof window.clarity === "function") {
      window.clarity("identify", userId, sessionId, friendlyName);
    }
  } catch {
    /* noop */
  }
}

/* ── Custom tags ─────────────────────────────────────────────── */

/**
 * Set a custom tag on the current session.
 * These appear as filters in the Clarity dashboard.
 */
export function claritySetTag(key: string, value: string): void {
  if (typeof window === "undefined" || !clarityInitialised) return;

  try {
    if (typeof window.clarity === "function") {
      window.clarity("set", key, value);
    }
  } catch {
    /* noop */
  }
}

/* ── Custom events ───────────────────────────────────────────── */

/**
 * Fire a custom Clarity event (e.g. "add_to_cart", "purchase").
 * These are visible in Clarity's event analysis.
 */
export function clarityEvent(eventName: string): void {
  if (typeof window === "undefined" || !clarityInitialised) return;

  try {
    if (typeof window.clarity === "function") {
      window.clarity("event", eventName);
    }
  } catch {
    /* noop */
  }
}
