import type { Metadata } from "next";
import { Suspense } from "react";
import OrderFailedClient from "../OrderFailedClient";

export const metadata: Metadata = {
  title: "Payment Failed | LIFESTYLE",
  description:
    "Your payment could not be processed. Review your order and try again.",
  robots: { index: false, follow: false },
};

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <OrderFailedClient />
    </Suspense>
  );
}
