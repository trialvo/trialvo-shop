import OrdersPageClient from "@/components/account/orders/OrdersPageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "My Orders | Graduate";
const description = "View all your orders, payments, completed and canceled orders.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/orders",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-orders.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <OrdersPageClient />;
};

export default Page;
