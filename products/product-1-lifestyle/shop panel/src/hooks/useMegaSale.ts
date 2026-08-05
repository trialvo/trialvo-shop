"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  storefrontVisibilityKeys,
  storefrontVisibilityService,
  type MegaSaleProductSort,
} from "@/lib/api/storefront/service";
import {
  normalizeMegaSaleProducts,
  type MegaSaleProduct,
} from "@/lib/mega-sale/normalizers";

export type MegaSaleSortOption = "featured" | "price-asc" | "price-desc" | "rating";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

const SORT_TO_API: Record<MegaSaleSortOption, MegaSaleProductSort> = {
  featured: "serial",
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  rating: "serial",
};

const DEFAULT_COUNTDOWN: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: false,
};

const parseTargetMs = (raw: string | null | undefined): number | null => {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;

  const trimmed = raw.trim();
  const directTs = Date.parse(trimmed);
  if (Number.isFinite(directTs)) return directTs;

  const isoLikeTs = Date.parse(trimmed.replace(" ", "T"));
  return Number.isFinite(isoLikeTs) ? isoLikeTs : null;
};

const getCountdownParts = (
  targetMs: number | null,
  nowMs: number,
): CountdownParts => {
  if (!targetMs) return DEFAULT_COUNTDOWN;

  const diff = targetMs - nowMs;
  if (diff <= 0) return { ...DEFAULT_COUNTDOWN, expired: true };

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
};

const filterExpiredProducts = (
  products: MegaSaleProduct[],
  nowMs: number,
): MegaSaleProduct[] =>
  products.filter((product) => {
    const productTargetMs = parseTargetMs(product.productEndAt);
    return !productTargetMs || productTargetMs > nowMs;
  });

export function useMegaSale(sort: MegaSaleSortOption) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  const visibilityQuery = useQuery({
    queryKey: storefrontVisibilityKeys.detail(),
    queryFn: () => storefrontVisibilityService.getVisibility(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const visibility = visibilityQuery.data;
  const campaignTargetMs = useMemo(
    () => parseTargetMs(visibility?.megasale_campaign_end_at),
    [visibility?.megasale_campaign_end_at],
  );
  const countdown = useMemo(
    () => getCountdownParts(campaignTargetMs, nowMs),
    [campaignTargetMs, nowMs],
  );
  const showMegaSale = visibility?.show_megasale === true && !countdown.expired;
  const productLimit = visibility?.megasale_product_limit || 50;

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const productsQuery = useQuery({
    queryKey: storefrontVisibilityKeys.products({
      page: 1,
      limit: productLimit,
      sort_by: SORT_TO_API[sort],
    }),
    enabled: visibilityQuery.isSuccess && showMegaSale,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: () =>
      storefrontVisibilityService.getProducts({
        page: 1,
        limit: productLimit,
        sort_by: SORT_TO_API[sort],
      }),
  });

  const products = useMemo(() => {
    const normalized = normalizeMegaSaleProducts(productsQuery.data?.products ?? []);
    return filterExpiredProducts(normalized, nowMs);
  }, [nowMs, productsQuery.data?.products]);

  return {
    products,
    countdown,
    showMegaSale,
    isLoading: visibilityQuery.isLoading || productsQuery.isLoading,
    isError: visibilityQuery.isError || productsQuery.isError,
    refetch: productsQuery.refetch,
  };
}
