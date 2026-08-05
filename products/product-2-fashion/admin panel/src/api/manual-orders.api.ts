// src/api/manual-orders.api.ts

import { api } from "./client";

export type ManualAddressPayload = {
  customer_id: number;
  name: string;
  phone: string;
  full_address: string;
  city?: string;
  zip_code?: string;
  type?: "home" | "office" | "n/a";
  location_mapping_id?: number;
};

export type ManualOrderItemPayload = {
  product_variation_id: number;
  quantity: number;
};

export type ManualOrderPayload = {
  customer_id: number;
  address_id: number;
  payment_type: "gateway" | "cod" | "mixed";
  delivery_charge_id: number;
  note?: string;
  coupon_code?: string;
  order_items: ManualOrderItemPayload[];
};

export type ManualOrderStrangerPayload = {
  name: string;
  phone: string;
  email?: string;
  full_address: string;
  city?: string;
  zip_code?: string;
  location_mapping_id?: number;
  payment_type: "gateway" | "cod" | "mixed" | "bkash";
  trx_id?: string;
  delivery_charge_id: number;
  coupon_code?: string;
  note?: string;
  order_items: ManualOrderItemPayload[];
};

export async function createManualAddress(payload: ManualAddressPayload) {
  const res = await api.post("/admin/manual-address", payload);
  return res.data;
}

export async function createManualOrder(payload: ManualOrderPayload) {
  const res = await api.post("/admin/manual-order", payload);
  return res.data;
}

export async function createManualOrderStranger(payload: ManualOrderStrangerPayload) {
  const res = await api.post("/admin/manual-order-stranger", payload);
  return res.data;
}
