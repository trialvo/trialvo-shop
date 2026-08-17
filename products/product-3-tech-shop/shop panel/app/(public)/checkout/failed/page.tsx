import type { Metadata } from "next";
import { Suspense } from "react";
import Layout from "@/components/layout/Layout";
import CheckoutFailedClient from "@/components/checkout/result/CheckoutFailedClient";
import { CheckoutResultSkeleton } from "@/components/checkout/result/CheckoutResultSummary";

export const metadata: Metadata = {
  title: "Payment Failed | Techshop",
  description: "Your payment could not be completed.",
  robots: { index: false, follow: false },
};

export default function CheckoutFailedPage() {
  return (
    <Layout>
      <section className="container mx-auto sm:pb-6">
        <Suspense fallback={<CheckoutResultSkeleton />}>
          <CheckoutFailedClient />
        </Suspense>
      </section>
    </Layout>
  );
}
