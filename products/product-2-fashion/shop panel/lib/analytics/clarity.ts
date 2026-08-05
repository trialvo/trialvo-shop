/**
 * Microsoft Clarity SDK helper.
 *
 * Microsoft Clarity is a free session recording and heatmap tool.
 * It does NOT require any server-side work — it is purely client-side.
 *
 * SETUP:
 * 1. Go to https://clarity.microsoft.com and create a project.
 * 2. Add your Project ID to system_config (CLARITY_PROJECT_ID).
 * 3. The admin analytics config screen will expose an on/off toggle (CLARITY_ENABLED).
 *
 * The actual <script> tag is loaded by next/script in layout.tsx via strategy="afterInteractive".
 * This file only handles the Clarity API calls (identify, set) made AFTER the script loads.
 */

import type { MicrosoftClarityConfig } from "./types";

/* ── Global type declaration ───────────────────────────────── */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clarity?: (...args: any[]) => void;
  }
}

/* ── Internal state ────────────────────────────────────────── */

let clarityConfig: MicrosoftClarityConfig | null = null;

/* ── Initialization ────────────────────────────────────────── */

/**
 * Injects the Microsoft Clarity tracking snippet.
 * Called once from AnalyticsProvider when config is loaded.
 *
 * NOTE: The script is loaded via next/script in layout.tsx.
 * This function only stores the config for canTrack() checks.
 */
export function initClarity(config: MicrosoftClarityConfig): void {
  if (typeof window === "undefined") return;
  if (!config.enabled || !config.project_id) return;

  clarityConfig = config;

  // If the script hasn't loaded yet (window.clarity is undefined),
  // we create a stub that queues calls until the script loads.
  // This is the same pattern as the official Clarity snippet.
  if (!window.clarity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queue: any[][] = [];
    window.clarity = function (...args) {
      queue.push(args);
    };

    // Once the real script loads, it replaces window.clarity and flushes the queue.
    // The official Clarity snippet handles this automatically.
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${config.project_id}`;
    script.onload = () => {
      if (typeof window.clarity === "function") {
        queue.forEach((args) => window.clarity!(...args));
      }
    };
    document.head.appendChild(script);
  }
}

/* ── Helpers ───────────────────────────────────────────────── */

function canTrack(): boolean {
  return !!(
    clarityConfig?.enabled &&
    typeof window !== "undefined" &&
    typeof window.clarity === "function"
  );
}

/* ── Identity ──────────────────────────────────────────────── */

/**
 * Links a Clarity session to a specific user.
 * Call this when a user logs in so Clarity session recordings
 * are searchable by user ID.
 *
 * @param userId - Your internal user ID (will be shown in Clarity dashboard)
 * @param sessionId - Optional session identifier
 * @param customTags - Optional key-value tags (e.g. { plan: 'premium' })
 */
export function identifyClarity(
  userId: string,
  sessionId?: string,
  customTags?: Record<string, string>,
): void {
  if (!canTrack()) return;
  try {
    // clarity("identify", customId, customSessionId, customPageId, friendlyName)
    window.clarity!("identify", userId, sessionId);

    // Set custom tags for filtering in the Clarity dashboard
    if (customTags) {
      for (const [key, value] of Object.entries(customTags)) {
        window.clarity!("set", key, value);
      }
    }
  } catch {
    /* noop */
  }
}

/* ── Custom Tag ────────────────────────────────────────────── */

/**
 * Sets a custom key-value tag on the current Clarity session.
 * Useful for tagging sessions with business context (e.g. order value tier,
 * category browsed, A/B test variant).
 *
 * These tags appear as filterable dimensions in the Clarity dashboard.
 *
 * @example
 * tagClarity("page_type", "product");
 * tagClarity("ab_variant", "checkout_v2");
 */
export function tagClarity(key: string, value: string): void {
  if (!canTrack()) return;
  try {
    window.clarity!("set", key, value);
  } catch {
    /* noop */
  }
}

/* ── Upgrade Session ───────────────────────────────────────── */

/**
 * Marks the current session as important for recording.
 * Clarity uses smart sampling — use this to force-record high-value sessions
 * (e.g. initiated checkout, encountered an error).
 */
export function upgradeClarity(reason: string): void {
  if (!canTrack()) return;
  try {
    window.clarity!("upgrade", reason);
  } catch {
    /* noop */
  }
}
