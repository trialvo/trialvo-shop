import ChangePasswordClient from "@/components/account/change-password/ChangePasswordClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Change Password | Graduate";
const description =
  "Update your account password securely. Use a strong password to keep your account protected.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/change-password",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-password.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <ChangePasswordClient />;
};

export default Page;
