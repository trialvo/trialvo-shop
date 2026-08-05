"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { dealService } from "@/lib/api/deal/service";
import {
  normalizeBulkRules,
  normalizeComboRules,
} from "@/lib/deals/normalizers";

export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "lists"] as const,
};

export function useDeals() {
  const query = useQuery({
    queryKey: dealKeys.lists(),
    queryFn: () => dealService.getDeals(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const bulkOffers = useMemo(
    () => normalizeBulkRules(query.data?.bulkRules ?? []),
    [query.data?.bulkRules],
  );
  const comboDeals = useMemo(
    () => normalizeComboRules(query.data?.comboRules ?? []),
    [query.data?.comboRules],
  );

  return {
    bulkOffers,
    comboDeals,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
