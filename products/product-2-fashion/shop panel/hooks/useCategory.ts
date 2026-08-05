"use client";

import {
  categoryService,
  type CategoryStatusParam,
  type ChildCategory,
  type ListResponse,
  type MainCategory,
  type SubCategory,
} from "@/lib/api/category/service";
import { useQuery } from "@tanstack/react-query";

export const categoryKeys = {
  all: ["category"] as const,

  mainList: (params?: CategoryStatusParam) =>
    [
      ...categoryKeys.all,
      "main",
      "list",
      params?.status ?? true,
      params?.limit ?? null,
      params?.offset ?? null,
    ] as const,

  mainDetail: (id: number, status = true) =>
    [...categoryKeys.all, "main", "detail", id, status] as const,

  subList: (params?: CategoryStatusParam) =>
    [
      ...categoryKeys.all,
      "sub",
      "list",
      params?.status ?? true,
      params?.main_category_id ?? null,
      params?.limit ?? null,
      params?.offset ?? null,
    ] as const,

  subDetail: (id: number, status = true) =>
    [...categoryKeys.all, "sub", "detail", id, status] as const,

  childList: (params?: CategoryStatusParam) =>
    [
      ...categoryKeys.all,
      "child",
      "list",
      params?.status ?? true,
      params?.sub_category_id ?? null,
      params?.limit ?? null,
      params?.offset ?? null,
    ] as const,

  childDetail: (id: number, status = true) =>
    [...categoryKeys.all, "child", "detail", id, status] as const,
};

const safeList = <T>(res: ListResponse<T> | null | undefined): T[] => {
  if (!res) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

export const useCategory = (params?: CategoryStatusParam) => {
  const mainCategoriesQuery = useQuery({
    queryKey: categoryKeys.mainList(params),
    enabled: true,
    staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hr garbage collection
    queryFn: async (): Promise<ListResponse<MainCategory>> => {
      const res = await categoryService.getMainCategories(params);
      return res;
    },
  });

  const subCategoriesQuery = useQuery({
    queryKey: categoryKeys.subList(params),
    enabled: true,
    staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hr garbage collection
    queryFn: async (): Promise<ListResponse<SubCategory>> => {
      const res = await categoryService.getSubCategories(params);
      return res;
    },
  });

  const childCategoriesQuery = useQuery({
    queryKey: categoryKeys.childList(params),
    enabled: true,
    staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hr garbage collection
    queryFn: async (): Promise<ListResponse<ChildCategory>> => {
      const res = await categoryService.getChildCategories(params);
      return res;
    },
  });

  const useMainCategoryById = (id: number, status = true) =>
    useQuery({
      queryKey: categoryKeys.mainDetail(id, status),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
      gcTime: 60 * 60 * 1000,
      queryFn: async (): Promise<MainCategory> => {
        const res = await categoryService.getMainCategoryById(id, { status });
        if (!res?.data) throw new Error("Main category not found");
        return res.data;
      },
    });

  const useSubCategoryById = (id: number, status = true) =>
    useQuery({
      queryKey: categoryKeys.subDetail(id, status),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
      gcTime: 60 * 60 * 1000,
      queryFn: async (): Promise<SubCategory> => {
        const res = await categoryService.getSubCategoryById(id, { status });
        if (!res?.data) throw new Error("Sub category not found");
        return res.data;
      },
    });

  const useChildCategoryById = (id: number, status = true) =>
    useQuery({
      queryKey: categoryKeys.childDetail(id, status),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
      gcTime: 60 * 60 * 1000,
      queryFn: async (): Promise<ChildCategory> => {
        const res = await categoryService.getChildCategoryById(id, { status });
        if (!res?.data) throw new Error("Child category not found");
        return res.data;
      },
    });

  return {
    mainCategories: safeList(mainCategoriesQuery.data),
    mainTotal: mainCategoriesQuery.data?.total ?? 0,
    mainCategoriesLoading: mainCategoriesQuery.isLoading,
    mainCategoriesError: mainCategoriesQuery.error,

    subCategories: safeList(subCategoriesQuery.data),
    subTotal: subCategoriesQuery.data?.total ?? 0,
    subCategoriesLoading: subCategoriesQuery.isLoading,
    subCategoriesError: subCategoriesQuery.error,

    childCategories: safeList(childCategoriesQuery.data),
    childTotal: childCategoriesQuery.data?.total ?? 0,
    childCategoriesLoading: childCategoriesQuery.isLoading,
    childCategoriesError: childCategoriesQuery.error,

    useMainCategoryById,
    useSubCategoryById,
    useChildCategoryById,
  };
};
