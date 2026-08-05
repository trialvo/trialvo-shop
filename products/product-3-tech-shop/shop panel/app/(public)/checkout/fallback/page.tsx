import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import PaymentFallbackClient from "@/components/checkout/result/PaymentFallbackClient";
import { sanitizeAuthText } from "@/lib/security/auth";

export const metadata: Metadata = {
  title: "Confirming Payment | ShopLinkBD",
  description: "Confirming your payment status.",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

function pickParam(
  params: SearchParams | undefined,
  key: string,
): string {
  const raw = params?.[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return sanitizeAuthText(value ?? "", 80);
}

export default async function CheckoutFallbackPage({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams);
  const status = pickParam(params, "status");
  const orderId =
    pickParam(params, "orderId") || pickParam(params, "order_id");

  return (
    <Layout>
      <section className="container mx-auto sm:pb-6">
        <PaymentFallbackClient status={status} orderId={orderId} />
      </section>
    </Layout>
  );
}
