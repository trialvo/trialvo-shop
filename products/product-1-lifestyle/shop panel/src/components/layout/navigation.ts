import type { Category } from "@/hooks/useCategory";
import type { NavCategory } from "@/types";

const STATIC_NAV_START: readonly NavCategory[] = [
  { label: "New Arrivals", href: "/mega-sale", featured: true },
  { label: "Shop All", href: "/shop" },
];

const STATIC_NAV_END: readonly NavCategory[] = [
  { label: "Bulk & Combo", href: "/deals", featured: true },
];

function getShopCategoryHref(categoryName: string): string {
  return `/shop?category=${encodeURIComponent(categoryName)}`;
}

function getShopSubCategoryHref(subCategoryId: number): string {
  return `/shop?sub_category=${encodeURIComponent(String(subCategoryId))}`;
}

export function buildNavCategories(categories: ReadonlyArray<Category>): NavCategory[] {
  const dynamicCategories = categories.flatMap<NavCategory>((category) => {
    const label = typeof category.name === "string" ? category.name.trim() : "";
    if (!label) return [];

    const children = category.children ?? [];
    const item: NavCategory = {
      label,
      href: getShopCategoryHref(label),
    };

    if (children.length > 0) {
      const submenuItems = children.flatMap((childCategory) => {
        const childLabel = typeof childCategory.name === "string"
          ? childCategory.name.trim()
          : "";

        return childLabel
          ? [{ label: childLabel, href: getShopSubCategoryHref(childCategory.id) }]
          : [];
      });

      if (submenuItems.length > 0) {
        item.submenu = submenuItems.map((submenuItem) => submenuItem.label);
        item.submenuHrefs = submenuItems.map((submenuItem) => submenuItem.href);
      }
    }

    return [item];
  });

  return [...STATIC_NAV_START, ...dynamicCategories, ...STATIC_NAV_END];
}
