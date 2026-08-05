// src/api/attributes.api.ts

import { api } from "./client";

export type AttributeVariant = {
  id: number;
  attribute_id: number;
  name: string;
  name_bd?: string | null;
  priority: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Attribute = {
  id: number;
  name: string;
  name_bd?: string | null;
  priority: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
  variants?: AttributeVariant[];
};

export type AttributesListParams = {
  limit?: number;
  offset?: number;
  name?: string;
  status?: boolean;
  priority?: number;
};

export type AttributesListResponse = {
  data: Attribute[];
  total: number;
};

export async function getAttributes(
  params?: AttributesListParams,
): Promise<AttributesListResponse> {
  const res = await api.get("/attributes", { params });
  return res.data;
}

export async function getAttribute(id: number): Promise<Attribute> {
  const res = await api.get(`/attribute/${id}`);
  return res.data;
}

export type CreateAttributePayload = {
  name: string;
  name_bd?: string;
  status?: boolean;
  priority?: number;
};

export async function createAttribute(
  payload: CreateAttributePayload,
): Promise<Attribute> {
  const res = await api.post("/attribute", payload);
  return res.data;
}

export type UpdateAttributePayload = {
  name?: string;
  name_bd?: string;
  status?: boolean;
  priority?: number;
};

export async function updateAttribute(
  id: number,
  payload: UpdateAttributePayload,
): Promise<{ success: true }> {
  const res = await api.put(`/attribute/${id}`, payload);
  return res.data;
}

export async function deleteAttribute(id: number): Promise<void> {
  await api.delete(`/attribute/${id}`);
}
