/**
 * src/config/env.ts — Centralized environment configuration
 *
 * Two objects: `dev` and `production` — same properties.
 * Automatically selects based on Vite's import.meta.env.DEV.
 *
 * `import.meta.env.DEV` is set automatically by Vite:
 *   - `vite` (dev server)  → true
 *   - `vite build`         → false
 */

// ── Dev Environment ──────────────────────────────────────────────────────────
const dev = {
  API_ORIGIN: "http://localhost:9000",
  PUBLIC_ORIGIN: "http://localhost:9000",
  IMAGE_URL: "http://localhost:9000",
  API_PREFIX: "/api/v1",
};

// ── Live Dev Environment ──────────────────────────────────────────────────────────
const live_dev = {
  API_ORIGIN: "https://shop-api.shoplinkbd.com",
  IMAGE_URL: "https://shop.shoplinkbd.com",
  API_PREFIX: "/api/v1",
};

// ── Production Environment ───────────────────────────────────────────────────
const production = {
  API_ORIGIN: "https://graduatefashion-api-641431966702.asia-south1.run.app",
  // Images served directly from public GCS bucket — no Cloud Run hop
  PUBLIC_ORIGIN: "https://storage.googleapis.com/graduate-ecom-mumbai-641431966702",
  API_PREFIX: "/api/v1",
};

// ── Auto-select ──────────────────────────────────────────────────────────────
// Vite sets import.meta.env.DEV=true during `vite dev`, false during `vite build`.
const env = dev;

/**
 * Runtime override (trial / hosted mode).
 *
 * A Vite SPA bakes its config at build time, which does not work when a single
 * image is served for many trial instances that each talk to a different API.
 * So we allow a runtime `window.__APP_CONFIG__` (written by the container's
 * nginx entrypoint from env vars, see public/config.js) to take precedence over
 * the compiled defaults. When absent (normal dev/build), the baked values win.
 */
type RuntimeAppConfig = {
  API_ORIGIN?: string;
  IMAGE_URL?: string;
  API_PREFIX?: string;
};

function runtimeConfig(): RuntimeAppConfig {
  if (typeof window !== "undefined") {
    const w = window as unknown as { __APP_CONFIG__?: RuntimeAppConfig };
    if (w.__APP_CONFIG__) return w.__APP_CONFIG__;
  }
  return {};
}

const rc = runtimeConfig();

export const API_ORIGIN = rc.API_ORIGIN || env.API_ORIGIN;
export const IMAGE_URL = rc.IMAGE_URL || env.IMAGE_URL;
export const API_PREFIX = rc.API_PREFIX || env.API_PREFIX;
export const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;

export function toPublicUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${IMAGE_URL}${path}`;
}
