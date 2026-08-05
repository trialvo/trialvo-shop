export type ApiErrorShape = {
  flag?: number;
  error?: string;
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type BaseListParams = PaginationParams & {
  name?: string;
  status?: boolean;
  featured?: boolean;
  priority?: number;
};

export type MainCategory = {
  id: number;
  name: string;
  name_bd?: string | null;
  img_path: string | null;
  status: boolean;
  featured: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  sub_categories?: SubCategory[];
};

export type SubCategory = {
  id: number;
  main_category_id: number;
  name: string;
  name_bd?: string | null;
  img_path: string | null;
  status: boolean;
  featured: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  child_categories?: ChildCategory[];
};

export type ChildCategory = {
  id: number;
  sub_category_id: number;
  name: string;
  name_bd?: string | null;
  img_path: string | null;
  status: boolean;
  featured: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
};

export type ListResponse<T> = {
  data: T[];
  total: number;
};

export type MainListParams = BaseListParams;

export type SubListParams = BaseListParams & {
  main_category_id?: number;
};

export type ChildListParams = BaseListParams & {
  sub_category_id?: number;
};

export type CategoryFormValues = {
  name: string;
  name_bd?: string;
  priority: number;
  status: boolean;
  featured: boolean;
  category_img?: File | null;
};

export type SubCategoryFormValues = CategoryFormValues & {
  main_category_id: number;
};

export type ChildCategoryFormValues = CategoryFormValues & {
  sub_category_id: number;
};

export type CategoryEntity = "main" | "sub" | "child";
