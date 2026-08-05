"use client";

import { useOrder } from "@/hooks/useOrder";
import { useAppDispatch } from "@/redux/hooks";
import { setError } from "@/redux/slices/uiSlice";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const usePaymentSubmit = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { initiatePayment } = useOrder();

  const onSubmit = useCallback(
    async (id: number, paymentMethod: string = "sslcommerz") => {
      try {
        if (!Number.isFinite(id) || id <= 0) {
          dispatch(setError("Invalid order ID"));
          return;
        }

        const payRes = await initiatePayment.mutateAsync({
          orderId: id,
          payment_method: paymentMethod,
        });

        const urlFromInitiate =
          typeof payRes.url === "string" ? payRes.url.trim() : "";

        if (urlFromInitiate) {
          router.push(urlFromInitiate);
        } else {
          dispatch(setError("Please contact support!"));
        }
      } catch (err) {
        console.error("Payment submission failed:", err);
        dispatch(setError("Payment submission failed. Please try again."));
      }
    },
    [initiatePayment, dispatch, router],
  );

  return {
    onSubmit,
    isLoading: initiatePayment.isPending,
    error: initiatePayment.error,
    isSuccess: initiatePayment.isSuccess,
  };
};
