// src/api/courier-config.api.ts

import { CourierProvider } from "@/components/business-settings/currier-settings/types";
import { api } from "./client";

export type CourierSystemConfigResponse = {
  courier?: Record<string, any>;
};

const ENDPOINT_BY_PROVIDER: Record<CourierProvider, string> = {
  steadfast: "/config/editSteadfastConfig",
  redx: "/config/editRedxConfig",
  pathao: "/config/editPathaoConfig",
  paperfly: "/config/editPaperflyConfig",
};

export async function getCourierSystemConfig(): Promise<CourierSystemConfigResponse> {
  const res = await api.get(`/config/getSystemConfig/?service=courier`);
  return res.data;
}

export async function setDefaultCourier(provider: CourierProvider) {
  const res = await api.patch(`/config/setDefaultCourier`, { provider });
  return res.data;
}

export async function updateCourierProviderConfig(provider: CourierProvider, form: FormData) {
  const endpoint = ENDPOINT_BY_PROVIDER[provider];
  const res = await api.put(endpoint, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function generateSteadfastWebhookToken(): Promise<{ success: boolean; token: string }> {
  const res = await api.get("/config/steadfast/webhook-token");
  return res.data;
}
