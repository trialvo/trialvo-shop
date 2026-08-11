import { ENV } from "@/config/env";

/**
 * getImageUrl — resolves a product/slider image path to a full URL.
 *
 * Rules:
 *  - null/undefined → placeholder
 *  - Already correct absolute URL (production domain) → return as-is
 *  - Old absolute URL (localhost:5000, localhost:5001, etc) → strip domain, re-apply base
 *  - Relative path like /uploads/images/... → same-origin or IMAGE_BASE_URL
 */
const IMAGE_BASE_URL = ENV.IMAGE_BASE_URL;

export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/placeholder-product.jpg";

  // Strip any old localhost base URL to get the relative path
  const cleaned = imagePath.replace(/^https?:\/\/localhost:\d+/, "");

  // If it's a full production URL (not localhost), return as-is
  if (
    cleaned === imagePath &&
    (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
  ) {
    if (IMAGE_BASE_URL && imagePath.startsWith(IMAGE_BASE_URL)) return imagePath;
    // External URL — return as-is
    return imagePath;
  }

  const relative = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  if (!IMAGE_BASE_URL) {
    if (relative.startsWith("/uploads/")) {
      return `/api/uploads${relative.slice("/uploads".length)}`;
    }
    return relative;
  }

  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  return `${base}${relative}`;
}
