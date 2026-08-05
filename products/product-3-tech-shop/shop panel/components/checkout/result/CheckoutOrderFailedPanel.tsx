"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { AppButton } from "@/components/shared/AppButton";
import { usePaymentSubmit } from "@/hooks/usePaymentSubmit";
import type { CheckoutResultViewModel } from "@/lib/adapters/checkoutOrderResult";

type CheckoutOrderFailedPanelProps = Readonly<{
  data: Pick<
    CheckoutResultViewModel,
    | "numericOrderId"
    | "orderId"
    | "supportEmail"
    | "continueShoppingHref"
  >;
  title: string;
  message: string;
  canRetryPayment?: boolean;
}>;

/** Graduate OrderFailed — tips + SSLCommerz retry. */
export function CheckoutOrderFailedPanel({
  data,
  title,
  message,
  canRetryPayment = false,
}: CheckoutOrderFailedPanelProps): ReactElement {
  const { submitPayment, isLoading } = usePaymentSubmit();

  return (
    <div className="space-y-10 w-full mt-2 sm:mt-6">
      <div className="space-y-3">
        <h1 className="text-[28px] font-semibold leading-tight text-black">
          {title}
        </h1>
        <p className="text-sm font-normal leading-relaxed text-black/80">
          {message}{" "}
          {data.supportEmail ? (
            <>
              Need help? Contact{" "}
              <span className="font-medium">{data.supportEmail}</span>.
            </>
          ) : null}
        </p>
        {data.orderId ? (
          <p className="text-sm text-black/70">
            Order <span className="font-semibold">#{data.orderId}</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-none border border-[#F1F1F1] bg-white p-4">
        <div className="text-sm font-semibold text-black">What you can do</div>
        <ul className="mt-2 space-y-1 text-sm text-black/70">
          <li>• Check your card/mobile banking balance</li>
          <li>• Try a different payment method</li>
          <li>• Retry payment from the order details page</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-2.5">
        {canRetryPayment && data.numericOrderId > 0 ? (
          <AppButton
            type="button"
            variant="outline"
            className="h-9 rounded-none border-[#A9A9A9] px-4 py-2 text-sm font-medium text-black"
            isLoading={isLoading}
            loadingText="Starting…"
            onClick={() => void submitPayment(data.numericOrderId, "sslcommerz")}
          >
            Try Payment Again
          </AppButton>
        ) : null}
        <AppButton
          asChild
          className="h-9 rounded-none bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          <Link href={data.continueShoppingHref}>Continue Shopping</Link>
        </AppButton>
      </div>
    </div>
  );
}
