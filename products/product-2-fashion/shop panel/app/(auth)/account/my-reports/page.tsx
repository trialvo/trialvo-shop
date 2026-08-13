// app/(auth)/account/my-reports/page.tsx — V2-036 / V2-041
import MyReportsPageClient from "@/components/account/reports/MyReportsPageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "My Reports | Vellora";
const description = "Track and manage your submitted support reports, view replies from our team, and monitor resolution status.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/my-reports",
  ogTitle:       title,
  ogDescription: description,
  ogImage: "/og-account.jpg",
  robots: "noindex,nofollow",
});

type Props = {
  searchParams: Promise<{ reportId?: string }>;
};

const Page: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const reportId = params.reportId ? Number(params.reportId) : null;
  return <MyReportsPageClient highlightReportId={reportId} />;
};

export default Page;

