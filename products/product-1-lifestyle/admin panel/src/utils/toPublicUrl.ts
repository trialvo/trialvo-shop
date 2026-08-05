import { api } from "@/api/client";

/**
 * Converts backend relative path (ex: "/uploads/...") into full public URL.
 * - Keeps "http", "https", "blob:", "data:" as is.
 * - Uses axios baseURL and removes trailing "/api/v1" (or "/api/vX") if present.
 */
export function toPublicUrl(path?: string | null): string {
  if (!path) return "";
  const raw = String(path);

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("blob:") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  const base = String(api?.defaults?.baseURL ?? "").replace(/\/+$/, "");

  // remove /api/v1 or /api/v2 etc at the end
  const publicBase = base.replace(/\/api\/v\d+$/i, "");

  const joiner = raw.startsWith("/") ? "" : "/";
  return `${publicBase}${joiner}${raw}`;
}
