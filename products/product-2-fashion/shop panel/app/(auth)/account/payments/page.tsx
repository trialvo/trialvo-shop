import PaymentMethodClient from "@/components/account/payment-method/PaymentMethodClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Payment Methods | Graduate";
const description = "Manage your saved payment options.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/payments",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-payments.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <PaymentMethodClient />;
};

export default Page;
