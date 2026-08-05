import type { CategoryEntity } from "@/components/products/product-category/types";

export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => ["categories", "list"] as const,
  list: (entity: CategoryEntity, params: Record<string, any>) =>
    ["categories", "list", entity, params] as const,
  singles: () => ["categories", "single"] as const,
  single: (entity: CategoryEntity, id: number) => ["categories", "single", entity, id] as const,
};
