/**
 * config/env.ts — Centralized environment configuration
 *
 * For trial / multi-tenant Docker: root layout injects window.__SHOP_CONFIG__
 * from container env at request time. Client code must prefer that over
 * build-time baked defaults.
 */

const dev = {
  API_URL: "http://localhost:7010",
  IMAGE_URL: "http://localhost:7010",
  SITE_URL: "http://localhost:3000",
  SHOP_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3000",
  GTM_ID: "GTM-WQDNF2TP",
  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
};

const live_dev = {
  API_URL: "https://shop-api.shoplinkbd.com",
  IMAGE_URL: "https://shop-api.shoplinkbd.com",
  SITE_URL: "https://shop-api.shoplinkbd.com",
  SHOP_URL: "https://shop-api.shoplinkbd.com",
  APP_URL: "https://shop-api.shoplinkbd.com",
  GTM_ID: "GTM-WQDNF2TP",
  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
};

const production = {
  API_URL: "https://graduatefashion-api-641431966702.asia-south1.run.app",
  IMAGE_URL: "https://storage.googleapis.com/graduate-ecom-mumbai-641431966702",
  SITE_URL: "https://graduatefashionbd.com",
  SHOP_URL: "https://graduatefashionbd.com",
  APP_URL: "https://graduatefashionbd.com",
  GTM_ID: "GTM-WQDNF2TP",
  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
};

const vps = {
  API_URL: "https://api.graduatefashionbd.com",
  IMAGE_URL: "",
  SITE_URL: "https://graduatefashionbd.com",
  SHOP_URL: "https://graduatefashionbd.com",
  APP_URL: "https://graduatefashionbd.com",
  GTM_ID: "GTM-WQDNF2TP",
  GOOGLE_CLIENT_ID: "637133097087-7rmoop30gjlunpdok5bi4dv5cvb4891d.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
};

const deployTarget =
  process.env.NEXT_PUBLIC_DEPLOY_TARGET || process.env.APP_DEPLOY_TARGET || "";
const apiHint = process.env.NEXT_PUBLIC_API_URL || "";
const useVps =
  deployTarget === "vps" ||
  apiHint.includes("46.250.224.125") ||
  apiHint.includes("graduatefashionbd.com");

const compiled =
  useVps
    ? vps
    : process.env.NODE_ENV === "development"
      ? dev
      : production;

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

function fromProcess(key: string): string | undefined {
  const env = process.env;
  const direct = env[key];
  if (direct !== undefined && direct !== null) return String(direct).trim();
  const pub = env[`NEXT_PUBLIC_${key}`];
  if (pub !== undefined && pub !== null) return String(pub).trim();
  return undefined;
}

function fromWindow(key: keyof ShopRuntimeConfig): string | undefined {
  if (typeof window === "undefined") return undefined;
  const cfg = window.__SHOP_CONFIG__;
  if (!cfg || !(key in cfg)) return undefined;
  return String(cfg[key] ?? "").trim();
}

function resolve(key: keyof ShopRuntimeConfig): string {
  const fromW = fromWindow(key);
  if (fromW !== undefined) return fromW;
  const fromP = fromProcess(key);
  if (fromP !== undefined) return fromP;
  return compiled[key] || "";
}

export let API_URL = resolve("API_URL");
export let IMAGE_URL = resolve("IMAGE_URL");
export let SITE_URL = resolve("SITE_URL");
export let SHOP_URL = resolve("SHOP_URL");
export let APP_URL = resolve("APP_URL");
export const GTM_ID = compiled.GTM_ID;
/** Prefer runtime/build env; same Trialvo OAuth client for local + live demos. */
export const GOOGLE_CLIENT_ID =
  fromProcess("GOOGLE_CLIENT_ID") || compiled.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || compiled.GOOGLE_CLIENT_SECRET;

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
