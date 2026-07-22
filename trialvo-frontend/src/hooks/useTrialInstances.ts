import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TrialInstanceRow {
  id: string;
  install_id: string;
  trial_type: string;
  status: string;
  domain?: string;
  subdomain?: string;
  shop_url?: string;
  admin_url?: string;
  product_slug?: string;
  product_name?: { bn?: string; en?: string };
  expires_at?: string;
  last_heartbeat_at?: string;
  agent_version?: string;
  meta?: { agent_outdated?: boolean; required_agent_version?: string; [k: string]: unknown };
  created_at: string;
}

export function useAdminTrialInstances(status?: string) {
  const q = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["trialInstances", status || "all"],
    queryFn: () => api.get<TrialInstanceRow[]>(`/admin/trial-instances${q}`),
  });
}

export function useTrialInstanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["trialInstances"] });

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
  return { freeze, unfreeze, extend, destroy, credentials, backup, listBackups, restore };
}
