"use client";

import type {
    ValidateCouponBody,
    ValidateCouponData,
    ValidateCouponResponse,
} from "@/lib/api/coupon/service";
import { couponKeys, couponService } from "@/lib/api/coupon/service";
import { useAppDispatch } from "@/redux/hooks";
import { setError, setSuccess } from "@/redux/slices/uiSlice";
import { useMutation } from "@tanstack/react-query";

const toErrorMessage = (res: { error?: unknown; message?: unknown }, fallback: string) => {
    if (typeof res?.error === "string" && res.error.trim()) return res.error.trim();
    if (typeof res?.message === "string" && res.message.trim()) return res.message.trim();
    return fallback;
};

export const useCoupon = () => {
    const dispatch = useAppDispatch();

    const validateCouponMutation = useMutation({
        mutationKey: couponKeys.all,
        mutationFn: async (payload: ValidateCouponBody): Promise<ValidateCouponData> => {
            const res: ValidateCouponResponse = await couponService.validateCoupon(payload);
            if (res?.success) {
                dispatch(setSuccess(res?.message ?? ""))
            }
            if(res?.flag === 400) {
                dispatch(setError(res?.error ?? ""))
            }
            if (!res?.success) throw new Error(toErrorMessage(res, "Failed to validate coupon"));
            if (!res.data) throw new Error("No coupon data returned");
            return res.data;
        },
    });

    return {
        validateCoupon: validateCouponMutation.mutateAsync,
        couponData: validateCouponMutation.data,
        validateCouponLoading: validateCouponMutation.isPending,
        validateCouponError: validateCouponMutation.error,
        resetCoupon: validateCouponMutation.reset,
        isCouponApplied: !!validateCouponMutation.data,
    };
};
