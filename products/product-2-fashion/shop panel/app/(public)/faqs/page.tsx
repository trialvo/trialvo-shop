import FAQPage from "@/components/faqs/FAQPage";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "FAQs | Graduate";
const description =
  "Find answers to common questions about payments, delivery, cancellation & returns, orders, and product & services.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/faqs",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-faqs.jpg",
});

const Page: React.FC = () => {
  return <FAQPage />;
};

export default Page;
