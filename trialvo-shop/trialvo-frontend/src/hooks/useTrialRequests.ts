import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  DemoSubmitResponse,
  DomainSubmitResponse,
  FulfillmentStage,
  HostKind,
  HostingSource,
  StageHistoryEntry,
  TrialCredentials,
} from "@/lib/trial/types";

/** Admin list row — trial_requests joined with product, latest instance and source demo. */
export interface TrialRequestRow {
  id: string;
  public_token: string;
  product_id: string;
  product_slug?: string;
  product_name?: { bn?: string; en?: string };
  trial_type: "hosted" | "self_hosted";
  customer_name: string;
  email: string;
  phone: string;
  company?: string | null;
  desired_domain?: string | null;
  use_case?: string | null;
  requested_days: number;
  requested_months?: number | null;
  hosting_source?: HostingSource | null;
  host_kind?: HostKind | null;
  has_hosting?: number | boolean;
  fulfillment_stage?: FulfillmentStage | null;
  stage_history?: StageHistoryEntry[];
  source_request_id?: string | null;
  source_demo_started_at?: string | null;
  status: string;
  admin_notes?: string | null;
  assigned_admin_id?: string | null;
  assigned_admin_name?: string | null;
  created_at: string;
  approved_at?: string | null;
  picked_up_at?: string | null;
  fulfilled_at?: string | null;
  age_hours?: number;
  instance_id?: string | null;
  instance_status?: string | null;
  instance_expires?: string | null;
  instance_shop_url?: string | null;
  provision_mode?: string | null;
}

export type TrialRequestFilters = {
  type?: "hosted" | "self_hosted";
  status?: string;
  stage?: FulfillmentStage;
  product?: string;
  q?: string;
};

export function useAdminTrialRequests(filters: TrialRequestFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, String(v));
  });
  const qs = params.toString();
  return useQuery({
    queryKey: ["trialRequests", filters],
    queryFn: () => api.get<TrialRequestRow[]>(`/admin/trial-requests${qs ? `?${qs}` : ""}`),
  });
}

export interface TrialRequestCounts {
  demo: { total: number; pending: number; active: number };
  domain: { total: number; byStage: Partial<Record<FulfillmentStage, number>>; overdue: number };
}

export function useTrialRequestCounts() {
  return useQuery({
    queryKey: ["trialRequestCounts"],
    queryFn: () => api.get<TrialRequestCounts>("/admin/trial-requests/counts"),
    refetchInterval: 60_000,
  });
}

export type FulfillPayload = {
  id: string;
  shopUrl: string;
  adminUrl: string;
  adminEmail?: string;
  adminPassword?: string;
  months?: number;
  hostKind?: HostKind;
  notes?: string;
};

