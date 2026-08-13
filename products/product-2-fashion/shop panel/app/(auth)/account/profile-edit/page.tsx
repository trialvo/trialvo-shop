import EditProfileClient from "@/components/account/EditProfileClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Edit Profile | Vellora";
const description = "Update your personal profile information.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/profile-edit",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-profile.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
  return <EditProfileClient />;
};

export default Page;
