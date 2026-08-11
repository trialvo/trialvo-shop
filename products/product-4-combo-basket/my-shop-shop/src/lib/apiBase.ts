/**
 * Browser calls same-origin `/api/shop` (proxied to the API container).
 * Server components call the internal Docker URL directly.
 */
const BROWSER_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/shop";

const SERVER_API_URL =
  process.env.SHOP_API_INTERNAL_URL?.trim() ||
  "http://combobasket-api:5000/api/shop";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return BROWSER_API_URL;
  return SERVER_API_URL;
}

export function getBrowserApiBaseUrl(): string {
  return BROWSER_API_URL;
}

export function getServerApiBaseUrl(): string {
  return SERVER_API_URL;
}
