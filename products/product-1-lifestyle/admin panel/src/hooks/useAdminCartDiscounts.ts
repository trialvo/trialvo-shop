// src/hooks/useAdminCartDiscounts.ts
//
// Fetches bulk rules, combo rules, and cart-wide discount config for the
// admin /new-sale billing panel.

import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicBulkRules,
  fetchPublicComboRules,
  fetchPublicCartDiscountConfig,
  type PublicBulkRule,
  type PublicComboRule,
} from "@/api/cart-discounts.api";
import type { CartDiscountConfig } from "@/lib/discounts/calculateAdminCartTotals";
import { DEFAULT_CART_DISCOUNT_CONFIG as DEFAULT_CFG } from "@/lib/discounts/calculateAdminCartTotals";

export type UseAdminCartDiscountsResult = {
  bulkRules: PublicBulkRule[];
  comboRules: PublicComboRule[];
  cartDiscountConfig: CartDiscountConfig;
  isLoading: boolean;
};

export function useAdminCartDiscounts(): UseAdminCartDiscountsResult {
  const bulkQuery = useQuery({
    queryKey: ["admin-sale-bulk-rules-public"],
    queryFn: fetchPublicBulkRules,
    staleTime: 5_000,
  });

  const comboQuery = useQuery({
    queryKey: ["admin-sale-combo-rules-public"],
    queryFn: fetchPublicComboRules,
    staleTime: 5_000,
  });

  const cartDiscQuery = useQuery({
    queryKey: ["admin-sale-cart-discount-config-public"],
    queryFn: fetchPublicCartDiscountConfig,
    staleTime: 60_000,
  });

  return {
    bulkRules: bulkQuery.data ?? [],
    comboRules: comboQuery.data ?? [],
    cartDiscountConfig: cartDiscQuery.data ?? DEFAULT_CFG,
    isLoading: bulkQuery.isLoading || comboQuery.isLoading || cartDiscQuery.isLoading,
  };
}
