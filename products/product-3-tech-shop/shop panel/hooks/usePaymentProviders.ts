"use client";

import {
  getPaymentProviders,
  paymentProviderKeys,
  type GetPaymentProvidersParams,
  type GetPaymentProvidersResponse,
  type PaymentProviderItem,
} from "@/lib/api/payment/service";
import { useQuery } from "@tanstack/react-query";

function normalizeProviders(
  res: GetPaymentProvidersResponse | null | undefined,
): PaymentProviderItem[] {
  if (!res || !Array.isArray(res.providers)) return [];
  return res.providers.filter(
    (p): p is PaymentProviderItem =>
      !!p &&
      typeof p.provider === "string" &&
      p.provider.trim().length > 0 &&
      typeof p.is_active === "boolean",
  );
}

/**
 * Active payment providers from `/user/payment-provider`
 * (same source as gcp_graduatefashion_shop / graduate).
 */
export const usePaymentProviders = (params?: GetPaymentProvidersParams) => {
  const query = useQuery({
    queryKey: paymentProviderKeys.list(params),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<GetPaymentProvidersResponse> => {
      return getPaymentProviders(params);
    },
  });

  const data = query.data;

  return {
    data,
    defaultProvider: data?.default_provider ?? null,
    providers: data ? normalizeProviders(data) : [],
    providersLoading: query.isLoading,
    providersError: query.error,
    refetchProviders: query.refetch,
  };
};

/** Alias matching graduate naming */
export const usePaymentProvider = usePaymentProviders;
