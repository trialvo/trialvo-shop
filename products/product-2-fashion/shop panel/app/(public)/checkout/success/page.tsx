import type { Metadata } from "next";
import React, { Suspense } from "react";
import OrderSuccessClient from "../OrderSuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed | Vellora",
  description: "Thank you for your purchase. View your order summary and delivery details.",
  robots: { index: false, follow: false },
};

const Page: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <OrderSuccessClient />
    </Suspense>
  );
};

export default Page;
