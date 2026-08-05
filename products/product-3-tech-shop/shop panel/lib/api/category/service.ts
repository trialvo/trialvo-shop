import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type ListResponse<T> = {
  data: T[];
  total: number;
};

export type CategoryStatusParam = {
  main_category_id?: number;
  sub_category_id?: number;

  status?: boolean;
  limit?: number;
  offset?: number;
};

export type ChildCategory = {
  id: number;
  sub_category_id: number;
  name: string;
  name_bd?: string | null;
  img_path: string | null;
  total_stock: number;

  status: boolean;
  featured: boolean;
  priority: number;

  created_at: string;
  updated_at: string;
};

export type SubCategory = {
  id: number;
  main_category_id: number;
  name: string;
  name_bd?: string | null;
  img_path: string | null;
  total_stock?: number;

  status: boolean;
  featured: boolean;
  priority: number;

  created_at: string;
  updated_at: string;

  child_categories: ChildCategory[];
};

export type MainCategory = {
  id: number;
  name: string;
  name_bd?: string | null;
  img_path: string | null;
  total_stock?: number;

  status: boolean;
  featured: boolean;
  priority: number;

  created_at: string;
  updated_at: string;

  sub_categories: SubCategory[];
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

const MAIN_LIST = "/categories/mainCategories";
const MAIN_DETAIL = "/categories/mainCategory";
const SUB_LIST = "/categories/subCategories";
const SUB_DETAIL = "/categories/subCategory";
const CHILD_LIST = "/categories/childCategories";
const CHILD_DETAIL = "/categories/childCategory";

class CategoryService {
  async getMainCategories(
    params?: CategoryStatusParam,
  ): Promise<ListResponse<MainCategory>> {
    try {
      const response = await api.get<ListResponse<MainCategory>>(MAIN_LIST, {
        params: {
          status: true,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(
        getServerErrorMessage(err, "Failed to get main categories"),
      );
    }
  }

  async getMainCategoryById(
    id: number,
    params?: { status?: boolean },
  ): Promise<{ data: MainCategory }> {
    try {
      const response = await api.get<{ data: MainCategory }>(
        `${MAIN_DETAIL}/${id}`,
      );

      return response.data;
    } catch (err) {
      throw new Error(
        getServerErrorMessage(err, "Failed to get main category"),
      );
    }
  }

  async getSubCategories(
    params?: CategoryStatusParam,
  ): Promise<ListResponse<SubCategory>> {
    try {
      const response = await api.get<ListResponse<SubCategory>>(SUB_LIST, {
        params: {
          main_category_id: params?.main_category_id,
          status: true,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(
        getServerErrorMessage(err, "Failed to get sub categories"),
      );
    }
  }

  async getSubCategoryById(
    id: number,
    params?: { status?: boolean },
  ): Promise<{ data: SubCategory }> {
    try {
      const response = await api.get<{ data: SubCategory }>(
        `${SUB_DETAIL}/${id}`,
      );

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get sub category"));
    }
  }

  async getChildCategories(
    params?: CategoryStatusParam,
  ): Promise<ListResponse<ChildCategory>> {
    try {
      const response = await api.get<ListResponse<ChildCategory>>(CHILD_LIST, {
        params: {
          status: true,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(
        getServerErrorMessage(err, "Failed to get child categories"),
      );
    }
  }

  async getChildCategoryById(
    id: number,
    params?: { status?: boolean },
  ): Promise<{ data: ChildCategory }> {
    try {
      const response = await api.get<{ data: ChildCategory }>(
        `${CHILD_DETAIL}/${id}`,
      );

      return response.data;
    } catch (err) {
      throw new Error(
        getServerErrorMessage(err, "Failed to get child category"),
      );
    }
  }
}

export const categoryService = new CategoryService();
