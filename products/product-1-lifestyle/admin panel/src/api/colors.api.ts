// src/api/colors.api.ts

import { api } from "./client";

export type Color = {
  id: number;
  name: string;
  name_bd?: string | null;
  hex: string;
  priority: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ColorListParams = {
  name?: string;
  status?: boolean;
  priority?: number;
  limit?: number;
  offset?: number;
};

export type ColorListResponse = {
  data: Color[];
  total: number;
};

export type CreateColorPayload = {
  name: string;
  name_bd?: string;
  hex: string;
  status?: boolean;
  priority?: number;
};

export async function getColors(
  params?: ColorListParams,
): Promise<ColorListResponse> {
  const res = await api.get("/colors", { params });
  return res.data as ColorListResponse;
}

export async function getColor(id: number): Promise<Color> {
  const res = await api.get(`/color/${id}`);
  return res.data as Color;
}

export async function createColor(payload: CreateColorPayload): Promise<Color> {
  const res = await api.post("/color", payload);
  return res.data as Color;
}

export async function updateColor(
  id: number,
  payload: CreateColorPayload,
): Promise<Color> {
  const res = await api.put(`/color/${id}`, payload);
  return res.data as Color;
}

export async function deleteColor(id: number): Promise<any> {
  const res = await api.delete(`/color/${id}`);
  return res.data;
}
