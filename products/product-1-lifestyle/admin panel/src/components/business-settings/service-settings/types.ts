// src/components/business-settings/service-settings/types.ts

export type SmsProvider = "alphasms" | "bulksms";

export type SmsProviderCard = {
  provider: SmsProvider;
  is_active: boolean;
  config: Record<string, any>;

  // derived UI
  gateway_name: string;
  apiKey: string;
  senderId: string;
  url: string;
};

export type EmailCard = {
  is_active: boolean;
  config: Record<string, any>;

  // derived UI
  host: string;
  port: string;
  user: string;
  pass: string;
};

export function smsProviderTitle(p: SmsProvider) {
  if (p === "alphasms") return "Alpha SMS";
  return "Bulk SMS";
}
