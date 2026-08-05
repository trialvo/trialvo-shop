import type { ProductDetail } from "@/lib/api/product/service";
import type { BreadcrumbItem } from "@/lib/breadcrumbs/types";
import { buildShopCategoryHref } from "@/lib/shop/categoryRoutes";

type CategoryLike = Readonly<{ id?: number; name: string }> | null | undefined;

function pushCategory(
  trail: BreadcrumbItem[],
  category: CategoryLike,
  seen: Set<string>,
): void {
  const name = category?.name?.trim();
  if (!name) return;

  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);

  trail.push({
    label: name,
    href: buildShopCategoryHref(name),
  });
}

/**
 * Shorten long product titles so the last crumb stays readable.
 */
export function shortenBreadcrumbLabel(
  label: string,
  maxChars = 42,
): string {
  const trimmed = label.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

/**
 * User-friendly product detail trail:
 * Shop › Main › Sub › Type › Product
 *
 * Brand is included only when category hierarchy is missing,
 * so users always have a useful way back into the catalog.
 */
export function buildProductBreadcrumbTrail(
  detail: Pick<
    ProductDetail,
    "name" | "main_category" | "sub_category" | "child_category" | "brand"
  >,
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [{ label: "Shop", href: "/shop" }];
  const seen = new Set<string>(["shop"]);

  const before = trail.length;
  pushCategory(trail, detail.main_category, seen);
  pushCategory(trail, detail.sub_category, seen);
  pushCategory(trail, detail.child_category, seen);

  // Fallback navigation when API has no category tree
  if (trail.length === before && detail.brand?.name?.trim()) {
    const brand = detail.brand.name.trim();
    trail.push({
      label: brand,
      href: `/shop?brand=${encodeURIComponent(brand)}`,
    });
  }

  const title = detail.name?.trim() || "Product";
  trail.push({ label: shortenBreadcrumbLabel(title) });

  return trail;
}
