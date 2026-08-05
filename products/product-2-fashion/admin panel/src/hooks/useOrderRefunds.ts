import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRefund, getRefundsForOrder, updateRefundStatus,
  type CreateRefundPayload, type RefundStatus,
} from "@/api/order-refunds.api";

const refundKeys = {
  forOrder: (orderId: number) => ["refunds", orderId] as const,
};

export function useOrderRefunds(order_id: number | null) {
  return useQuery({
    queryKey: order_id ? refundKeys.forOrder(order_id) : ["refunds"],
    queryFn: () => getRefundsForOrder(order_id!),
    enabled: Boolean(order_id),
  });
}

export function useCreateRefund(order_id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRefund,
    onSuccess: () => qc.invalidateQueries({ queryKey: refundKeys.forOrder(order_id) }),
  });
}

export function useCreateRefundGeneric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRefundPayload) => createRefund(payload),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: refundKeys.forOrder(vars.order_id) }),
  });
}

export function useUpdateRefundStatus(order_id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: RefundStatus }) => updateRefundStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: refundKeys.forOrder(order_id) }),
  });
}
