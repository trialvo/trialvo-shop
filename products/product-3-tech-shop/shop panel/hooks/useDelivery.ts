"use client";

import {
  deliveryService,
  type DeliveryChargeItem,
} from "@/lib/api/delivery/service";
import { useQuery } from "@tanstack/react-query";

/** Re-export for checkout UI — matches public /user/delivery/charges shape */
export type DeliveryCharge = DeliveryChargeItem & {
  /** Present on admin payloads; guest list is already status=1 only */
  status?: number | boolean;
  our_charge?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export const deliveryKeys = {
  all: ["delivery"] as const,
  charges: () => [...deliveryKeys.all, "charges"] as const,
};

/**
 * Public delivery charges for checkout / guest order.
 * Must use GET /user/delivery/charges (not admin /delivery/charges).
 */
export const useDelivery = () => {
  const chargesQuery = useQuery({
    queryKey: deliveryKeys.charges(),
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<DeliveryCharge[]> => {
      const res = await deliveryService.getCharges();
      if (!res?.success) return [];
      return Array.isArray(res.delivery_charges) ? res.delivery_charges : [];
    },
  });

  return {
    deliveryCharges: chargesQuery.data ?? [],
    deliveryLoading: chargesQuery.isLoading,
    deliveryError: chargesQuery.error,
    refetchDelivery: chargesQuery.refetch,
  };
};
