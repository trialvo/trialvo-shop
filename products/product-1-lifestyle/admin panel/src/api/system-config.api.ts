// src/api/system-config.api.ts

import { api } from "./client";

export type SystemConfigService = "payment" | "courier" | "sms" | "email";

export async function getSystemConfig(service?: SystemConfigService) {
  const qs = service ? `?service=${encodeURIComponent(service)}` : "";
  const res = await api.get(`/config/getSystemConfig/${qs}`);
  return res.data;
}
