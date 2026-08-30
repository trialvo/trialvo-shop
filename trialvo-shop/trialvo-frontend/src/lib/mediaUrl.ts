/**
 * Resolve product/media URLs for the shop UI.
 * Uploads are stored as `/uploads/...` and served by the Control Plane API host.
 */
import { API_BASE } from "@/lib/env";

function apiOrigin(): string {
  try {
    const u = new URL(API_BASE);
    // Strip trailing /api so /uploads mounts at host root
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:5000";
  }
}

export function isManagedUploadUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("/uploads/");
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${apiOrigin()}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${apiOrigin()}/${trimmed}`;
  }
  return trimmed;
}

export function normalizeProductImages(
  images: { admin?: string[]; shop?: string[] } | null | undefined,
): { admin: string[]; shop: string[] } {
  return {
    admin: Array.isArray(images?.admin) && images!.admin!.length ? [...images!.admin!] : [""],
    shop: Array.isArray(images?.shop) && images!.shop!.length ? [...images!.shop!] : [""],
  };
}
