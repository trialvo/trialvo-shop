"use client";

import { getPaymentProviders, GetPaymentProvidersParams, GetPaymentProvidersResponse, PaymentProviderItem, paymentProviderKeys } from "@/lib/api/payment/service";
import { useQuery } from "@tanstack/react-query";

const normalizeProviders = (res: GetPaymentProvidersResponse): PaymentProviderItem[] => {
  if (!res || !Array.isArray(res.providers)) return [];
  return res.providers.filter(
    (p): p is PaymentProviderItem =>
      !!p &&
      typeof p.provider === "string" &&
      p.provider.trim().length > 0 &&
      typeof p.is_active === "boolean",
  );
};

export const usePaymentProvider = (params?: GetPaymentProvidersParams) => {
  const providersQuery = useQuery({
    queryKey: paymentProviderKeys.list(params),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<GetPaymentProvidersResponse> => {
      return getPaymentProviders(params);
    },
  });

  const data = providersQuery.data;

  return {
    data,
    defaultProvider: data?.default_provider ?? null,
    providers: data ? normalizeProviders(data) : [],

    providersLoading: providersQuery.isLoading,
    providersError: providersQuery.error,
    refetchProviders: providersQuery.refetch,
  };
};
