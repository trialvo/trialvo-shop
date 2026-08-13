import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Phone Book | Vellora";
const description =
  "Manage your saved phone numbers, set a default number, and verify status.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/phonebook",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-phonebook.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return (
    <></>
  // <PhoneBookPageClient />
);
};

export default Page;
