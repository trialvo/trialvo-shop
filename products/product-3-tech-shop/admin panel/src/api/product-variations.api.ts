// src/api/product-variations.api.ts
import { api } from "./client";

export type ProductVariationPayload = {
  product_id: number;
  color_id: number;
  variant_id: number;
  buying_price?: number;
  selling_price: number;
  discount?: number;
  stock?: number;
  sku?: string;
  free_delivery?: boolean | null; // null = inherit from product, true = free, false = paid
};

export type ProductVariationEntity = {
  id: number;
  product_id: number;
  color_id: number;
  variant_id: number;
  sku: string;
  buying_price: number;
  selling_price: number;
  discount: number;
  stock: number;
  status: 1 | 0;
  free_delivery: 1 | 0 | null; // null = inherit from product
};

/**
 * ✅ List variations by product
 * GET /api/v1/product/getvariations/:productId
 */
export async function getProductVariationsByProduct(productId: number) {
  const res = await api.get(`/product/getvariations/${productId}`);
  const payload = res.data;

  if (Array.isArray(payload)) return payload as ProductVariationEntity[];
  if (Array.isArray(payload?.data)) return payload.data as ProductVariationEntity[];
  if (Array.isArray(payload?.variations)) return payload.variations as ProductVariationEntity[];
  if (Array.isArray(payload?.product?.variations)) return payload.product.variations as ProductVariationEntity[];

  return [] as ProductVariationEntity[];
}

export async function createProductVariation(payload: ProductVariationPayload) {
  const res = await api.post("/product/variation", payload);
  return res.data as { success: true; skuId: number };
}

export async function getProductVariation(id: number) {
  const res = await api.get(`/product/variation/${id}`);
  return res.data as ProductVariationEntity;
}

export async function updateProductVariation(id: number, payload: ProductVariationPayload) {
  const res = await api.put(`/product/variation/${id}`, payload);
  return res.data as { success: true };
}

export async function deleteProductVariation(id: number) {
  const res = await api.delete(`/product/variation/${id}`);
  return res.data as { success: true };
}
