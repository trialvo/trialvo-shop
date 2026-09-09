// src/api/service-config.api.ts

import { api } from "./client";

export type SystemSmsConfigResponse = {
  sms?: Record<string, any>;
};

export type SystemEmailConfigResponse = {
  email?: Record<string, any>;
};

export type SmsProvider = "alphasms" | "bulksms";

export type SmsBalanceResponse = {
  success: boolean;
  provider?: string; // e.g. "Alpha SMS"
  balance?: number;
  unit?: string; // e.g. "BDT"
};

export async function getSmsSystemConfig() {
  const res = await api.get(`/config/getSystemConfig/?service=sms`);
  return res.data as SystemSmsConfigResponse;
}

export async function getEmailSystemConfig() {
  const res = await api.get(`/config/getSystemConfig/?service=email`);
  return res.data as SystemEmailConfigResponse;
}

/**
 * Email Update
 * PUT /config/updateEmailConfig
 */
export async function updateEmailConfig(payload: {
  MAIL_HOST?: string;
  MAIL_PORT?: string;
  MAIL_USER?: string;
  MAIL_PASS?: string;
  MAIL_FROM?: string;
  MAIL_FROM_NAME?: string;
  setNull?: boolean;
}) {
  const res = await api.put(`/config/updateEmailConfig`, payload);
  return res.data;
}

export type EmailLogoStatus = {
  hasLogo: boolean;
};

export async function getEmailLogoStatus() {
  const res = await api.get(`/config/emailLogo`);
  return res.data as EmailLogoStatus;
}

export async function uploadEmailLogo(file: File) {
  const form = new FormData();
  form.append("logo", file);
  const res = await api.post(`/config/emailLogo`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteEmailLogo() {
  const res = await api.delete(`/config/emailLogo`);
  return res.data;
}

/** Authenticated blob URL for admin preview only — not used in customer emails. */
export async function fetchEmailLogoPreviewUrl(): Promise<string | null> {
  const res = await api.get(`/config/emailLogo/file`, { responseType: "blob" });
  const blob = res.data as Blob;
  if (!blob || blob.size === 0) return null;
  if (blob.type && blob.type.includes("application/json")) return null;
  return URL.createObjectURL(blob);
}

/**
 * SMS Provider Update
 * - PUT /config/alphaSms
 * - PUT /config/bulkSms
 */
export async function updateSmsProviderConfig(
  provider: SmsProvider,
  payload: {
    status?: boolean;
    api_key?: string;
    base_url?: string;
    sender_id?: string;
    setNull?: boolean;
  },
) {
  const endpoint = provider === "alphasms" ? "/config/alphaSms" : "/config/bulkSms";
  const res = await api.put(endpoint, payload);
  return res.data;
}

/**
 * Set Active SMS Provider (Default)
 * PATCH /config/setActiveSmsProvider
 */
export async function setActiveSmsProvider(payload: { provider: SmsProvider }) {
  const res = await api.patch(`/config/setActiveSmsProvider`, payload);
  return res.data;
}


/**
 * Get SMS balance for a provider
 * GET /config/getSmsBalance?provider=bulksms
 */
export async function getSmsBalance(provider: SmsProvider) {
  const res = await api.get(`/config/getSmsBalance`, {
    params: { provider },
  });
  return res.data as SmsBalanceResponse;
}

/**
 * Test SMS send (uses active provider on backend)
 * POST /config/testSms
 */
export async function testSms(payload: { number: string; message: string }) {
  const res = await api.post(`/config/testSms`, payload);
  return res.data;
}
