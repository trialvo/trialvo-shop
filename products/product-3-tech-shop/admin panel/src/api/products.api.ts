// src/api/products.api.ts
import { api } from "./client";

export type ProductImage = { id: number; path: string; serial?: number; sku_id?: number | null; sku_color_id?: number | null; sku_variant_id?: number | null };

// ✅ list variations (your older shape)
export type ProductVariation = {
  id: number;
  color_id: number;
  variant_id: number;
  buying_price: number;
  selling_price: number;
  discount: number;
  stock: number;
  sku: string;
};

// ✅ list product entity (your older shape)
export type ProductEntity = {
  id: number;
  name: string;
  name_bd?: string | null;
  slug: string;
  main_category_id: number;
  main_category_name?: string | null;
  sub_category_id: number;
  sub_category_name?: string | null;
  child_category_id: number;
  child_category_name?: string | null;
  brand_id: number;

  status: boolean;
  featured: boolean;
  best_deal: boolean;
  has_single_product_page?: boolean;

  free_delivery?: boolean;
  attribute_id?: number;
  video_path?: string | null;
  short_description?: string | null;
  long_description?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  robots?: string | null;

  created_at: string;
  updated_at: string;

  avg_rating?: number;
  review_count?: number;

  images: ProductImage[];
  product_images?: ProductImage[];
  variations: ProductVariation[];
};

export type Product = ProductEntity;

export type ProductsListParams = {
  search?: string;

  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
  brand_id?: number;

  status?: boolean;
  featured?: boolean;
  best_deal?: boolean;
  in_stock?: boolean;

  min_price?: number;
  max_price?: number;

  limit?: number;
  offset?: number;

  sort_by?: string;
  sort_order?: "asc" | "desc";
};

export type ProductsListResponse = {
  total: number;
  count: number;
  products: ProductEntity[];
};

// ✅ SINGLE PRODUCT (new response shape you provided: /product/:id)
export type ProductSingleColor = {
  id: number;
  name: string;
  hex?: string | null;
  priority?: number;
  status?: boolean;
};

export type ProductSingleVariant = {
  id: number;
  name: string;
  priority?: number;
  status?: boolean;
  attribute?: { id: number; name: string; priority?: number };
};

export type ProductSingleVariation = {
  id: number;

  color: ProductSingleColor;
  variant: ProductSingleVariant;

  buying_price: number;
  selling_price: number;

  discount: number;
  discount_type: number;

  final_price: number;

  stock: number;
  sku: string;
  weight_kg: number;

  status: boolean;
  in_stock: boolean;
  free_delivery?: boolean | null;
};

export type ProductSingleResponseEntity = {
  id: number;
  name: string;
  slug: string;

  main_category?: { id: number; name: string };
  sub_category?: { id: number; name: string };
  child_category?: { id: number; name: string };

  brand?: { id: number; name: string; image?: string | null };
  attribute?: { id: number; name: string };

  video_path?: string | null;

  short_description?: string | null;
  long_description?: string | null;

  status: boolean;
  featured: boolean;
  free_delivery: boolean;
  best_deal: boolean;
  has_single_product_page?: boolean;

  view_count?: number;
  sell_count?: number;

  meta_title?: string | null;
  canonical_url?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  robots?: string | null;

  created_at: string;
  updated_at: string;

  images: ProductImage[];
  variations: ProductSingleVariation[];

  available_colors?: Array<{
    id: number;
    name: string;
    hex?: string | null;
    priority?: number;
  }>;
  available_variants?: Array<{
    id: number;
    name: string;
    attribute_id: number;
    attribute_name: string;
  }>;

  related_products?: Array<{
    id: number;
    name: string;
    slug: string;
    image: string | null;
    featured: boolean;
    sell_count: number;
    view_count: number;
    keyword_match_count: number;
  }>;

  summary?: {
    total_variations: number;
    total_in_stock: number;
    total_out_of_stock: number;
    min_price: number;
    max_price: number;
    total_stock: number;
  };
};

export type ProductSingleResponse = {
  success: true;
  product: ProductSingleResponseEntity;
};

export type ProductApiMutationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
} & Record<string, unknown>;

export type ProductVariationPayload = {
  color_id: number;
  variant_id: number;
  buying_price: number;
  selling_price: number;
  discount: number;
  stock: number;
  sku: string;
  weight_kg?: number;
};

export type CreateProductPayload = {
  product_images: File[];
  name: string;
  name_bd?: string;
  slug: string;

  main_category_id: number;
  sub_category_id: number;
  child_category_id: number;

  brand_id: number;
  attribute_id: number;

  video_path?: string;
  short_description?: string;
  long_description?: string;

  status: boolean;
  featured: boolean;
  free_delivery: boolean;
  best_deal: boolean;

  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  robots?: string;

  variations: ProductVariationPayload[];
};

export type UpdateProductPayload = Omit<
  CreateProductPayload,
  | "variations"
  | "main_category_id"
  | "sub_category_id"
  | "child_category_id"
  | "brand_id"
  | "attribute_id"
> & {
  main_category_id: number | null;
  sub_category_id: number | null;
  child_category_id: number | null;
  brand_id: number | null;
  attribute_id: number | null;
  delete_image_ids?: number[];
};

function appendIfDefined(fd: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  fd.append(key, String(value));
}

