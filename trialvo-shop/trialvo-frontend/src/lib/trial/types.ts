/**
 * Domain types for the two trial paths. Kept free of React so hooks, copy and
 * validation can all import from here without circular dependencies.
 */

/** Public-facing path names. Map 1:1 to backend trial_type. */
export type TrialPath = "demo" | "domain";
export type TrialType = "hosted" | "self_hosted";

export const TRIAL_TYPE_FOR_PATH: Record<TrialPath, TrialType> = {
  demo: "hosted",
  domain: "self_hosted",
};

export type HostingSource = "own" | "buy_from_trialvo";
export type HostKind = "vps" | "cpanel";

/** Own-domain fulfillment pipeline — mirrors trialFulfillment.js STAGES. */
export type FulfillmentStage =
  | "received"
  | "hosting_pending"
  | "deploying"
  | "live"
  | "expiring"
  | "expired"
  | "converted"
  | "rejected";

export type StageHistoryEntry = {
  stage: FulfillmentStage;
  at: string;
  by?: string | null;
  note?: string | null;
};

export type TrialCredentials = {
  adminEmail?: string;
  adminPassword?: string | null;
  installId?: string;
  bootstrapToken?: string | null;
};

/** Minimal product shape the trial dialogs need. Accepts a full Product too. */
export type TrialProductRef = {
  slug: string;
  name: { bn?: string; en?: string } | string;
  thumbnail?: string;
  deployConfig?: Record<string, unknown> | null;
  isTrialable?: boolean;
};

export type DemoSubmitResponse = {
  ok: boolean;
  path?: "demo";
  existing?: boolean;
  requestId: string;
  statusToken: string;
  statusUrl: string;
  status: string;
  provisioning?: boolean;
  instanceId?: string;
  shopUrl?: string | null;
  adminUrl?: string | null;
  expiresAt?: string | null;
  trialDays?: number;
  credentials?: TrialCredentials;
  message?: string;
};

export type DomainSubmitResponse = {
  ok: boolean;
  path?: "domain";
  existing?: boolean;
  requestId: string;
  statusToken: string;
  statusUrl: string;
  status: string;
  fulfillmentStage?: FulfillmentStage;
  requestedMonths?: number;
  hostingSource?: HostingSource;
  hostKind?: HostKind | null;
  desiredDomain?: string | null;
  slaHours?: number;
  message?: string;
};

export function productDisplayName(p: TrialProductRef, language: "bn" | "en"): string {
  if (typeof p.name === "string") return p.name;
  return p.name[language] || p.name.en || p.name.bn || p.slug;
}

export function productSupportsDemo(p: TrialProductRef): boolean {
  return p.deployConfig?.supports_option1 !== false;
}

export function productSupportsDomainTrial(p: TrialProductRef): boolean {
  return p.deployConfig?.supports_option2 !== false;
}
