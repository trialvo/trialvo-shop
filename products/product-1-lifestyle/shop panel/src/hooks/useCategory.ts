"use client";

import { api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export type ChildCategory = {
  id: number;
  sub_category_id?: number;
  name: string;
  name_bd?: string | null;
  img_path?: string | null;
  image?: string | null;
  status: boolean;
  featured?: boolean;
  priority?: number;
  total_stock?: number;
};

export type SubCategory = {
  id: number;
  main_category_id?: number;
  name: string;
  name_bd?: string | null;
  img_path?: string | null;
  image?: string | null;
  status: boolean;
  featured?: boolean;
  priority?: number;
  total_stock?: number;
  child_categories?: ChildCategory[];
  children?: ChildCategory[];
};

export type Category = {
  id: number;
  name: string;
  name_bd?: string | null;
  slug?: string;
  image?: string | null;
  img_path?: string | null;
  parent_id?: number | null;
  level?: number;
  status: boolean;
  priority?: number;
  featured?: boolean;
  total_stock?: number;
  /** Sub-categories (mapped from API sub_categories) */
  children?: SubCategory[];
  sub_categories?: SubCategory[];
};

type MainCategoryResponse = {
  data: Category[];
  message?: string;
  error?: string;
};

export const categoryKeys = {
  all: ["category"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

export const useCategory = () => {
  const categoriesQuery = useQuery({
    queryKey: categoryKeys.list(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Category[]> => {
      try {
        const res = await api.get<MainCategoryResponse>("/categories/mainCategories");
        const raw = res.data?.data;
        if (!Array.isArray(raw)) return [];
        // Map full 3-level hierarchy: main → sub → child
        return raw
          .filter(c => c.status)
          .map(c => ({
            ...c,
            image: c.img_path || c.image || null,
            children: (c.sub_categories || []).filter(s => s.status).map(s => ({
              ...s,
              image: s.img_path || s.image || null,
              children: (s.child_categories || []).filter(ch => ch.status).map(ch => ({
                ...ch,
                image: ch.img_path || ch.image || null,
              })),
            })),
          }));
      } catch {
        return [];
      }
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.error,
    refetchCategories: categoriesQuery.refetch,
  };
};
