import type { MainCategory } from "@/lib/api/category/service";
import { slugify } from "@/lib/security/url";

/**
 * Canonical shop category URL shape:
 *   /shop?category=men
 *
 * All category navigation in the app should go through buildShopCategoryHref
 * so we never invent alternate paths like /category/[slug].
 */

export type ResolvedShopCategory = {
  slug: string;
  name: string;
  /** Most-specific filter to send to GET /user/products */
  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
};

/** Normalize a query/name into a safe category slug (e.g. "Men" → "men"). */
export function sanitizeCategorySlug(
  raw: string | null | undefined,
): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    /* keep raw when already decoded / malformed */
  }

  return slugify(decoded);
}

/** Build `/shop?category=<slug>` from a category name or slug. */
export function buildShopCategoryHref(nameOrSlug: string): string {
  const slug = sanitizeCategorySlug(nameOrSlug);
  if (!slug) return "/shop";
  return `/shop?category=${encodeURIComponent(slug)}`;
}

export function humanizeCategorySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Map `?category=` slug → API filter IDs.
 * Prefers child → sub → main so the most specific match wins on name collisions.
 */
export function resolveShopCategory(
  mains: MainCategory[],
  rawSlug: string | null | undefined,
): ResolvedShopCategory | null {
  const slug = sanitizeCategorySlug(rawSlug);
  if (!slug) return null;

  for (const main of mains) {
    if (!main.status) continue;

    for (const sub of main.sub_categories ?? []) {
      if (!sub.status) continue;

      for (const child of sub.child_categories ?? []) {
        if (!child.status) continue;
        const childSlug = slugify(child.name) || `child-${child.id}`;
        if (childSlug === slug) {
          return {
            slug,
            name: child.name,
            child_category_id: child.id,
          };
        }
      }

      const subSlug = slugify(sub.name) || `sub-${sub.id}`;
      if (subSlug === slug) {
        return {
          slug,
          name: sub.name,
          sub_category_id: sub.id,
        };
      }
    }

    const mainSlug = slugify(main.name) || `category-${main.id}`;
    if (mainSlug === slug) {
      return {
        slug,
        name: main.name,
        main_category_id: main.id,
      };
    }
  }

  // Unknown slug — keep label for UI; ShopClient may fall back to client match
  return {
    slug,
    name: humanizeCategorySlug(slug),
  };
}
