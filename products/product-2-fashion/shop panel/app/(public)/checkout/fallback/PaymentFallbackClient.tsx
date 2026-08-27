"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  status: string;
  orderId: string;
};

function normalizeStatus(s: string): "success" | "failed" | "cancel" | "unknown" {
  const v = String(s || "").trim().toLowerCase();

  if (["success", "valid", "paid", "completed"].includes(v)) return "success";
  if (["failed", "fail", "invalid", "unpaid", "error"].includes(v)) return "failed";
  if (["cancel", "canceled", "cancelled"].includes(v)) return "cancel";

  return "unknown";
}

export default function PaymentFallbackClient({ status, orderId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const normalized = React.useMemo(() => normalizeStatus(status), [status]);

  const redirectedRef = React.useRef(false);

  React.useEffect(() => {
    if (redirectedRef.current) return;

    if (!orderId) {
      redirectedRef.current = true;
      router.replace(`/checkout/failed?reason=missing_order_id`);
      return;
    }

    const successHref = `/checkout/success?orderId=${orderId}`;
    const failedHref = `/checkout/failed?status=${normalized}&orderId=${orderId}`;

    redirectedRef.current = true;

    if (status === "success") {
      router.replace(successHref);
      return;
    }

    router.replace(failedHref);
  }, [normalized, orderId, router, status]);

  return (
    <section className="container mx-auto pb-6 pt-2 min-[501px]:pt-10">
      <Card className="rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-black">{t("paymentFallback.checkingStatus")}</h1>
            <p className="text-sm text-black/70">
              {t("paymentFallback.pleaseWait")}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-none" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>

            <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3")}>
              <Skeleton className="h-10 w-full rounded-none" />
              <Skeleton className="h-10 w-full rounded-none" />
              <Skeleton className="h-10 w-full rounded-none max-md:hidden" />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-none border-[#999999]"
              onClick={() => router.replace("/")}
            >
              {t("paymentFallback.goHome")}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
