import { IMAGE_URL } from "@/config/env";
import type { Category, ChildCategory, SubCategory } from "@/hooks/useCategory";
import type { CategoryImagePath } from "./MegaMenuPanel.types";

export function hasImagePath(imagePath: CategoryImagePath): imagePath is string {
  return typeof imagePath === "string" && imagePath.trim().length > 0;
}

export function getImageUrl(imagePath: string): string {
  return `${IMAGE_URL}${imagePath}`;
}

export function getMainCategoryHref(category: Pick<Category, "name">): string {
  return `/shop?category=${encodeURIComponent(category.name)}`;
}

export function getSubCategoryHref(subCategory: Pick<SubCategory, "id">): string {
  return `/shop?sub_category=${subCategory.id}`;
}

export function getChildCategoryHref(childCategory: Pick<ChildCategory, "id">): string {
  return `/shop?child_category=${childCategory.id}`;
}
