import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDistributionSettings,
  updateDistributionSettings,
  getEligibleAdmins,
  getAgents,
  addAgent,
  editAgent,
  removeAgent,
  upsertAgentByAdminId,
  redistributeUnassigned,
  type AgentPayload,
  type DistributionSettings,
} from "@/api/order-distribution.api";

const distKeys = {
  settings: ["distribution-settings"] as const,
  agents: ["distribution-agents"] as const,
  eligibleAdmins: ["distribution-eligible-admins"] as const,
};

// ─── Settings ────────────────────────────────────────────────────────────── //

export function useDistributionSettings() {
  return useQuery({
    queryKey: distKeys.settings,
    queryFn: getDistributionSettings,
    staleTime: 30_000,
  });
}

export function useUpdateDistributionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<
        Pick<
          DistributionSettings,
          | "auto_assign_enabled"
          | "assign_on_order_create"
          | "include_admin_role"
          | "include_order_manager_role"
        >
      >
    ) => updateDistributionSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: distKeys.settings }),
  });
}

// ─── Eligible Admins (for pool management UI) ────────────────────────────── //

/** Eligible admins for pool UI — refetches every 30 s so counts stay live */
export function useEligibleAdmins() {
  return useQuery({
    queryKey: distKeys.eligibleAdmins,
    queryFn: getEligibleAdmins,
    staleTime:      15_000,
    refetchInterval: 30_000,
  });
}

// ─── Pool Agents (for existing pool records) ─────────────────────────────── //

export function useDeliveryAgents() {
  return useQuery({
    queryKey: distKeys.agents,
    queryFn: getAgents,
    staleTime: 15_000,
  });
}

export function useAddAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distKeys.agents });
      qc.invalidateQueries({ queryKey: distKeys.eligibleAdmins });
    },
  });
}

export function useEditAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<AgentPayload> }) =>
      editAgent(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distKeys.agents });
      qc.invalidateQueries({ queryKey: distKeys.eligibleAdmins });
    },
  });
}

export function useRemoveAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distKeys.agents });
      qc.invalidateQueries({ queryKey: distKeys.eligibleAdmins });
    },
  });
}

/** Upsert (add/update) a pool member by admin_id — used from toggle UI */
export function useUpsertAgentByAdminId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminId,
      body,
    }: {
      adminId: number;
      body: AgentPayload;
    }) => upsertAgentByAdminId(adminId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distKeys.agents });
      qc.invalidateQueries({ queryKey: distKeys.eligibleAdmins });
    },
  });
}

/** Bulk redistribute all unassigned orders */
export function useRedistributeUnassigned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: redistributeUnassigned,
    onSuccess: () => {
      // Invalidate distribution state and orders list
      qc.invalidateQueries({ queryKey: distKeys.eligibleAdmins });
      qc.invalidateQueries({ queryKey: distKeys.agents });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
