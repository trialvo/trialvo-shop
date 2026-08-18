import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  company?: string;
  desired_domain?: string;
  use_case?: string;
  requested_days: number;
  status: string;
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
}

export function useAdminTrialRequests(status?: string) {
  const q = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["trialRequests", status || "all"],
    queryFn: () => api.get<TrialRequestRow[]>(`/admin/trial-requests${q}`),
  });
}

export function useTrialRequestMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["trialRequests"] });
    qc.invalidateQueries({ queryKey: ["trialInstances"] });
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
  return { approve, reject };
}

export function useSubmitTrialRequest() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<{
        statusUrl: string;
        statusToken: string;
        autoApproved?: boolean;
        status?: string;
        trialDays?: number;
        existing?: boolean;
        message?: string;
      }>("/trial/requests", body),
  });
}

export function useTrialStatus(token: string | undefined) {
  return useQuery({
    queryKey: ["trialStatus", token],
    queryFn: () => api.get<TrialStatusResponse>(`/trial/status/${token}`),
    enabled: !!token,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const instanceStatus = query.state.data?.instanceStatus;
      // Poll while request is pending or Opt2 still awaiting install
      if (status === 'pending') return 5000;
      if (instanceStatus === 'provisioning') return 10000;
      return false;
    },
  });
}

export interface TrialStatusResponse {
  status: string;
  trialType: 'hosted' | 'self_hosted';
  productName?: { bn?: string; en?: string };
  productSlug?: string;
  email?: string | null;
  customerName?: string | null;
  requestedAt?: string;
  approvedAt?: string;
  trialDays?: number;
  expiresAt?: string;
  shopUrl?: string;
  adminUrl?: string;
  apiUrl?: string;
  instanceStatus?: string;
  instanceId?: string | null;
  sharedDemo?: boolean;
  disclaimer?: string | null;
  installerUrl?: string;
  credentials?: {
    adminEmail?: string;
    adminPassword?: string;
    installId?: string;
    bootstrapToken?: string;
  };
}
