import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";
import CheckoutClient from "./CheckoutClient";

const title = "Checkout | Vellora";
const description =
  "Complete your purchase securely. Choose delivery address, delivery area and payment method.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/checkout",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-checkout.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <CheckoutClient />;
};

export default Page;
