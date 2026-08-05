"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { CheckoutDeliveryAddressInfo } from "@/components/checkout/result/CheckoutDeliveryAddressInfo";
import type { CheckoutResultViewModel } from "@/lib/adapters/checkoutOrderResult";

type CheckoutOrderSuccessPanelProps = Readonly<{
  data: CheckoutResultViewModel;
  showTrackOrder?: boolean;
}>;

/** Graduate OrderSuccess — left column narrative + CTAs. */
export function CheckoutOrderSuccessPanel({
  data,
  showTrackOrder = true,
}: CheckoutOrderSuccessPanelProps): ReactElement {
  return (
    <div className="space-y-10 w-full mt-2 sm:mt-6">
      <div className="space-y-3">
        <h1 className="text-[28px] font-semibold leading-8 text-black">
          Thank you for your order!
        </h1>
        <p className="text-sm font-normal leading-relaxed text-black/80">
          {data.confirmationEmail ? (
            <>
              A confirmation email will be sent to{" "}
              <span className="font-medium">{data.confirmationEmail}</span>.
            </>
          ) : (
            "Thank you for your order. We will contact you shortly to confirm delivery."
          )}
        </p>
        <p className="text-sm text-black">
          Order ID: <span className="font-semibold">#{data.orderId}</span>
        </p>
      </div>

      <CheckoutDeliveryAddressInfo address={data.deliveryAddress} />

      <div className="hidden flex-wrap items-center gap-6 pt-2.5 sm:flex">
        {showTrackOrder ? (
          <AppButton
            asChild
            variant="outline"
            className="h-9 rounded-none border-[#A9A9A9] px-4 py-2 text-sm font-medium text-black"
          >
            <Link href={data.trackOrderHref}>
              <Package className="h-4 w-4" />
              Track order
            </Link>
          </AppButton>
        ) : null}
        <AppButton
          asChild
          className="h-9 rounded-none bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          <Link href={data.continueShoppingHref}>Continue shopping</Link>
        </AppButton>
      </div>
    </div>
  );
}