function boolToStr(v: boolean) {
  return v ? "true" : "false";
}

function buildProductFormData(
  payload: CreateProductPayload | UpdateProductPayload,
) {
  const fd = new FormData();

  payload.product_images?.forEach((file) => {
    fd.append("product_images", file);
  });

  appendIfDefined(fd, "name", payload.name);
  appendIfDefined(fd, "name_bd", payload.name_bd);
  appendIfDefined(fd, "slug", payload.slug);

  appendIfDefined(fd, "main_category_id", payload.main_category_id);
  appendIfDefined(fd, "sub_category_id", payload.sub_category_id);
  appendIfDefined(fd, "child_category_id", payload.child_category_id);

  appendIfDefined(fd, "brand_id", payload.brand_id);
  appendIfDefined(fd, "attribute_id", payload.attribute_id);

  appendIfDefined(fd, "video_path", payload.video_path);
  appendIfDefined(fd, "short_description", payload.short_description);
  appendIfDefined(fd, "long_description", payload.long_description);

  fd.append("status", boolToStr(payload.status));
  fd.append("featured", boolToStr(payload.featured));
  fd.append("free_delivery", boolToStr(payload.free_delivery));
  fd.append("best_deal", boolToStr(payload.best_deal));

  appendIfDefined(fd, "meta_title", payload.meta_title);
  appendIfDefined(fd, "meta_description", payload.meta_description);
  appendIfDefined(fd, "meta_keywords", payload.meta_keywords);
  appendIfDefined(fd, "canonical_url", payload.canonical_url);
  appendIfDefined(fd, "og_title", payload.og_title);
  appendIfDefined(fd, "og_description", payload.og_description);
  appendIfDefined(fd, "robots", payload.robots);

  // create only
  const maybeCreate = payload as CreateProductPayload;
  if (Array.isArray(maybeCreate.variations)) {
    fd.append("variations", JSON.stringify(maybeCreate.variations));
  }

  // update only
  const maybeUpdate = payload as UpdateProductPayload;
  if (
    Array.isArray(maybeUpdate.delete_image_ids) &&
    maybeUpdate.delete_image_ids.length > 0
  ) {
    fd.append("delete_image_ids", JSON.stringify(maybeUpdate.delete_image_ids));
  }

  return fd;
}

function cleanParams<T extends Record<string, unknown>>(
  params?: T,
): Partial<T> | undefined {
  if (!params) return undefined;

  const next: Partial<T> = {};
  for (const [k, v] of Object.entries(params) as Array<[keyof T, T[keyof T]]>) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;

    // ✅ DO NOT send offset=0
    if (k === "offset" && Number(v) === 0) continue;

    next[k] = v;
  }

  return Object.keys(next).length ? next : undefined;
}

export async function getProducts(
  params?: ProductsListParams,
): Promise<ProductsListResponse> {
  const cleaned = cleanParams(params);
  const res = await api.get(
    "/products",
    cleaned ? { params: cleaned } : undefined,
  );
  return res.data as ProductsListResponse;
}

/**
 * ✅ /product/:id single product endpoint
 */
export async function getProduct(id: number): Promise<ProductSingleResponse> {
  const res = await api.get(`/product/${id}`);
  return res.data as ProductSingleResponse;
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<{ success: true; productId: number }> {
  const fd = buildProductFormData(payload);
  const res = await api.post("/product", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateProduct(
  id: number,
  payload: UpdateProductPayload,
): Promise<{ success: true }> {
  const fd = buildProductFormData(payload);
  const res = await api.put(`/product/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteProduct(
  id: number,
): Promise<ProductApiMutationResponse> {
  const res = await api.delete(`/product/${id}`);
  return res.data;
}

/**
 * ✅ Status toggle API
 * PUT /api/v1/product/:id  (multipart)
 * body: status=true/false
 */
export async function updateProductStatus(
  id: number,
  status: boolean,
): Promise<ProductApiMutationResponse> {
  const fd = new FormData();
  fd.append("status", status ? "true" : "false");

  const res = await api.put(`/product/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

/**
 * PATCH /api/v1/admin/product/:id/images/reorder
 * Sends the new ordered array of image IDs — the server assigns serial 1, 2, 3…
 */
export async function reorderProductImages(
  productId: number,
  imageIds: number[],
): Promise<{ success: true }> {
  const res = await api.patch(`/admin/product/${productId}/images/reorder`, {
    image_ids: imageIds,
  });
  return res.data;
}

/**
 * PATCH /api/v1/admin/product/image/:imageId/sku
 * Assigns or clears the sku_id on a product image.
 * Pass sku_id: null to clear (image becomes shared — shown for all SKUs).
 */
export async function assignImageSku(
  imageId: number,
  sku_id: number | null,
): Promise<{ success: true; image_id: number; sku_id: number | null }> {
  const res = await api.patch(`/admin/product/image/${imageId}/sku`, { sku_id });
  return res.data;
}

/**
 * PATCH /api/v1/admin/product/:id/toggle-single-page
 * Toggles the has_single_product_page flag on a product.
 */
export async function toggleSingleProductPage(
  productId: number,
): Promise<{ success: true; has_single_product_page: boolean }> {
  const res = await api.patch(`/admin/product/${productId}/toggle-single-page`);
  return res.data;
}
