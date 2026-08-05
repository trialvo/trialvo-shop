import type { Metadata } from "next";
import { Suspense } from "react";
import OrderSuccessClient from "../OrderSuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed | LIFESTYLE",
  description:
    "Thank you for your purchase. View your order summary and delivery details.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <OrderSuccessClient />
    </Suspense>
  );
}
