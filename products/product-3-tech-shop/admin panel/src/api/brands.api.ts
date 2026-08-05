// src/api/brands.api.ts

import { api } from "./client";

export type Brand = {
  id: number;
  name: string;
  img_path: string | null;
  priority: number;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandListParams = {
  name?: string;
  status?: boolean;
  priority?: number;
  limit?: number;
  offset?: number;
};

export type BrandListResponse = {
  data: Brand[];
  total: number;
};

export async function getBrands(params?: BrandListParams): Promise<BrandListResponse> {
  const res = await api.get("/brands", { params });
  return res.data as BrandListResponse;
}

export async function getBrand(id: number): Promise<Brand> {
  const res = await api.get(`/brand/${id}`);
  return res.data as Brand;
}

export type CreateBrandPayload = {
  name: string;
  priority: number;
  status: boolean;
  brand_img?: File | null;
};

export async function createBrand(payload: CreateBrandPayload): Promise<Brand> {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("priority", String(payload.priority));
  fd.append("status", String(payload.status));
  if (payload.brand_img) fd.append("brand_img", payload.brand_img);

  const res = await api.post("/brand", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data as Brand;
}

export type UpdateBrandPayload = {
  name: string;
  priority: number;
  status: boolean;
  brand_img?: File | null;
};

export async function updateBrand(id: number, payload: UpdateBrandPayload): Promise<Brand> {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("priority", String(payload.priority));
  fd.append("status", String(payload.status));
  if (payload.brand_img) fd.append("brand_img", payload.brand_img);

  const res = await api.put(`/brand/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data as Brand;
}

export async function deleteBrand(id: number): Promise<any> {
  const res = await api.delete(`/brand/${id}`);
  return res.data;
}
