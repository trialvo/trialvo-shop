"use client";

import { useQuery } from "@tanstack/react-query";
import {
  megaSaleService,
  type MegaSaleListParams,
  type MegaSaleVisibilityData,
} from "@/lib/api/megasale/service";
import { toHotDealsViewModel } from "@/lib/adapters/megaSale";
import { useMemo } from "react";

export const megaSaleKeys = {
  all: ["mega-sale"] as const,
  visibility: (params?: MegaSaleListParams) =>
    [
      ...megaSaleKeys.all,
      "visibility",
      params?.page ?? 1,
      params?.limit ?? 12,
      params?.search ?? "",
      params?.stock_filter ?? "",
      params?.sort_by ?? "serial",
    ] as const,
};

export function useMegaSale(params?: MegaSaleListParams) {
  const query = useQuery({
    queryKey: megaSaleKeys.visibility(params),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MegaSaleVisibilityData> => {
      return megaSaleService.getVisibility(params);
    },
    retry: 2,
    retryDelay: 1000,
  });

  const viewModel = useMemo(
    () =>
      toHotDealsViewModel(query.data?.products ?? [], {
        isActive: Boolean(query.data?.show_megasale),
        campaignEndAt: query.data?.megasale_campaign_end_at ?? null,
        featuredLimit: 1,
        sideLimit: 3,
      }),
    [query.data],
  );

  return {
    visibility: query.data ?? null,
    viewModel,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
