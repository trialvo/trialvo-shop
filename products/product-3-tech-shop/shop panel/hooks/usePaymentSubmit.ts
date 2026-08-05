"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useOrder } from "@/hooks/useOrder";
import { getPaymentProviders } from "@/lib/api/payment/service";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { resolveGatewayPaymentMethod } from "@/lib/checkout/paymentMethod";
import { sanitizePaymentRedirectUrl } from "@/lib/security/paymentUrl";

/**
 * Restart SSLCommerz (or configured default gateway) payment for an unpaid order.
 * Mirrors gcp_graduatefashion_shop `usePaymentSubmit` + OrderFailed retry.
 */
export function usePaymentSubmit() {
  const { initiatePayment } = useOrder();

  const submitPayment = useCallback(
    async (
      orderId: number,
      preferredMethod: string = "sslcommerz",
    ): Promise<boolean> => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        toast.error("Invalid order ID");
        return false;
      }

      try {
        let defaultProvider: string | null = null;
        try {
          const providersRes = await getPaymentProviders({ is_active: true });
          defaultProvider = providersRes.default_provider;
        } catch {
          defaultProvider = null;
        }

        const paymentMethod = resolveGatewayPaymentMethod(
          preferredMethod || defaultProvider || "sslcommerz",
          defaultProvider,
        );

        const payRes = await initiatePayment.mutateAsync({
          orderId,
          payment_method: paymentMethod,
        });

        const raw =
          typeof payRes?.url === "string"
            ? payRes.url
            : typeof payRes?.redirect_url === "string"
              ? payRes.redirect_url
              : undefined;

        const safe = sanitizePaymentRedirectUrl(raw);
        if (!safe) {
          toast.error("Please contact support — payment link unavailable.");
          return false;
        }

        // External SSLCommerz gateway — full navigation required
        window.location.href = safe;
        return true;
      } catch (err) {
        toast.error(
          getUnknownErrorMessage(
            err,
            "Payment submission failed. Please try again.",
          ),
        );
        return false;
      }
    },
    [initiatePayment],
  );

  return {
    submitPayment,
    isLoading: initiatePayment.isPending,
    error: initiatePayment.error,
  };
}
