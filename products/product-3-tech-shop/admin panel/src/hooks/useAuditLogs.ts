import { useQuery } from "@tanstack/react-query";
import {
  getAdminAuditLogs,
  getAdminActionKeys,
  getUserAuditLogs,
  getUserActionKeys,
  type AdminAuditLogParams,
  type UserAuditLogParams,
} from "@/api/audit.api";

// ─── Admin Audit ──────────────────────────────────────────────────────────────

export const auditKeys = {
  adminLogs: (params: AdminAuditLogParams) => ["admin-audit-logs", params] as const,
  adminActionKeys: ["admin-action-keys"] as const,
  userLogs: (params: UserAuditLogParams) => ["user-audit-logs", params] as const,
  userActionKeys: ["user-action-keys"] as const,
};

export function useAdminAuditLogs(params: AdminAuditLogParams) {
  return useQuery({
    queryKey: auditKeys.adminLogs(params),
    queryFn: () => getAdminAuditLogs(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminActionKeys() {
  return useQuery({
    queryKey: auditKeys.adminActionKeys,
    queryFn: getAdminActionKeys,
    staleTime: 5 * 60 * 1000, // cache 5 min — rarely changes
  });
}

// ─── User Audit ───────────────────────────────────────────────────────────────

export function useUserAuditLogs(params: UserAuditLogParams) {
  return useQuery({
    queryKey: auditKeys.userLogs(params),
    queryFn: () => getUserAuditLogs(params),
    placeholderData: (prev) => prev,
  });
}

export function useUserActionKeys() {
  return useQuery({
    queryKey: auditKeys.userActionKeys,
    queryFn: getUserActionKeys,
    staleTime: 5 * 60 * 1000,
  });
}
