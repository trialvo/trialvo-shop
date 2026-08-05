import type {
  ChildCategory,
  MainCategory,
  SubCategory,
} from "@/lib/api/category/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { slugify } from "@/lib/security/url";
import { buildShopCategoryHref } from "@/lib/shop/categoryRoutes";

export type NavLeafItem = {
  id: string;
  name: string;
  href: string;
  image: string | null;
};

export type NavSubCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image: string | null;
  children: NavLeafItem[];
};

export type NavMainCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image: string | null;
  subs: NavSubCategory[];
};

/** @deprecated Prefer NavMainCategory */
export type NavCategoryItem = NavMainCategory & {
  children: NavLeafItem[];
};

/**
 * Shared rail row shape — used for BOTH main and sub columns
 * so they render with the same visual pattern.
 */
export type CategoryRailRow = {
  id: string;
  name: string;
  href: string;
  image: string | null;
  meta?: string;
};

export type CategoryFlyoutModel = {
  mains: NavMainCategory[];
  layout: "single-main" | "multi-main";
  railHeading: string;
};

function byPriorityDesc<T extends { priority?: number }>(a: T, b: T): number {
  return (b.priority ?? 0) - (a.priority ?? 0);
}

function toCategoryHref(name: string, id: number, prefix: string): string {
  // Canonical route: /shop?category=<slug> (never /category/...)
  const slug = slugify(name) || `${prefix}-${id}`;
  return buildShopCategoryHref(slug);
}

function childToLeaf(child: ChildCategory): NavLeafItem {
  return {
    id: String(child.id),
    name: child.name,
    href: toCategoryHref(child.name, child.id, "child"),
    image: child.img_path ? resolveMediaUrl(child.img_path) : null,
  };
}

function subToNav(sub: SubCategory): NavSubCategory {
  return {
    id: String(sub.id),
    name: sub.name,
    slug: slugify(sub.name) || `sub-${sub.id}`,
    href: toCategoryHref(sub.name, sub.id, "sub"),
    image: sub.img_path ? resolveMediaUrl(sub.img_path) : null,
    children: (sub.child_categories ?? [])
      .filter((c) => c.status)
      .sort(byPriorityDesc)
      .map(childToLeaf),
  };
}

export function toNavMainCategories(mains: MainCategory[]): NavMainCategory[] {
  return mains
    .filter((m) => m.status)
    .sort(byPriorityDesc)
    .map((main) => {
      const subs = (main.sub_categories ?? [])
        .filter((s) => s.status)
        .sort(byPriorityDesc)
        .map(subToNav);

      return {
        id: String(main.id),
        name: main.name,
        slug: slugify(main.name) || `category-${main.id}`,
        href: toCategoryHref(main.name, main.id, "main"),
        image: main.img_path ? resolveMediaUrl(main.img_path) : null,
        subs,
      };
    });
}

export function toNavCategories(mains: MainCategory[]): NavCategoryItem[] {
  return toNavMainCategories(mains).map((main) => ({
    ...main,
    children: main.subs.map((s) => ({
      id: s.id,
      name: s.name,
      href: s.href,
      image: s.image,
    })),
  }));
}

/**
 * 3-level flyout data:
 * Main (rail) → Sub (rail, same pattern) → Child (grid with image + label)
 */
export function toCategoryFlyoutModel(
  mains: MainCategory[],
): CategoryFlyoutModel {
  const navMains = toNavMainCategories(mains);
  const layout = navMains.length === 1 ? "single-main" : "multi-main";

  return {
    mains: navMains,
    layout,
    railHeading:
      layout === "single-main" && navMains[0]
        ? navMains[0].name
        : "All Categories",
  };
}

export function mainToRailRows(mains: NavMainCategory[]): CategoryRailRow[] {
  return mains.map((m) => ({
    id: m.id,
    name: m.name,
    href: m.href,
    image: m.image,
    meta:
      m.subs.length > 0
        ? `${m.subs.length} ${m.subs.length === 1 ? "subcategory" : "subcategories"}`
        : undefined,
  }));
}

export function subToRailRows(subs: NavSubCategory[]): CategoryRailRow[] {
  return subs.map((s) => ({
    id: s.id,
    name: s.name,
    href: s.href,
    image: s.image,
    meta:
      s.children.length > 0
        ? `${s.children.length} ${s.children.length === 1 ? "type" : "types"}`
        : undefined,
  }));
}
