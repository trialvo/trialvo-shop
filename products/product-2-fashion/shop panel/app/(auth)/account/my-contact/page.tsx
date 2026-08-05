// app/(auth)/account/my-contact/page.tsx — V2-041
import MyContactMessagesPageClient from "@/components/account/contact/MyContactMessagesPageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "My Messages | Graduate Fashion";
const description =
  "View your submitted contact inquiries and read our support team replies.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/my-contact",
  ogTitle:       title,
  ogDescription: description,
  ogImage: "/og-account.jpg",
  robots: "noindex,nofollow",
});

type Props = {
  searchParams: Promise<{ messageId?: string }>;
};

const Page: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const messageId = params.messageId ? Number(params.messageId) : null;
  return <MyContactMessagesPageClient highlightMessageId={messageId} />;
};

export default Page;
