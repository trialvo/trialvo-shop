"use client";

import { useMemo } from "react";

import { useDeals } from "@/hooks/useDeals";
import type { BulkOffer, ComboDeal, OrderType } from "@/types";

export type SpecialCheckoutOrderType = Extract<OrderType, "bulk" | "combo">;

export type CheckoutOrderAvailability = Record<SpecialCheckoutOrderType, boolean>;

export function useCheckoutOptions(isAuthenticated: boolean) {
  const deals = useDeals();

  const bulkOffers = useMemo(
    () => deals.bulkOffers.filter(isUsableBulkOffer),
    [deals.bulkOffers],
  );

  const comboDeals = useMemo(
    () => deals.comboDeals.filter(isUsableComboDeal),
    [deals.comboDeals],
  );

  const availability: CheckoutOrderAvailability = useMemo(
    () => ({
      bulk: bulkOffers.length > 0,
      combo: comboDeals.length > 0,
    }),
    [bulkOffers.length, comboDeals.length],
  );

  const baseOrderType: OrderType = isAuthenticated ? "standard" : "guest";
  const availableOrderTypes = useMemo<OrderType[]>(() => {
    const types: OrderType[] = [baseOrderType];
    if (availability.bulk) types.push("bulk");
    if (availability.combo) types.push("combo");
    return types;
  }, [availability.bulk, availability.combo, baseOrderType]);

  return {
    bulkOffers,
    comboDeals,
    availability,
    baseOrderType,
    availableOrderTypes,
    hasTypeStep: availableOrderTypes.length > 1,
    isLoading: deals.isLoading,
    isFetching: deals.isFetching,
    isError: deals.isError,
    error: deals.error,
    refetch: deals.refetch,
  };
}

function isUsableBulkOffer(offer: BulkOffer): boolean {
  const productVariationId = offer.productVariationId ?? offer.product?.productVariationId;

  return Boolean(
    productVariationId &&
    offer.minQuantity > 0 &&
    offer.stockAvailable >= offer.minQuantity,
  );
}

function isUsableComboDeal(deal: ComboDeal): boolean {
  return Boolean(
    deal.inStock &&
    deal.items.length > 0 &&
    deal.items.every((item) => item.product?.productVariationId && item.quantity > 0),
  );
}
