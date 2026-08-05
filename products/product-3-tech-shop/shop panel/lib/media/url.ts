import { IMAGE_URL, applyShopRuntimeConfig } from "@/config/env";

const GCS_PREFIXES = [
  "https://storage.googleapis.com/graduate-ecom-mumbai-641431966702",
  "https://storage.googleapis.com/graduate-ecom",
];

function resolveImageBase(): string {
  if (typeof window !== "undefined") {
    applyShopRuntimeConfig();
    const fromWindow = window.__SHOP_CONFIG__?.IMAGE_URL?.trim();
    if (fromWindow) return fromWindow.replace(/\/+$/, "");
  }

  const env = typeof process !== "undefined" ? process.env : undefined;
  const fromEnv = (env?.IMAGE_URL || env?.NEXT_PUBLIC_IMAGE_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  return (IMAGE_URL || "").replace(/\/+$/, "");
}

/**
 * Builds a safe absolute media URL from API-relative or absolute paths.
 * Rewrites known GCS origins onto IMAGE_URL so shared-demo local uploads work.
 * Falls back to same-origin `/uploads/...` when the base is still GCS/empty.
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  fallback = "/placeholder.jpg",
): string {
  if (!path || typeof path !== "string") return fallback;

  const trimmed = path.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return fallback;
  }

  let relative: string;
  if (/^https?:\/\//i.test(trimmed)) {
    let rewritten: string | null = null;
    for (const origin of GCS_PREFIXES) {
      if (trimmed.startsWith(origin)) {
        const rest = trimmed.slice(origin.length);
        rewritten = rest.startsWith("/") ? rest : `/${rest}`;
        break;
      }
    }
    if (!rewritten && trimmed.includes("/uploads/")) {
      rewritten = trimmed.slice(trimmed.indexOf("/uploads/"));
    }
    if (!rewritten) {
      // Unknown absolute URL (avatars, etc.)
      return trimmed;
    }
    relative = rewritten;
  } else {
    relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  const base = resolveImageBase();
  if (!base || base.includes("storage.googleapis.com")) {
    return relative;
  }

  return `${base}${relative}`;
}
