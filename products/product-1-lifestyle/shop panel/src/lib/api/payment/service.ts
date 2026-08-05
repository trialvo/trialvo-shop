import { api } from "../client";

export type PaymentProviderItem = {
  provider: string;
  is_active: boolean;
  gateway_name: string;
};

export type GetPaymentProvidersParams = {
  is_active?: boolean;
};

export type GetPaymentProvidersResponse = {
  default_provider: string | null;
  providers: PaymentProviderItem[];
};

export const paymentProviderKeys = {
  all: ["payment-provider"] as const,
  list: (params?: GetPaymentProvidersParams) =>
    [...paymentProviderKeys.all, "list", params?.is_active ?? null] as const,
};

export async function getPaymentProviders(
  params?: GetPaymentProvidersParams,
): Promise<GetPaymentProvidersResponse> {
  const res = await api.get<GetPaymentProvidersResponse>("/user/payment-provider", {
    params,
  });
  return res.data;
}
