/**
 * Tech shop env — trial-ready runtime overrides (window.__SHOP_CONFIG__ + process.env).
 */
const dev = {
  API_URL: "http://localhost:9000",
  IMAGE_URL: "http://localhost:9000",
  SITE_URL: "http://localhost:3000",
  SHOP_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3000",
};

const live_dev = {
  API_URL: "https://shop-api.shoplinkbd.com",
  IMAGE_URL: "https://shop-api.shoplinkbd.com",
  SITE_URL: "https://shop-api.shoplinkbd.com",
  SHOP_URL: "https://shop-api.shoplinkbd.com",
  APP_URL: "https://shop-api.shoplinkbd.com",
};

const production = {
  API_URL: "https://api.example.com",
  IMAGE_URL: "https://api.example.com",
  SITE_URL: "https://shop.example.com",
  SHOP_URL: "https://shop.example.com",
  APP_URL: "https://shop.example.com",
};

const compiled =
  process.env.NODE_ENV === "production" ? production : dev;

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
  if (direct && String(direct).trim()) return String(direct).trim();
  const pub = env[`NEXT_PUBLIC_${key}`];
  if (pub && String(pub).trim()) return String(pub).trim();
  return undefined;
}

function fromWindow(key: keyof ShopRuntimeConfig): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = window.__SHOP_CONFIG__?.[key];
  return v && String(v).trim() ? String(v).trim() : undefined;
}

function resolve(key: keyof ShopRuntimeConfig): string {
  return fromWindow(key) || fromProcess(key) || compiled[key] || "";
}

export let API_URL = resolve("API_URL");
export let IMAGE_URL = resolve("IMAGE_URL");
export let SITE_URL = resolve("SITE_URL");
export let SHOP_URL = resolve("SHOP_URL");
export let APP_URL = resolve("APP_URL");

// Keep live_dev available for ops who toggle manually in source if needed
void live_dev;

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
