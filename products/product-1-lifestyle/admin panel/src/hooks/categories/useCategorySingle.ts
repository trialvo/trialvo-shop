import { useQuery } from "@tanstack/react-query";

import {
  getChildCategory,
  getMainCategory,
  getSubCategory,
} from "@/api/categories.api";
import type {
  CategoryEntity,
  ChildCategory,
  MainCategory,
  SubCategory,
} from "@/components/products/product-category/types";
import { categoriesKeys } from "./categories.keys";

export function useCategorySingle(
  entity: CategoryEntity,
  id: number | null,
  enabled: boolean,
) {
  return useQuery<MainCategory | SubCategory | ChildCategory>({
    queryKey: categoriesKeys.single(entity, id ?? 0),
    queryFn: async () => {
      if (!id) throw new Error("Missing id");
      if (entity === "main") return getMainCategory(id);
      if (entity === "sub") return getSubCategory(id);
      return getChildCategory(id);
    },
    enabled: Boolean(enabled && id),
    staleTime: 15_000,
  });
}
