import AddressBookPageClient from "@/components/account/address-book/AddressBookPageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Address Book | Graduate";
const description = "Manage your delivery and billing addresses.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/address",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-address.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <AddressBookPageClient />;
};

export default Page;
