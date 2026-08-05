// src/hooks/useReports.ts  — V2-037 (added useReportEligibleAdmins)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListReports,
  adminReportCounts,
  adminGetReport,
  adminReplyReport,
  adminAssignReport,
  adminUpdateReportStatus,
  adminDeleteReport,
  getReportDistributionSettings,
  updateReportDistributionSettings,
  getReportEligibleAdmins,
  getReportDistributionAgents,
  upsertReportAgent,
  removeReportAgent,
  redistributeReports,
  // V2-038
  manualAssignReport,
  unassignReport,
  getReportAssignmentLogs,
  type GetReportsParams,
  type ReportStatus,
  type ReportPriority,
  type ReportAgentPayload,
  type ReportDistributionSettings,
} from "@/api/reports.api";

// ─── Query keys ───────────────────────────────────────────────────────────── //

export const reportKeys = {
  all:            ["reports"] as const,
  list:           (p: GetReportsParams) => ["reports", "list", p] as const,
  counts:         ["reports", "counts"] as const,
  detail:         (id: number) => ["reports", "detail", id] as const,
  distSettings:   ["report-dist-settings"] as const,
  distAgents:     ["report-dist-agents"] as const,
  eligibleAdmins: ["report-dist-eligible"] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────── //

export function useAdminReports(params: GetReportsParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn:  () => adminListReports(params),
    staleTime: 15_000,
  });
}

export function useAdminReportCounts() {
  return useQuery({
    queryKey: reportKeys.counts,
    queryFn:  adminReportCounts,
    staleTime: 10_000,
  });
}

export function useAdminReport(id: number | null) {
  return useQuery({
    queryKey: id ? reportKeys.detail(id) : ["reports", "detail", null],
    queryFn:  () => adminGetReport(id!),
    enabled:  id !== null,
  });
}

export function useReportDistributionSettings() {
  return useQuery({
    queryKey: reportKeys.distSettings,
    queryFn:  getReportDistributionSettings,
    staleTime: 30_000,
  });
}

/** V2-037: Eligible admins for report pool UI — refetches every 30 s so counts stay live */
export function useReportEligibleAdmins() {
  return useQuery({
    queryKey: reportKeys.eligibleAdmins,
    queryFn:  getReportEligibleAdmins,
    staleTime:       15_000,
    refetchInterval: 30_000,
  });
}

export function useReportDistributionAgents() {
  return useQuery({
    queryKey: reportKeys.distAgents,
    queryFn:  getReportDistributionAgents,
    staleTime: 15_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────── //

export function useAdminReplyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { reply_text: string; via?: string; images?: File[] } }) =>
      adminReplyReport(id, body),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: reportKeys.detail(id) });
      qc.invalidateQueries({ queryKey: reportKeys.counts });
      // A reply may change read/replied state which affects active_report_count
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
    },
  });
}

export function useAdminAssignReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_id }: { id: number; admin_id: number }) =>
      adminAssignReport(id, admin_id),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: reportKeys.detail(id) });
      qc.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useAdminUpdateReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { status?: ReportStatus; priority?: ReportPriority } }) =>
      adminUpdateReportStatus(id, body),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: reportKeys.detail(id) });
      qc.invalidateQueries({ queryKey: reportKeys.all });
      qc.invalidateQueries({ queryKey: reportKeys.counts });
      // Status change (resolved/closed) removes report from active count in pool tab
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
      qc.invalidateQueries({ queryKey: reportKeys.distAgents });
    },
  });
}

export function useAdminDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminDeleteReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.all });
      qc.invalidateQueries({ queryKey: reportKeys.counts });
      // Deleting a report removes it from active count in pool tab
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
    },
  });
}

export function useUpdateReportDistributionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<ReportDistributionSettings, "auto_assign_enabled" | "assign_on_report_create" | "include_admin_role" | "include_order_manager_role">>) =>
      updateReportDistributionSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.distSettings }),
  });
}

export function useUpsertReportAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, body }: { adminId: number; body: ReportAgentPayload }) =>
      upsertReportAgent(adminId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.distAgents });
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
    },
  });
}

export function useRemoveReportAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeReportAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.distAgents });
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
    },
  });
}

export function useRedistributeReports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: redistributeReports,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
      qc.invalidateQueries({ queryKey: reportKeys.all });
      qc.invalidateQueries({ queryKey: reportKeys.counts });
    },
  });
}

// ─── V2-038: Manual Assign / Unassign / Logs ─────────────────────────────── //

export const reportAssignmentLogKeys = {
  logs: (params: Record<string, unknown>) => ["report-assignment-logs", params] as const,
};

export function useReportAssignmentLogs(params?: { report_id?: number; limit?: number }) {
  return useQuery({
    queryKey: reportAssignmentLogKeys.logs(params ?? {}),
    queryFn: () => getReportAssignmentLogs(params),
    staleTime: 10_000,
  });
}

export function useManualAssignReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: manualAssignReport,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["report-assignment-logs"] });
      qc.invalidateQueries({ queryKey: reportKeys.all });
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
      if (vars.report_id) qc.invalidateQueries({ queryKey: reportKeys.detail(vars.report_id) });
    },
  });
}

export function useUnassignReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unassignReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-assignment-logs"] });
      qc.invalidateQueries({ queryKey: reportKeys.all });
      qc.invalidateQueries({ queryKey: reportKeys.eligibleAdmins });
    },
  });
}
