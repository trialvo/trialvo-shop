import { ENV } from '../config/env';

/**
 * getImageUrl — resolves a product/slider image path to a full URL.
 * Admin panel version (uses centralized ENV config).
 *
 * Handles:
 *  - null → null
 *  - Old localhost URLs (any port) → strip domain, re-apply IMAGE_BASE_URL
 *  - Production URLs → return as-is
 *  - Relative paths → prepend IMAGE_BASE_URL
 */
const IMAGE_BASE_URL = ENV.IMAGE_BASE_URL;

export function getImageUrl(imagePath) {
 if (!imagePath) return null;

 // Strip any old localhost base URL to get the relative path
 const cleaned = imagePath.replace(/^https?:\/\/localhost:\d+/, '');

 // If it's a full URL (not localhost), return as-is
 if (cleaned === imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
  if (imagePath.startsWith(IMAGE_BASE_URL)) return imagePath;
  return imagePath;
 }

 // Build from relative path
 const base = IMAGE_BASE_URL.replace(/\/$/, '');
 const p = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
 return `${base}${p}`;
}
