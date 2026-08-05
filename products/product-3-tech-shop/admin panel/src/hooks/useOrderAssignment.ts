import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignOrder,
  unassignOrder,
  getAssignmentLogs,
} from "@/api/order-assignment.api";
import { getAdminOrders } from "@/api/orders.api";

const assignmentKeys = {
  logs: (params: Record<string, unknown>) =>
    ["assignment-logs", params] as const,
};

// ──────────────────────────────────────────────────────────────────────────────
// Fetch open/active orders for the order-picker dropdown in Manual Assignment.
// Only loads non-terminal statuses (new, approved, processing, packaging, on_hold)
// so the list is actionable and reasonably sized.
// ──────────────────────────────────────────────────────────────────────────────
export function useAssignableOrders() {
  return useQuery({
    queryKey: ["assignable-orders"],
    queryFn: () =>
      getAdminOrders({
        limit: 200,
        offset: 0,
      }),
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}

export function useAssignmentLogs(params?: {
  order_id?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: assignmentKeys.logs(params ?? {}),
    queryFn: () => getAssignmentLogs(params),
    enabled: params?.order_id !== undefined ? !!params.order_id : true,
    staleTime: 10_000,
  });
}

export function useAssignOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignment-logs"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["distribution-eligible-admins"] });
      // Refresh the order picker so "Currently assigned to" reflects the new admin
      qc.invalidateQueries({ queryKey: ["assignable-orders"] });
    },
  });
}

export function useUnassignOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => unassignOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignment-logs"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["distribution-eligible-admins"] });
    },
  });
}
