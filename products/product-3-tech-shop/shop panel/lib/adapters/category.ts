import type { MainCategory, SubCategory } from "@/lib/api/category/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { slugify } from "@/lib/security/url";
import { buildShopCategoryHref } from "@/lib/shop/categoryRoutes";

export type FeaturedCategoryViewModel = {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
  href: string;
};

function toFeaturedFromSub(sub: SubCategory): FeaturedCategoryViewModel {
  const slug = slugify(sub.name) || `category-${sub.id}`;
  return {
    id: String(sub.id),
    name: sub.name,
    slug,
    image: resolveMediaUrl(sub.img_path),
    productCount: typeof sub.total_stock === "number" ? sub.total_stock : 0,
    href: buildShopCategoryHref(slug),
  };
}

function toFeaturedFromMain(main: MainCategory): FeaturedCategoryViewModel {
  const slug = slugify(main.name) || `category-${main.id}`;
  return {
    id: String(main.id),
    name: main.name,
    slug,
    image: resolveMediaUrl(main.img_path),
    productCount: 0,
    href: buildShopCategoryHref(slug),
  };
}

/**
 * Prefers featured sub-categories for the home grid; falls back to main categories.
 */
export function toFeaturedCategories(
  mains: MainCategory[],
  limit = 10,
): FeaturedCategoryViewModel[] {
  const featuredSubs = mains
    .flatMap((m) => m.sub_categories ?? [])
    .filter((s) => s.status && s.featured)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  if (featuredSubs.length > 0) {
    return featuredSubs.slice(0, limit).map(toFeaturedFromSub);
  }

  const activeSubs = mains
    .flatMap((m) => m.sub_categories ?? [])
    .filter((s) => s.status)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  if (activeSubs.length > 0) {
    return activeSubs.slice(0, limit).map(toFeaturedFromSub);
  }

  return mains
    .filter((m) => m.status)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, limit)
    .map(toFeaturedFromMain);
}