export function useTrialRequestMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["trialRequests"] });
    qc.invalidateQueries({ queryKey: ["trialRequestCounts"] });
    qc.invalidateQueries({ queryKey: ["trialInstances"] });
    qc.invalidateQueries({ queryKey: ["trialFunnel"] });
  };

  const approve = useMutation({
    mutationFn: ({ id, days, notes }: { id: string; days?: number; notes?: string }) =>
      api.post(`/admin/trial-requests/${id}/approve`, { days, notes }),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/admin/trial-requests/${id}/reject`, { reason }),
    onSuccess: invalidate,
  });
  const pickup = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.post(`/admin/trial-requests/${id}/pickup`, { note }),
    onSuccess: invalidate,
  });
  const confirmHosting = useMutation({
    mutationFn: ({ id, hostKind, domain, note }: { id: string; hostKind: HostKind; domain?: string; note?: string }) =>
      api.post(`/admin/trial-requests/${id}/hosting-confirmed`, { hostKind, domain, note }),
    onSuccess: invalidate,
  });
  const reopen = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.post(`/admin/trial-requests/${id}/reopen`, { note }),
    onSuccess: invalidate,
  });
  const fulfill = useMutation({
    mutationFn: ({ id, ...body }: FulfillPayload) =>
      api.post<{ ok: boolean; instanceId: string; expiresAt: string; months: number }>(
        `/admin/trial-requests/${id}/fulfill`,
        body,
      ),
    onSuccess: invalidate,
  });
  const saveNotes = useMutation({
    mutationFn: ({ id, admin_notes }: { id: string; admin_notes: string }) =>
      api.patch(`/admin/trial-requests/${id}`, { admin_notes }),
    onSuccess: invalidate,
  });
  return { approve, reject, pickup, confirmHosting, reopen, fulfill, saveNotes };
}

export type SubmitTrialBody = {
  productSlug: string;
  trialType: "demo" | "domain" | "hosted" | "self_hosted";
  name: string;
  email: string;
  phone: string;
  company?: string;
  useCase?: string;
  website?: string;
  // domain path
  desiredDomain?: string;
  requestedMonths?: number;
  hostingSource?: HostingSource;
  hostKind?: HostKind;
  hasHosting?: boolean;
  sourceRequestId?: string;
};

export function useSubmitInstantDemo() {
  return useMutation({
    mutationFn: (body: SubmitTrialBody) =>
      api.post<DemoSubmitResponse>("/trial/requests", { ...body, trialType: "demo" }),
  });
}

export function useSubmitDomainTrial() {
  return useMutation({
    mutationFn: (body: SubmitTrialBody) =>
      api.post<DomainSubmitResponse>("/trial/requests", { ...body, trialType: "domain" }),
  });
}

/** @deprecated use useSubmitInstantDemo / useSubmitDomainTrial */
export function useTrialStatus(token: string | undefined) {
  return useQuery({
    queryKey: ["trialStatus", token],
    queryFn: () => api.get<TrialStatusResponse>(`/trial/status/${token}`),
    enabled: !!token,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return false;
      // Instant demo still provisioning → poll fast so the creds appear without a reload.
      if (d.path === "demo" && d.status === "pending") return 3000;
      if (d.instanceStatus === "provisioning") return 10000;
      // Domain pipeline: staff moves it by hand; a slow poll keeps the timeline honest.
      if (d.path === "domain" && ["received", "hosting_pending", "deploying"].includes(d.fulfillmentStage || "")) {
        return 30000;
      }
      return false;
    },
  });
}

export interface TrialStatusResponse {
  path: "demo" | "domain";
  status: string;
  trialType: "hosted" | "self_hosted";
  productName?: { bn?: string; en?: string };
  productSlug?: string;
  email?: string | null;
  customerName?: string | null;
  requestedAt?: string;
  approvedAt?: string | null;
  trialDays?: number;
  requestedMonths?: number | null;
  expiresAt?: string | null;
  daysLeft?: number | null;
  shopUrl?: string | null;
  adminUrl?: string | null;
  apiUrl?: string | null;
  instanceStatus?: string | null;
  instanceId?: string | null;
  instanceKind?: string | null;
  provisionMode?: "shared" | "agent" | "manual" | null;
  sharedDemo?: boolean;
  disclaimer?: string | null;
  installerUrl?: string;
  credentials?: TrialCredentials;

  fulfillmentStage?: FulfillmentStage | null;
  stageHistory?: StageHistoryEntry[];
  hostingSource?: HostingSource | null;
  hostKind?: HostKind | null;
  desiredDomain?: string | null;
  slaHours?: number;
  pickedUpAt?: string | null;
  fulfilledAt?: string | null;

  sourceDemo?: { statusToken: string; startedAt: string } | null;
  linkedDomainRequest?: {
    statusToken: string;
    fulfillmentStage?: FulfillmentStage | null;
    status: string;
    requestedAt: string;
  } | null;
  domainTrialOffer?: { months: number[]; maxMonths: number } | null;
}

export interface TrialFunnel {
  windowDays: number;
  steps: { id: string; count: number; pctOfPrev?: number }[];
  domain: {
    total: number;
    fromDemo: number;
    buyHosting: number;
    vps: number;
    cpanel: number;
    overdue: number;
    avgFulfillHours: number | null;
  };
}

export function useTrialFunnel(days = 30) {
  return useQuery({
    queryKey: ["trialFunnel", days],
    queryFn: () => api.get<TrialFunnel>(`/admin/trial-instances/funnel?days=${days}`),
    staleTime: 60_000,
  });
}
