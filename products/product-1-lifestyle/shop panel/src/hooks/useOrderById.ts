"use client";

import { useQuery } from "@tanstack/react-query";

import { orderKeys, orderService } from "@/lib/api/order/service";
import type { OrderDetail } from "@/lib/api/order/service";

/**
 * Fetches a single order by its numeric ID.
 *
 * - Disabled when `id <= 0` (missing / invalid).
 * - 5-minute stale time — order data rarely changes client-side.
 */
export function useOrderById(id: number) {
  return useQuery<OrderDetail>({
    queryKey: orderKeys.detail(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await orderService.getOrderById(id);

      if (!res.success || !res.data) {
        throw new Error(res.error ?? res.message ?? "Failed to load order");
      }

      return res.data;
    },
  });
}
