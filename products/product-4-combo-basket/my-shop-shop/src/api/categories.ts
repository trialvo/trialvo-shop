import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiCategory {
  id: number;
  name: string;
  name_bn?: string | null;
  slug: string;
  icon: string;
  color?: string;
  svg_icon?: string;
  sort_order: number;
  home_sort_order?: number;
  is_active: boolean;
  show_on_home?: boolean;
}

export interface CategoryListResponse {
  success: boolean;
  categories: ApiCategory[];
}

export interface HomeSectionCategory extends ApiCategory {
  products: import("./products").ApiProduct[];
}

export interface HomeSectionsResponse {
  success: boolean;
  sections: HomeSectionCategory[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** All active categories — used on /products and /combo-builder pages */
export function useCategories() {
  return useQuery<CategoryListResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await apiClient.get("/categories");
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Only the categories marked show_on_home=true, sorted by home_sort_order.
 * Used by the home page category icon grid.
 */
export function useHomeCategories() {
  return useQuery<CategoryListResponse>({
    queryKey: ["categories", "home"],
    queryFn: async () => {
      const { data } = await apiClient.get("/categories?show_on_home=true");
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

/** Home sections with products (used by CategoryProductSection on home page) */
export function useHomeSections() {
  return useQuery<HomeSectionsResponse>({
    queryKey: ["home-sections"],
    queryFn: async () => {
      const { data } = await apiClient.get("/categories/home-sections");
      return data;
    },
    staleTime: 2 * 60_000,
  });
}
