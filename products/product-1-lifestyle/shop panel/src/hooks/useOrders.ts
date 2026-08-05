"use client";

import {
  orderKeys,
  orderService,
  type GetOrdersParams,
} from "@/lib/api/order/service";
import { toOrderDisplay, type OrderDisplay } from "@/lib/orders/order-display";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type UseOrdersResult = {
  orders: OrderDisplay[];
  isLoading: boolean;
  error: Error | null;
};

export function useOrders(
  params: GetOrdersParams,
  enabled: boolean,
): UseOrdersResult {
  const query = useQuery<OrderDisplay[], Error>({
    queryKey: orderKeys.list(params),
    enabled,
    queryFn: async () => {
      const response = await orderService.getOrders(params);
      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to load orders");
      }

      return response.data.map(toOrderDisplay);
    },
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const numericOrderId = Number(orderId);
      if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
        throw new Error("Invalid order id");
      }

      const response = await orderService.cancelOrder(numericOrderId);
      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to cancel order");
      }

      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
