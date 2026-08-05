import type { BreadcrumbItem, BreadcrumbTrail } from "@/lib/breadcrumbs/types";

const HOME: BreadcrumbItem = { label: "Home", href: "/" };

function isHomeItem(item: BreadcrumbItem): boolean {
  const href = item.href?.trim();
  const label = item.label.trim().toLowerCase();
  return href === "/" || label === "home";
}

function humanizeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  } catch {
    return segment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
}

/**
 * Build crumbs from a pathname when the page does not pass explicit items.
 * Example: "/shop/electronics" → Shop › Electronics
 */
export function trailFromPathname(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    return {
      label: humanizeSegment(segment),
      href: isLast ? undefined : href,
    };
  });
}

/**
 * Normalize a trail:
 * - always starts with a single Home
 * - strips duplicate leading Home from caller items
 * - collapses consecutive identical crumbs
 * - ensures the last crumb is current (no href) unless only Home
 */
export function buildBreadcrumbTrail(
  items: BreadcrumbTrail | undefined,
  pathname: string,
): BreadcrumbItem[] {
  const raw =
    items && items.length > 0 ? [...items] : trailFromPathname(pathname);

  // Drop any leading Home — we inject exactly one
  while (raw.length > 0 && isHomeItem(raw[0]!)) {
    raw.shift();
  }

  const trail: BreadcrumbItem[] = [HOME];

  for (const item of raw) {
    const label = item.label.trim();
    if (!label) continue;

    const href = item.href?.trim() || undefined;
    const prev = trail[trail.length - 1];

    // Skip consecutive duplicates (same label + same href)
    if (
      prev &&
      prev.label.trim().toLowerCase() === label.toLowerCase() &&
      (prev.href ?? "") === (href ?? "")
    ) {
      continue;
    }

    // Skip if same as Home we already have
    if (isHomeItem({ label, href })) continue;

    trail.push({ label, href });
  }

  // Last crumb is always the current page (non-link), except when trail is only Home
  if (trail.length > 1) {
    const last = trail[trail.length - 1]!;
    trail[trail.length - 1] = { label: last.label };
  }

  return trail;
}
