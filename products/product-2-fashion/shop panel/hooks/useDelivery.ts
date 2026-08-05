"use client";

import { deliveryService, type DeliveryChargeItem, type DeliveryChargesResponse } from "@/lib/api/delivery/service";
import { useQuery } from "@tanstack/react-query";

export const deliveryKeys = {
  all: ["delivery"] as const,
  charges: () => [...deliveryKeys.all, "charges"] as const,
};

export const useDelivery = () => {
  const query = useQuery<DeliveryChargesResponse>({
    queryKey: deliveryKeys.charges(),
    queryFn: () => deliveryService.getCharges(),
  });

  const charges: DeliveryChargeItem[] = query.data?.delivery_charges ?? [];

  return {
    ...query,
    charges,
    isLoading: query.isLoading,
  };
};
