"use client";

import {
  storefrontVisibilityKeys,
  storefrontVisibilityService,
  type StorefrontVisibilityData,
} from "@/lib/api/storefront/service";
import { useQuery } from "@tanstack/react-query";

const FALLBACK_VISIBILITY: StorefrontVisibilityData = {
  show_megasale: false,
  megasale_campaign_end_at: null,
  megasale_product_ids: [],
  megasale_product_limit: 50,
  megasale_product_timers: {},
};

export const useStorefrontVisibility = () => {
  const query = useQuery({
    queryKey: storefrontVisibilityKeys.detail(),
    queryFn: async (): Promise<StorefrontVisibilityData> => {
      const res = await storefrontVisibilityService.getVisibility();
      return res;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const visibility = query.data ?? FALLBACK_VISIBILITY;

  return {
    ...query,
    visibility,
    showMegaSale: visibility.show_megasale === true,
    visibilityLoading: query.isLoading,
  };
};
