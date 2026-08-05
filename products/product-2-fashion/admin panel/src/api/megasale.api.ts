import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MegaSaleSettings = {
  is_active: boolean;
  campaign_end_at: string | null;
  updated_at: string | null;
};

export type MegaSaleEnrolledProduct = {
  id: number; // mega_sale_products.id
  product_id: number;
  is_active: boolean;
  end_at: string | null;
  serial: number;
  product_name: string;
  product_name_bd: string | null;
  product_slug: string;
  product_status: boolean;
  thumbnail: string | null;
  variation_count: number;
  total_stock: number;
  min_price: number;
  max_price: number;
  excluded_sku_count: number;
  created_at: string | null;
};

export type MegaSaleData = {
  settings: MegaSaleSettings;
  products: MegaSaleEnrolledProduct[];
};

/** Product from the browsable list with mega sale enrollment info */
export type MegaSaleListProduct = {
  id: number; // products.id
  name: string;
  name_bd: string | null;
  slug: string;
  status: boolean;
  thumbnail: string | null;
  variation_count: number;
  total_stock: number;
  min_price: number;
  max_price: number;
  created_at: string | null;
  mega_sale: {
    entry_id: number;
    is_active: boolean;
    end_at: string | null;
    serial: number;
    excluded_sku_count: number;
  } | null;
};

export type MegaSaleProductsListResponse = {
  products: MegaSaleListProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type MegaSaleSkuInfo = {
  sku_id: number;
  sku: string;
  selling_price: number;
  final_price: number;
  stock: number;
  sku_status: boolean;
  color_name: string | null;
  color_hex: string | null;
  variant_name: string | null;
  override_id: number | null;
  is_excluded: boolean;
  override_end_at: string | null;
  inherits_product: boolean;
};

export type MegaSaleProductSkusResponse = {
  mega_sale_product_id: number;
  product_id: number;
  product_end_at: string | null;
  skus: MegaSaleSkuInfo[];
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function getMegaSaleSettings(): Promise<MegaSaleData> {
  const res = await api.get("/admin/megasale/settings");
  return res.data.data;
}

export async function updateMegaSaleSettings(body: {
  is_active?: boolean;
  campaign_end_at?: string | null;
}): Promise<{ success: true }> {
  const res = await api.put("/admin/megasale/settings", body);
  return res.data;
}

export async function getMegaSaleProductsList(params: {
  page?: number;
  limit?: number;
  search?: string;
  enrolled?: "yes" | "no" | "";
}): Promise<MegaSaleProductsListResponse> {
  const res = await api.get("/admin/megasale/products", { params });
  return res.data.data;
}

export async function addMegaSaleProduct(body: {
  product_id: number;
  end_at?: string | null;
}): Promise<{ success: true }> {
  const res = await api.post("/admin/megasale/product", body);
  return res.data;
}

export async function updateMegaSaleProduct(
  id: number,
  body: { is_active?: boolean; end_at?: string | null; serial?: number }
): Promise<{ success: true }> {
  const res = await api.put(`/admin/megasale/product/${id}`, body);
  return res.data;
}

export async function deleteMegaSaleProduct(
  id: number
): Promise<{ success: true }> {
  const res = await api.delete(`/admin/megasale/product/${id}`);
  return res.data;
}

export async function getMegaSaleProductSkus(
  megaSaleProductId: number
): Promise<MegaSaleProductSkusResponse> {
  const res = await api.get(`/admin/megasale/product/${megaSaleProductId}/skus`);
  return res.data.data;
}

export async function updateSkuOverride(
  megaSaleProductId: number,
  skuId: number,
  body: { is_excluded?: boolean; end_at?: string | null }
): Promise<{ success: true }> {
  const res = await api.put(`/admin/megasale/product/${megaSaleProductId}/sku/${skuId}`, body);
  return res.data;
}

export async function deleteSkuOverride(
  skuId: number
): Promise<{ success: true }> {
  const res = await api.delete(`/admin/megasale/sku-override/${skuId}`);
  return res.data;
}
