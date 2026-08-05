// src/components/settings/payment/types.ts

export type PaymentProvider =
  | "bkash"
  | "sslcommerz"
  | "shurjopay"
  | "nagad"
  | "rocket"
  | "cod";

export type Option = { value: string; label: string };

export type PaymentProviderConfigCard = {
  provider: PaymentProvider;

  // from API
  is_active: boolean;
  config: Record<string, any>;

  // derived
  defaultProvider?: PaymentProvider | null;
  isDefault: boolean;

  // UI derived (editable fields)
  gateway_name: string;
  type: string; // keep as string (backend says optional)
  note: string;
  env: "sandbox" | "production" | string; // backend supports sandbox/production
};

export type ProviderFieldType = "text" | "password" | "url";

export type ProviderFieldDef = {
  key: string; // API payload key (snake_case)
  label: string;
  placeholder?: string;
  type: ProviderFieldType;
  required?: boolean;
  helperText?: string;

  // map: read from system config keys (prefixed)
  readFromConfigKey: string;
};

export type ProviderDef = {
  provider: PaymentProvider;
  title: string; // label text
  category: string; // UI badge
  logoText: string;
  fields: ProviderFieldDef[];

  // common config key names in system config
  common: {
    gateway_name: string;
    type: string;
    note: string;
    env: string;
  };
};

export function paymentProviderTitle(p: PaymentProvider) {
  if (p === "bkash") return "bKash";
  if (p === "sslcommerz") return "SSLCommerz";
  if (p === "shurjopay") return "ShurjoPay";
  if (p === "nagad") return "Nagad";
  if (p === "rocket") return "Rocket";
  return "Cash on Delivery";
}
