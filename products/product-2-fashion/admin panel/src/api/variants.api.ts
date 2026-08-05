// src/api/variants.api.ts

import { api } from "./client";

export type Variant = {
  id: number;
  attribute_id: number;
  name: string;
  name_bd?: string | null;
  serial: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;

  // list endpoint sometimes includes these:
  attribute_name?: string;
  attribute_priority?: number;
};

export type VariantsListParams = {
  limit: number;
  offset?: number;
  name?: string;
  status?: boolean;
};

export type VariantsListResponse = {
  data: Variant[];
  total: number;
};

export type CreateVariantPayload = {
  attribute_id: number;
  name: string;
  name_bd?: string;
  status?: boolean;
  serial?: number;
};

export type UpdateVariantPayload = {
  attribute_id?: number;
  name?: string;
  name_bd?: string;
  status?: boolean;
  serial?: number;
};

export type ReorderVariantsPayload = {
  order: { id: number; serial: number }[];
};

export async function getVariants(
  params: VariantsListParams,
): Promise<VariantsListResponse> {
  const res = await api.get("/variants", { params });
  return res.data;
}

export async function getVariant(id: number): Promise<Variant> {
  const res = await api.get(`/variant/${id}`);
  return res.data;
}

export async function createVariant(
  payload: CreateVariantPayload,
): Promise<Variant> {
  const res = await api.post("/variant", payload);
  return res.data;
}

export async function updateVariant(
  id: number,
  payload: UpdateVariantPayload,
): Promise<{ success: true }> {
  const res = await api.put(`/variant/${id}`, payload);
  return res.data;
}

export async function deleteVariant(id: number): Promise<void> {
  await api.delete(`/variant/${id}`);
}

export async function reorderVariants(
  attributeId: number,
  payload: ReorderVariantsPayload,
): Promise<{ success: true }> {
  const res = await api.patch(`/attribute/${attributeId}/variants/reorder`, payload);
  return res.data;
}
