"use client";

import { useMutation } from "@tanstack/react-query";
import {
  couponService,
  type ValidateCouponBody,
  type ValidateCouponData,
  type ValidateCouponResponse,
} from "@/lib/api/coupon/service";
import { sanitizeAuthText } from "@/lib/security/auth";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import {
  clearAppliedCoupon,
  readAppliedCoupon,
  writeAppliedCoupon,
  type AppliedCouponSession,
} from "@/lib/checkout/couponSession";
import { useCallback, useState } from "react";

export type ApplyCouponInput = {
  code: string;
  orderItems: ValidateCouponBody["order_items"];
  customerId?: number;
};

export function useCoupon() {
  const [applied, setApplied] = useState<AppliedCouponSession | null>(() =>
    readAppliedCoupon(),
  );

  const validateMutation = useMutation<
    ValidateCouponResponse,
    Error,
    ApplyCouponInput
  >({
    mutationFn: async ({ code, orderItems, customerId }) => {
      const cleaned = sanitizeAuthText(code, 40);
      if (!cleaned) throw new Error("Enter a coupon code");
      if (!orderItems.length) throw new Error("Your cart is empty");

      const res = await couponService.validateCoupon({
        coupon: cleaned,
        order_items: orderItems,
        customer_id: customerId,
      });

      if (!res?.success || !res.data) {
        throw new Error(res?.error || res?.message || "Invalid coupon");
      }
      return res;
    },
  });

  const applyCoupon = useCallback(
    async (input: ApplyCouponInput): Promise<ValidateCouponData> => {
      const res = await validateMutation.mutateAsync(input);
      const data = res.data!;
      const session: AppliedCouponSession = {
        code: sanitizeAuthText(input.code, 40),
        discountAmount: Number(data.totals?.total_coupon_discount) || 0,
        title: data.coupon_title,
      };
      writeAppliedCoupon(session);
      setApplied(session);
      return data;
    },
    [validateMutation],
  );

  const removeCoupon = useCallback(() => {
    clearAppliedCoupon();
    setApplied(null);
    validateMutation.reset();
  }, [validateMutation]);

  return {
    applied,
    applyCoupon,
    removeCoupon,
    isValidating: validateMutation.isPending,
    couponError: validateMutation.error
      ? getUnknownErrorMessage(validateMutation.error, "Coupon validation failed")
      : null,
    couponData: validateMutation.data?.data ?? null,
  };
}
