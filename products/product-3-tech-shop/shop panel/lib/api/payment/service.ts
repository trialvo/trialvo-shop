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
  const res = await api.get<
    GetPaymentProvidersResponse & {
      data?: GetPaymentProvidersResponse;
      error?: string;
    }
  >("/user/payment-provider", { params });

  const body = res.data;
  if (body && Array.isArray(body.providers)) {
    return {
      default_provider: body.default_provider ?? null,
      providers: body.providers,
    };
  }

  // Some gateways wrap payload under `data`
  if (body?.data && Array.isArray(body.data.providers)) {
    return {
      default_provider: body.data.default_provider ?? null,
      providers: body.data.providers,
    };
  }

  return { default_provider: null, providers: [] };
}
