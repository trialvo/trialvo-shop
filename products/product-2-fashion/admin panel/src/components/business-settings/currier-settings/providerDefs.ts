import type { CourierProviderDef } from "./types";

export const COURIER_PROVIDER_DEFS: CourierProviderDef[] = [
  {
    provider: "steadfast",
    title: "Steadfast",
    category: "Courier",
    logoText: "SF",
    common: {
      base_url: "STEADFAST_BASE_URL",
      description: "STEADFAST_DESC",
      note: "STEADFAST_NOTE",
      image: "STEADFAST_IMG",
    },
    fields: [
      {
        key: "api_key",
        readFromConfigKey: "STEADFAST_API_KEY",
        label: "API Key",
        required: true,
      },
      {
        key: "secret_key",
        readFromConfigKey: "STEADFAST_SECRET_KEY",
        label: "Secret Key",
        required: true,
        type: "password",
      },
      {
        key: "webhook_secret",
        readFromConfigKey: "STEADFAST_WEBHOOK_SECRET",
        label: "Webhook Secret (JWT Token)",
        required: false,
        type: "password",
        helperText: "Set this JWT token in Steadfast → Webhook Settings → Authorization header",
      },
    ],
  },
  {
    provider: "redx",
    title: "RedX",
    category: "Courier",
    logoText: "RX",
    common: {
      base_url: "REDX_BASE_URL",
      description: "REDX_DESC",
      note: "REDX_NOTE",
      image: "REDX_IMG",
    },
    fields: [
      {
        key: "store_id",
        readFromConfigKey: "REDX_STORE_ID",
        label: "Store ID",
        required: true,
      },
      {
        key: "token",
        readFromConfigKey: "REDX_TOKEN",
        label: "Token",
        required: true,
        type: "password",
      },
    ],
  },
  {
    provider: "pathao",
    title: "Pathao",
    category: "Courier",
    logoText: "PA",
    common: {
      base_url: "PATHAO_BASE_URL",
      description: "PATHAO_DESC",
      note: "PATHAO_NOTE",
      image: "PATHAO_IMG",
    },
    fields: [
      {
        key: "store_id",
        readFromConfigKey: "PATHAO_STORE_ID",
        label: "Store ID",
        required: true,
      },
      {
        key: "client_id",
        readFromConfigKey: "PATHAO_CLIENT_ID",
        label: "Client ID",
        required: true,
      },
      {
        key: "client_secret",
        readFromConfigKey: "PATHAO_CLIENT_SECRET",
        label: "Client Secret",
        required: true,
        type: "password",
      },
      {
        key: "email",
        readFromConfigKey: "PATHAO_EMAIL",
        label: "Email",
        required: true,
      },
      {
        key: "password",
        readFromConfigKey: "PATHAO_PASS",
        label: "Password",
        required: true,
        type: "password",
      },
      {
        key: "webhook_secret",
        readFromConfigKey: "PATHAO_WEBHOOK_SECRET",
        label: "Webhook Integration Secret",
        required: false,
        type: "password",
        helperText: "From Pathao Merchant Dashboard → Developer's API → Webhook Integration",
      },
    ],
  },
  {
    provider: "paperfly",
    title: "Paperfly",
    category: "Courier",
    logoText: "PF",
    common: {
      base_url: "PAPERFLY_BASE_URL",
      description: "PAPERFLY_DESC",
      note: "PAPERFLY_NOTE",
      image: "PAPERFLY_IMG",
    },
    fields: [
      {
        key: "api_key",
        readFromConfigKey: "PAPERFLY_API_KEY",
        label: "API Key",
        required: true,
      },
      {
        key: "user",
        readFromConfigKey: "PAPERFLY_USER",
        label: "User",
        required: true,
      },
      {
        key: "password",
        readFromConfigKey: "PAPERFLY_PASS",
        label: "Password",
        required: true,
        type: "password",
      },
    ],
  },
];
