export function humanizeSlug(slug?: string): string {
  if (!slug) return "";

  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeSlug(slug: string | string[]): string {
  return Array.isArray(slug) ? slug.join("-") : slug;
}

export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug.replaceAll('%20', " ").replaceAll(/%2F/gi, "/");
  }
}