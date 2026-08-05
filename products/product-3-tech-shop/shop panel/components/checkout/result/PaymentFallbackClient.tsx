"use client";

import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/AppButton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizePaymentCallbackStatus,
  parseCheckoutOrderId,
} from "@/lib/adapters/checkoutOrderResult";
import { sanitizeAuthText } from "@/lib/security/auth";
import { cn } from "@/lib/utils";

type PaymentFallbackClientProps = Readonly<{
  status: string;
  orderId: string;
}>;

/**
 * Graduate PaymentFallbackClient — gateway return hub.
 */
export function PaymentFallbackClient({
  status,
  orderId,
}: PaymentFallbackClientProps): ReactElement {
  const router = useRouter();
  const redirectedRef = useRef(false);

  const normalized = useMemo(
    () => normalizePaymentCallbackStatus(status),
    [status],
  );

  const safeOrderId = useMemo(
    () => sanitizeAuthText(orderId, 40),
    [orderId],
  );

  useEffect(() => {
    if (redirectedRef.current) return;

    if (!safeOrderId || !parseCheckoutOrderId(safeOrderId)) {
      redirectedRef.current = true;
      router.replace("/checkout/failed?reason=missing_order_id");
      return;
    }

    redirectedRef.current = true;

    if (normalized === "success") {
      router.replace(
        `/checkout/success?orderId=${encodeURIComponent(safeOrderId)}&payment=success`,
      );
      return;
    }

    if (normalized === "cancel") {
      router.replace(
        `/checkout/success?orderId=${encodeURIComponent(safeOrderId)}&payment=cancelled`,
      );
      return;
    }

    router.replace(
      `/checkout/failed?status=failed&orderId=${encodeURIComponent(safeOrderId)}`,
    );
  }, [normalized, router, safeOrderId]);

  return (
    <div className="pb-6 pt-10">
      <div className="rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] bg-white p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-black">
              Checking payment status…
            </h1>
            <p className="text-sm text-black/70">
              Please wait while we confirm your payment.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-none" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56 rounded-none" />
                <Skeleton className="h-3 w-40 rounded-none" />
              </div>
            </div>
            <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3")}>
              <Skeleton className="h-10 w-full rounded-none" />
              <Skeleton className="h-10 w-full rounded-none" />
              <Skeleton className="h-10 w-full rounded-none max-md:hidden" />
            </div>
          </div>

          <div className="pt-2">
            <AppButton
              type="button"
              variant="outline"
              className="h-10 rounded-none border-[#999999]"
              onClick={() => router.replace("/")}
            >
              Go home
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentFallbackClient;
