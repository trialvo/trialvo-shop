// src/api/payment-config.api.ts

import { PaymentProvider } from "@/components/business-settings/payment-settings/types";
import { api } from "./client";

export type PaymentSystemConfigResponse = {
  payment?: Record<string, any>;
};

export async function getPaymentSystemConfig() {
  const res = await api.get(`/config/getSystemConfig/?service=payment`);
  return res.data as PaymentSystemConfigResponse;
}

const UPDATE_ENDPOINT: Record<PaymentProvider, string> = {
  bkash: "/config/editBkashConfig",
  sslcommerz: "/config/editSslConfig",
  shurjopay: "/config/editShurjoPayConfig",
  nagad: "/config/editNagadConfig",
  rocket: "/config/editRocketConfig",
  cod: "/config/editCod",
};

export async function updatePaymentProviderConfig(
  provider: PaymentProvider,
  payload: Record<string, any>,
) {
  const endpoint = UPDATE_ENDPOINT[provider];
  const res = await api.put(endpoint, payload);
  return res.data;
}
