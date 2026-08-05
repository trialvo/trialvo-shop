import { SITE_URL } from "@/config/env";

/**
 * Rewrites legacy storefront paths that admin used to save on banners:
 *   /category/US.POLO%20MEN'S%20DENIM%20PANT/?childId=71
 * → /shop?category=uspolo-mens-denim-pant
 *
 * Also maps old product paths:
 *   /products/slug/123/ → /product/slug
 */
export function rewriteLegacyShopHref(href: string): string {
  const categoryMatch = href.match(/^\/category\/([^/?#]+)\/?/i);
  if (categoryMatch) {
    let name = categoryMatch[1];
    try {
      name = decodeURIComponent(name);
    } catch {
      /* keep raw segment */
    }
    const slug = slugify(name);
    return slug ? `/shop?category=${encodeURIComponent(slug)}` : "/shop";
  }

  const productMatch = href.match(/^\/products\/([^/?#]+)\/?/i);
  if (productMatch) {
    let slug = productMatch[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* keep raw */
    }
    return slug ? `/product/${encodeURIComponent(slug)}` : "/shop";
  }

  return href;
}

/**
 * Sanitizes navigation targets coming from untrusted API fields (banner.path, etc.).
 * Only relative app paths or same-origin absolute URLs are allowed.
 */
export function sanitizeAppHref(
  raw: string | null | undefined,
  fallback = "/shop",
): string {
  if (!raw || typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("//")
  ) {
    return fallback;
  }

  // Relative path — keep query/hash, block path traversal patterns
  if (trimmed.startsWith("/")) {
    if (trimmed.includes("\\") || trimmed.includes("..")) return fallback;
    return rewriteLegacyShopHref(trimmed);
  }

  try {
    const site = new URL(SITE_URL);
    const target = new URL(trimmed);
    if (target.origin !== site.origin) return fallback;
    const path = `${target.pathname}${target.search}${target.hash}` || fallback;
    return path.startsWith("/") ? rewriteLegacyShopHref(path) : fallback;
  } catch {
    return fallback;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
