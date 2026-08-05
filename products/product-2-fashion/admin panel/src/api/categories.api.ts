import {
  ChildCategory,
  ChildCategoryFormValues,
  ChildListParams,
  ListResponse,
  MainCategory,
  MainListParams,
  SubCategory,
  SubCategoryFormValues,
  SubListParams,
  CategoryFormValues,
  ApiErrorShape,
} from "@/components/products/product-category/types";
import { api } from "./client";

function pickApiErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const msg =
    (anyErr?.response?.data as ApiErrorShape | undefined)?.error ||
    anyErr?.message ||
    "Something went wrong";
  return String(msg);
}

function toFormData(values: {
  name: string;
  name_bd?: string;
  priority: number;
  status: boolean;
  featured: boolean;
  category_img?: File | null;
  main_category_id?: number;
  sub_category_id?: number;
}) {
  const fd = new FormData();
  if (values.category_img) fd.append("category_img", values.category_img);
  fd.append("name", values.name);
  if (values.name_bd?.trim()) fd.append("name_bd", values.name_bd.trim());
  fd.append("priority", String(values.priority));
  fd.append("status", String(values.status));
  fd.append("featured", String(values.featured));

  if (typeof values.main_category_id === "number") {
    fd.append("main_category_id", String(values.main_category_id));
  }
  if (typeof values.sub_category_id === "number") {
    fd.append("sub_category_id", String(values.sub_category_id));
  }
  return fd;
}

/** =========================
 *  MAIN CATEGORY
 *  ========================= */

export async function getMainCategories(params?: MainListParams) {
  const res = await api.get<ListResponse<MainCategory>>(
    "/categories/mainCategories",
    { params },
  );
  return res.data;
}

export async function getMainCategory(id: number) {
  const res = await api.get<MainCategory>(`/categories/mainCategory/${id}`);
  return res.data;
}

export async function deleteMainCategory(id: number) {
  const res = await api.delete(`/categories/mainCategory/${id}`);
  return res.data;
}

export async function createMainCategory(values: CategoryFormValues) {
  try {
    const res = await api.post<MainCategory>(
      "/categories/mainCategory",
      toFormData(values),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e));
  }
}

export async function updateMainCategory(
  id: number,
  values: CategoryFormValues,
) {
  try {
    const res = await api.put<MainCategory>(
      `/categories/mainCategory/${id}`,
      toFormData(values),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e));
  }
}

/** =========================
 *  SUB CATEGORY
 *  ========================= */

export async function getSubCategories(params?: SubListParams) {
  const res = await api.get<ListResponse<SubCategory>>(
    "/categories/subCategories",
    { params },
  );
  return res.data;
}

export async function getSubCategory(id: number) {
  const res = await api.get<SubCategory>(`/categories/subCategory/${id}`);
  return res.data;
}

export async function deleteSubCategory(id: number) {
  const res = await api.delete(`/categories/subCategory/${id}`);
  return res.data;
}

export async function createSubCategory(values: SubCategoryFormValues) {
  try {
    const res = await api.post<SubCategory>(
      "/categories/subCategory",
      toFormData(values),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e));
  }
}

export async function updateSubCategory(
  id: number,
  values: SubCategoryFormValues,
) {
  try {
    const res = await api.put<SubCategory>(
      `/categories/subCategory/${id}`,
      toFormData(values),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e));
  }
}

/** =========================
 *  CHILD CATEGORY
 *  ========================= */

export async function getChildCategories(params?: ChildListParams) {
  const res = await api.get<ListResponse<ChildCategory>>(
    "/categories/childCategories",
    { params },
  );
  return res.data;
}

export async function getChildCategory(id: number) {
  const res = await api.get<ChildCategory>(`/categories/childCategory/${id}`);
  return res.data;
}

export async function deleteChildCategory(id: number) {
  const res = await api.delete(`/categories/childCategory/${id}`);
  return res.data;
}

export async function createChildCategory(values: ChildCategoryFormValues) {
  try {
    const res = await api.post<ChildCategory>(
      "/categories/childCategory",
      toFormData(values),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e));
  }
}

export async function updateChildCategory(
  id: number,
  values: ChildCategoryFormValues,
) {
  try {
    const res = await api.put<ChildCategory>(
      `/categories/childCategory/${id}`,
      toFormData(values),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e));
  }
}
