/**
 * config/env.ts — Centralized environment configuration
 *
 * `process.env.NODE_ENV` is set automatically by Next.js:
 *   - `next dev`   → "development"
 *   - `next build` → "production"
 *
 * For trial / multi-tenant Docker: the root layout injects
 * `window.__SHOP_CONFIG__` from container env at request time. Client code
 * must read that — Next.js inlines bare `process.env.X` into the client
 * bundle at *build* time, so one shop image cannot bake every trial's API port.
 */

// ── Dev Environment ──────────────────────────────────────────────────────────
const dev = {
  API_URL: "http://localhost:9000",
  IMAGE_URL: "http://localhost:9000",
  SITE_URL: "http://localhost:5000",
  SHOP_URL: "http://localhost:5000",
  APP_URL: "http://localhost:5000",

  GTM_ID: "GTM-WQDNF2TP",

  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
};

// ── Live Dev Environment ─────────────────────────────────────────────────────
const live_dev = {
  API_URL: "https://shop-api.shoplinkbd.com",
  IMAGE_URL: "https://shop-api.shoplinkbd.com",
  SITE_URL: "https://shop-api.shoplinkbd.com",
  SHOP_URL: "https://shop-api.shoplinkbd.com",
  APP_URL: "https://shop-api.shoplinkbd.com",

  GTM_ID: "GTM-WQDNF2TP",

  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
};

// ── Production Environment ───────────────────────────────────────────────────
const production = {
  API_URL: "https://lifestyle-api.example.com",
  IMAGE_URL: "https://lifestyle-api.example.com",
  SITE_URL: "https://lifestyle.example.com",
  SHOP_URL: "https://lifestyle.example.com",
  APP_URL: "https://lifestyle.example.com",

  GTM_ID: "GTM-WQDNF2TP",

  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
};

type AppEnvName = "dev" | "live_dev" | "production" | "auto";

const environments = {
  dev,
  live_dev,
  production,
} as const;

const ACTIVE_ENV: AppEnvName = "auto";

const env =
  ACTIVE_ENV === "auto"
    ? process.env.NODE_ENV === "production"
      ? production
      : dev
    : environments[ACTIVE_ENV];

type ShopRuntimeConfig = {
  IMAGE_URL?: string;
  API_URL?: string;
  SITE_URL?: string;
  SHOP_URL?: string;
  APP_URL?: string;
};

declare global {
  interface Window {
    __SHOP_CONFIG__?: ShopRuntimeConfig;
  }
}

function compiledFallback(key: keyof typeof production): string {
  return env[key];
}

function fromProcess(key: string): string | undefined {
  const direct = process.env[key];
  if (direct !== undefined && direct !== null) return String(direct).trim();
  const pub = process.env[`NEXT_PUBLIC_${key}`];
  if (pub !== undefined && pub !== null) return String(pub).trim();
  return undefined;
}

function fromWindow(key: keyof ShopRuntimeConfig): string | undefined {
  if (typeof window === "undefined") return undefined;
  const cfg = window.__SHOP_CONFIG__;
  if (!cfg || !(key in cfg)) return undefined;
  return String(cfg[key] ?? "").trim();
}

/** Resolve media/API base: window (trial) → process.env → compiled default. */
function resolve(key: keyof ShopRuntimeConfig & keyof typeof production): string {
  const fromW = fromWindow(key);
  if (fromW !== undefined) return fromW;
  const fromP = fromProcess(key);
  if (fromP !== undefined) return fromP;
  return compiledFallback(key);
}

// `let` + live ESM bindings so client modules pick up window config after apply().
export let API_URL = resolve("API_URL");
export let IMAGE_URL = resolve("IMAGE_URL");
export let SITE_URL = resolve("SITE_URL");
export let SHOP_URL = resolve("SHOP_URL");
export let APP_URL = resolve("APP_URL");
export const GTM_ID = env.GTM_ID;
/** Prefer runtime/build env; same Trialvo OAuth client for local + live demos. */
export const GOOGLE_CLIENT_ID =
  fromProcess("GOOGLE_CLIENT_ID") || env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

/** Re-read window.__SHOP_CONFIG__ (safe to call anytime on the client). */
export function applyShopRuntimeConfig(): void {
  API_URL = resolve("API_URL");
  IMAGE_URL = resolve("IMAGE_URL");
  SITE_URL = resolve("SITE_URL");
  SHOP_URL = resolve("SHOP_URL");
  APP_URL = resolve("APP_URL");
}

if (typeof window !== "undefined") {
  applyShopRuntimeConfig();
}
