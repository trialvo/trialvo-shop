import { useQuery } from "@tanstack/react-query";
import {
  getNotificationBatches,
  getNotificationLogs,
  getEmailLogs,
  getSmsLogs,
  getPushLogs,
  type LogsParams,
  type BatchesParams,
} from "@/api/notification-history.api";

// ─── Unified Logs (new, primary) ───────────────────────────────────────────

export function useNotificationLogs(params?: LogsParams) {
  return useQuery({
    queryKey: ["notification-logs", params],
    queryFn: () => getNotificationLogs(params),
    staleTime: 30_000,
  });
}

// ─── Batches ───────────────────────────────────────────────────────────────

export function useNotificationBatches(params?: BatchesParams) {
  return useQuery({
    queryKey: ["notification-batches", params],
    queryFn: () => getNotificationBatches(params),
    staleTime: 30_000,
  });
}

// ─── Legacy channel-specific hooks ────────────────────────────────────────

export function useEmailLogs(params?: LogsParams) {
  return useQuery({
    queryKey: ["email-logs", params],
    queryFn: () => getEmailLogs(params),
    staleTime: 30_000,
  });
}

export function useSmsLogs(params?: LogsParams) {
  return useQuery({
    queryKey: ["sms-logs", params],
    queryFn: () => getSmsLogs(params),
    staleTime: 30_000,
  });
}

export function usePushLogs(params?: LogsParams) {
  return useQuery({
    queryKey: ["push-logs", params],
    queryFn: () => getPushLogs(params),
    staleTime: 30_000,
  });
}
