import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  deleteChildCategory,
  deleteMainCategory,
  deleteSubCategory,
  getChildCategories,
  getMainCategories,
  getSubCategories,
} from "@/api/categories.api";
import type {
  ChildCategory,
  ChildListParams,
  ListResponse,
  MainCategory,
  MainListParams,
  SubCategory,
  SubListParams,
} from "@/components/products/product-category/types";
import { categoriesKeys } from "./categories.keys";

function getApiErrorFromResponse(res: unknown) {
  const data = res as any;
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (Number.isFinite(Number(data?.flag)) && Number(data.flag) >= 400) return "Something went wrong";
  return null;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.error ||
    anyErr?.response?.data?.message ||
    anyErr?.message ||
    fallback
  );
}

export const useMainCategories = (params: MainListParams) => {
  return useQuery<ListResponse<MainCategory>>({
    queryKey: categoriesKeys.list("main", params),
    queryFn: () => getMainCategories(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
};

export const useSubCategories = (params: SubListParams) => {
  return useQuery<ListResponse<SubCategory>>({
    queryKey: categoriesKeys.list("sub", params),
    queryFn: () => getSubCategories(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
};

export const useChildCategories = (params: ChildListParams) => {
  return useQuery<ListResponse<ChildCategory>>({
    queryKey: categoriesKeys.list("child", params),
    queryFn: () => getChildCategories(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
};

/**
 * Options queries: avoid mixing pagination/filters with select options.
 */
export const useMainCategoryOptions = () => {
  const params: MainListParams = { limit: 1000, offset: 0 };
  return useQuery<ListResponse<MainCategory>>({
    queryKey: categoriesKeys.list("main", { ...params, __options: true }),
    queryFn: () => getMainCategories(params),
    staleTime: 60_000,
  });
};

export const useSubCategoryOptions = (mainCategoryId?: number) => {
  const params: SubListParams = { limit: 1000, offset: 0 };
  if (typeof mainCategoryId === "number") params.main_category_id = mainCategoryId;

  return useQuery<ListResponse<SubCategory>>({
    queryKey: categoriesKeys.list("sub", { ...params, __options: true }),
    queryFn: () => getSubCategories(params),
    staleTime: 60_000,
  });
};

export const useDeleteMainCategory = (
  options?: UseMutationOptions<unknown, unknown, number>,
) => {
  const qc = useQueryClient();

  return useMutation<unknown, unknown, number>({
    mutationFn: (id) => deleteMainCategory(id),
    onSuccess: async (res) => {
      const apiError = getApiErrorFromResponse(res);
      if (apiError) {
        toast.error(apiError);
        return;
      }
      toast.success("Main category deleted");
      await qc.invalidateQueries({ queryKey: categoriesKeys.all });
    },
    onError: (e: any) => {
      toast.error(getApiErrorMessage(e, "Failed to delete"));
    },
    ...options,
  });
};

export const useDeleteSubCategory = (
  options?: UseMutationOptions<unknown, unknown, number>,
) => {
  const qc = useQueryClient();

  return useMutation<unknown, unknown, number>({
    mutationFn: (id) => deleteSubCategory(id),
    onSuccess: async (res) => {
      const apiError = getApiErrorFromResponse(res);
      if (apiError) {
        toast.error(apiError);
        return;
      }
      toast.success("Sub category deleted");
      await qc.invalidateQueries({ queryKey: categoriesKeys.all });
    },
    onError: (e: any) => {
      toast.error(getApiErrorMessage(e, "Failed to delete"));
    },
    ...options,
  });
};

export const useDeleteChildCategory = (
  options?: UseMutationOptions<unknown, unknown, number>,
) => {
  const qc = useQueryClient();

  return useMutation<unknown, unknown, number>({
    mutationFn: (id) => deleteChildCategory(id),
    onSuccess: async (res) => {
      const apiError = getApiErrorFromResponse(res);
      if (apiError) {
        toast.error(apiError);
        return;
      }
      toast.success("Child category deleted");
      await qc.invalidateQueries({ queryKey: categoriesKeys.all });
    },
    onError: (e: any) => {
      toast.error(getApiErrorMessage(e, "Failed to delete"));
    },
    ...options,
  });
};
