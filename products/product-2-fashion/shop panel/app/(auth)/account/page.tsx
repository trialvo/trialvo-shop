import AccountDashboardClient from "@/components/account/AccountDashboardClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "My Account | Graduate";
const description =
  "Manage your profile, address book, orders, favorites and payment methods.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-account.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <AccountDashboardClient />;
};

export default Page;
