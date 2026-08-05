// src/hooks/useContactDistribution.ts — V2-037
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getContactDistributionSettings,
  updateContactDistributionSettings,
  getContactEligibleAdmins,
  upsertContactAgent,
  removeContactAgent,
  redistributeContactMessages,
  // V2-038
  manualAssignContactMessage,
  unassignContactMessage,
  getContactAssignmentLogs,
  type ContactAgentPayload,
  type ContactDistributionSettings,
} from "@/api/contact-distribution.api";

const keys = {
  settings:  ["contact-dist-settings"] as const,
  eligible:  ["contact-dist-eligible"] as const,
};

export function useContactDistributionSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn:  getContactDistributionSettings,
    staleTime: 30_000,
  });
}

export function useContactEligibleAdmins() {
  return useQuery({
    queryKey: keys.eligible,
    queryFn:  getContactEligibleAdmins,
    staleTime:       15_000,
    refetchInterval: 30_000,
  });
}

export function useUpdateContactDistributionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<ContactDistributionSettings, "auto_assign_enabled" | "assign_on_message_create" | "include_admin_role" | "include_order_manager_role">>) =>
      updateContactDistributionSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings }),
  });
}

export function useUpsertContactAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, body }: { adminId: number; body: ContactAgentPayload }) =>
      upsertContactAgent(adminId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.eligible }),
  });
}

export function useRemoveContactAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeContactAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.eligible }),
  });
}

export function useRedistributeContactMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: redistributeContactMessages,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.eligible }),
  });
}

// ─── V2-038: Manual Assign / Unassign / Logs ─────────────────────────────── //

const contactAssignmentKeys = {
  logs: (params: Record<string, unknown>) => ["contact-assignment-logs", params] as const,
};

export function useContactAssignmentLogs(params?: { message_id?: number; limit?: number }) {
  return useQuery({
    queryKey: contactAssignmentKeys.logs(params ?? {}),
    queryFn: () => getContactAssignmentLogs(params),
    staleTime: 10_000,
  });
}

export function useManualAssignContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: manualAssignContactMessage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-assignment-logs"] });
      qc.invalidateQueries({ queryKey: keys.eligible });
      qc.invalidateQueries({ queryKey: ["contact-messages"] });
    },
  });
}

export function useUnassignContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unassignContactMessage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-assignment-logs"] });
      qc.invalidateQueries({ queryKey: keys.eligible });
      qc.invalidateQueries({ queryKey: ["contact-messages"] });
    },
  });
}
