"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentFallbackStatus } from "@/types/checkout-result";

interface PaymentFallbackClientProps {
  status: string;
  orderId: string;
}

/**
 * Normalises raw gateway status strings into a canonical set.
 */
function normalizeStatus(raw: string): PaymentFallbackStatus {
  const v = String(raw ?? "").trim().toLowerCase();

  if (["success", "valid", "paid", "completed"].includes(v)) return "success";
  if (["failed", "fail", "invalid", "unpaid", "error"].includes(v)) return "failed";
  if (["cancel", "canceled", "cancelled"].includes(v)) return "cancel";

  return "unknown";
}

/**
 * Intermediate page that receives the raw gateway callback, normalises
 * the status, and immediately redirects to `/checkout/success` or
 * `/checkout/failed`.
 *
 * While the redirect is in progress a skeleton loading state is shown.
 */
export default function PaymentFallbackClient({
  status,
  orderId,
}: PaymentFallbackClientProps) {
  const router = useRouter();
  const normalized = useMemo(() => normalizeStatus(status), [status]);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    if (!orderId) {
      router.replace("/checkout/failed?reason=missing_order_id");
      return;
    }

    if (normalized === "success") {
      router.replace(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
      return;
    }

    router.replace(
      `/checkout/failed?status=${encodeURIComponent(normalized)}&orderId=${encodeURIComponent(orderId)}`,
    );
  }, [normalized, orderId, router]);

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="space-y-2">
          <h1 className="font-display text-lg font-semibold text-foreground">
            Checking Payment Status…
          </h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your payment. You will be redirected shortly.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-secondary" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-56 rounded-lg bg-secondary" />
              <Skeleton className="h-3 w-40 rounded-lg bg-secondary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Skeleton className="h-10 w-full rounded-xl bg-secondary" />
            <Skeleton className="h-10 w-full rounded-xl bg-secondary" />
            <Skeleton className="h-10 w-full rounded-xl bg-secondary hidden sm:block" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/")}
          className="h-10 px-5 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl cursor-pointer"
        >
          Go Home
        </button>
      </div>
    </section>
  );
}
