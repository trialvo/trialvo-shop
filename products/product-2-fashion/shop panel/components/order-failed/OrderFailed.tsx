"use client";

import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrder";
import { useAppDispatch } from "@/redux/hooks";
import { setError } from "@/redux/slices/uiSlice";
import Link from "next/link";
import React from "react";

export type OrderFailedData = {
  id: number;
  title?: string;
  message?: string;
  supportEmail?: string;
  continueShoppingHref: string;
};

type Props = {
  data: OrderFailedData;
};

const OrderFailed: React.FC<Props> = ({ data }) => {
  const dispatch = useAppDispatch();
  const { initiatePayment } = useOrder();

  const onSubmit = async () => {
    try {
      const orderId = Number(data?.id);
      if (!Number.isFinite(orderId) || orderId <= 0) return;

      const payRes = await initiatePayment.mutateAsync({
        orderId,
        payment_method: "sslcommerz",
      });

      const urlFromInitiate =
        typeof (payRes as { url?: unknown })?.url === "string"
          ? String((payRes as { url?: unknown }).url).trim()
          : "";

      if (urlFromInitiate) {
        globalThis.location.href = urlFromInitiate;
      } else {
        dispatch(setError("Please contact on support!"))
      }
    } catch (err) {
      console.error("Place order failed:", err);
    }
  };

  const title = data.title ?? "Payment failed!";
  const message =
    data.message ??
    "We couldn’t complete your payment. No worries—please try again or continue shopping.";

  return (
    <div className="space-y-10 w-163 mt-6">
      <div className="space-y-3">
        <h1 className="text-[28px] font-semibold leading-5.5 text-black">
          {title}
        </h1>

        <p className="text-sm font-normal leading-5.5 text-black/80">
          {message}{" "}
          {data.supportEmail ? (
            <>
              Need help? Contact{" "}
              <span className="font-medium">{data.supportEmail}</span>.
            </>
          ) : null}
        </p>
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
        <Button
          onClick={onSubmit}
          variant="outline"
          className="h-9 rounded-none border-[#A9A9A9] px-4 py-2 text-sm font-medium text-black"
        >
          Try Payment Again
        </Button>

        <Button
          className="h-9 rounded-none bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          asChild
        >
          <Link href={data.continueShoppingHref}>Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderFailed;
