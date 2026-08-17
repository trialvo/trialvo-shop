import type { Metadata } from "next";
import { Suspense } from "react";
import Layout from "@/components/layout/Layout";
import CheckoutSuccessClient from "@/components/checkout/result/CheckoutSuccessClient";
import { CheckoutResultSkeleton } from "@/components/checkout/result/CheckoutResultSummary";

export const metadata: Metadata = {
  title: "Order Confirmed | Techshop",
  description: "Thank you for your purchase. View your order summary and delivery details.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Layout>
      <section className="container mx-auto sm:pb-6">
        <Suspense fallback={<CheckoutResultSkeleton />}>
          <CheckoutSuccessClient />
        </Suspense>
      </section>
    </Layout>
  );
}
