"use client";

import {
  categoryService,
  type MainCategory,
} from "@/lib/api/category/service";
import { useQuery } from "@tanstack/react-query";

export const mainCategoryKeys = {
  all: ["main-category"] as const,
  list: (status = true) => [...mainCategoryKeys.all, "list", status] as const,
};

export const useMainCategories = (options?: { enabled?: boolean }) => {
  const query = useQuery({
    queryKey: mainCategoryKeys.list(true),
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<MainCategory[]> => {
      const res = await categoryService.getMainCategories({ status: true });
      return Array.isArray(res.data) ? res.data.filter((c) => c.status) : [];
    },
    retry: 2,
    retryDelay: 1000,
  });

  return {
    mainCategories: query.data ?? [],
    mainCategoriesLoading: query.isLoading,
    mainCategoriesError: query.error,
    refetchMainCategories: query.refetch,
  };
};
