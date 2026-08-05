import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TrialInstanceRow {
  id: string;
  install_id: string;
  trial_type: string;
  instance_kind?: "trial" | "paid" | "unlicensed";
  status: string;
  domain?: string;
  subdomain?: string;
  shop_url?: string;
  admin_url?: string;
  admin_email?: string;
  product_slug?: string;
  product_name?: { bn?: string; en?: string };
  customer_name?: string;
  request_email?: string;
  entitlement_email?: string;
  license_key_hint?: string;
  expires_at?: string;
  last_heartbeat_at?: string;
  agent_version?: string;
  meta?: {
    agent_outdated?: boolean;
    required_agent_version?: string;
    sharedDemo?: boolean;
    domain_conflict?: { previous?: string; attempted?: string };
    alert?: string;
    [k: string]: unknown;
  };
  created_at: string;
}

export type InstanceScope = "trials" | "deployments" | "all";

export function useAdminTrialInstances(status?: string, scope: InstanceScope = "trials") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (scope && scope !== "all") params.set("scope", scope);
  const q = params.toString() ? `?${params}` : "";
  return useQuery({
    queryKey: ["trialInstances", scope, status || "all"],
    queryFn: () => api.get<TrialInstanceRow[]>(`/admin/trial-instances${q}`),
    refetchInterval: (query) => {
      const rows = query.state.data;
      if (Array.isArray(rows) && rows.some((r) => r.status === "destroying")) return 4000;
      return false;
    },
  });
}

export function useDeploymentAnalytics() {
  return useQuery({
    queryKey: ["deploymentAnalytics"],
    queryFn: () =>
      api.get<{
        paidActive: number;
        paidFrozen: number;
        unlicensed: number;
        domainConflicts: number;
        staleHeartbeat: number;
      }>("/admin/trial-instances/deployment-analytics"),
    refetchInterval: 30_000,
  });
}

export function useTrialInstanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["trialInstances"] });
    qc.invalidateQueries({ queryKey: ["deploymentAnalytics"] });
  };

  const freeze = useMutation({
    mutationFn: (id: string) => api.post(`/admin/trial-instances/${id}/freeze`, {}),
    onSuccess: invalidate,
  });
  const unfreeze = useMutation({
    mutationFn: (id: string) => api.post(`/admin/trial-instances/${id}/unfreeze`, {}),
    onSuccess: invalidate,
  });
  const extend = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      api.post(`/admin/trial-instances/${id}/extend`, { days }),
    onSuccess: invalidate,
  });
  const destroy = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode?: "soft" | "hard" }) =>
      api.post(`/admin/trial-instances/${id}/destroy`, { mode: mode || "soft" }),
    onSuccess: invalidate,
  });
  const credentials = useMutation({
    mutationFn: (id: string) =>
      api.get<{ adminEmail: string; adminPassword: string }>(`/admin/trial-instances/${id}/credentials`),
  });
  const backup = useMutation({
    mutationFn: (id: string) => api.post<{ commandId: string }>(`/admin/trial-instances/${id}/backup`, {}),
    onSuccess: invalidate,
  });
  const listBackups = useMutation({
    mutationFn: (id: string) =>
      api.get<Array<{ id: string; status: string; created_at: string }>>(`/admin/trial-instances/${id}/backups`),
  });
  const restore = useMutation({
    mutationFn: ({ id, backupId }: { id: string; backupId: string }) =>
      api.post(`/admin/trial-instances/${id}/restore`, { backupId }),
    onSuccess: invalidate,
  });
  const transferDomain = useMutation({
    mutationFn: ({ id, domain }: { id: string; domain: string }) =>
      api.post(`/admin/trial-instances/${id}/transfer-domain`, { domain }),
    onSuccess: invalidate,
  });
  const convertToPaid = useMutation({
    mutationFn: ({ id, entitlementId }: { id: string; entitlementId: string }) =>
      api.post(`/admin/trial-instances/${id}/convert-to-paid`, { entitlementId }),
    onSuccess: invalidate,
  });
  const reissuePack = useMutation({
    mutationFn: (id: string) =>
      api.post<{ ok: boolean; packToken?: string; dockerUrl?: string; emailed?: boolean }>(
        `/admin/trial-instances/${id}/reissue-pack`,
        {},
      ),
    onSuccess: invalidate,
  });
  return {
    freeze,
    unfreeze,
    extend,
    destroy,
    credentials,
    backup,
    listBackups,
    restore,
    transferDomain,
    convertToPaid,
    reissuePack,
  };
}
