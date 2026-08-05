// src/api/delivery-charges.api.ts

import { DeliveryChargeType, normalizeDeliveryType } from "@/components/business-settings/delivery/types";
import { api } from "./client";

export type DeliveryChargeEntity = {
  id: number;
  title: string;

  // ✅ normalize to snake_case in fetch
  type: DeliveryChargeType;

  customer_charge: number;
  our_charge: number;

  default_weight_kg: number;
  extra_charge_per_kg: number;

  status: boolean;

  img_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type DeliveryChargesListResponse = {
  success: boolean;
  data: any[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type GetDeliveryChargesParams = {
  type?: DeliveryChargeType;
  status?: boolean;
  limit?: number;
  offset?: number;
};

export type CreateDeliveryChargeInput = {
  delivery_img?: File | null;
  title: string;

  // ✅ send snake_case
  type: DeliveryChargeType;

  customer_charge: number;
  our_charge: number;

  default_weight_kg?: number;
  extra_charge_per_kg?: number;

  status: boolean;
};

export type UpdateDeliveryChargeInput = Partial<CreateDeliveryChargeInput>;

function buildFormData(input: Partial<CreateDeliveryChargeInput>) {
  const fd = new FormData();

  if (input.delivery_img) fd.append("delivery_img", input.delivery_img);

  if (typeof input.title === "string") fd.append("title", input.title);

  // ✅ snake_case value (no spaces)
  if (typeof input.type === "string") fd.append("type", input.type);

  if (typeof input.customer_charge === "number") fd.append("customer_charge", String(input.customer_charge));
  if (typeof input.our_charge === "number") fd.append("our_charge", String(input.our_charge));

  if (typeof input.default_weight_kg === "number") fd.append("default_weight_kg", String(input.default_weight_kg));
  if (typeof input.extra_charge_per_kg === "number") fd.append("extra_charge_per_kg", String(input.extra_charge_per_kg));

  if (typeof input.status === "boolean") fd.append("status", input.status ? "true" : "false");

  return fd;
}

function mapEntity(raw: any): DeliveryChargeEntity {
  return {
    id: Number(raw?.id ?? 0),
    title: String(raw?.title ?? ""),

    // backend may return "outside of dhaka" -> normalize to "outside_of_dhaka"
    type: normalizeDeliveryType(raw?.type),

    customer_charge: Number(raw?.customer_charge ?? 0),
    our_charge: Number(raw?.our_charge ?? 0),

    default_weight_kg: Number(raw?.default_weight_kg ?? 0),
    extra_charge_per_kg: Number(raw?.extra_charge_per_kg ?? 0),

    status: Boolean(raw?.status),

    img_path: raw?.img_path ? String(raw.img_path) : null,
    created_at: String(raw?.created_at ?? ""),
    updated_at: String(raw?.updated_at ?? ""),
    deleted_at: raw?.deleted_at ?? null,
  };
}

export async function getDeliveryCharges(params: GetDeliveryChargesParams) {
  const res = await api.get<DeliveryChargesListResponse>("/delivery/charges", {
    params: {
      ...(params.type ? { type: params.type } : {}),
      ...(typeof params.status === "boolean" ? { status: params.status } : {}),
      ...(typeof params.limit === "number" ? { limit: params.limit } : {}),
      ...(typeof params.offset === "number" ? { offset: params.offset } : {}),
    },
  });

  const payload = res.data;

  const list = Array.isArray(payload?.data) ? payload.data : [];
  const mapped = list.map(mapEntity);

  return {
    success: Boolean(payload?.success),
    data: mapped,
    pagination: payload?.pagination ?? {
      total: mapped.length,
      limit: params.limit ?? 0,
      offset: params.offset ?? 0,
    },
  };
}

export async function getDeliveryCharge(id: number) {
  const res = await api.get<any>(`/delivery/charge/${id}`);
  const data = res.data;

  if (data && typeof data === "object" && "success" in data) {
    return data?.data ? mapEntity(data.data) : null;
  }

  return mapEntity(data);
}

export async function createDeliveryCharge(input: CreateDeliveryChargeInput) {
  const fd = buildFormData(input);

  const res = await api.post<any>("/delivery/charge", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function updateDeliveryCharge(id: number, input: UpdateDeliveryChargeInput) {
  const fd = buildFormData(input);

  const res = await api.put<any>(`/delivery/charge/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function deleteDeliveryCharge(id: number) {
  const res = await api.delete<{ success?: boolean; message?: string }>(`/delivery/charge/${id}`);
  return res.data;
}
