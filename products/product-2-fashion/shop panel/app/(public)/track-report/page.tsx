import TrackReportPageClient from "@/components/report/TrackReportPageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Track Report | Vellora";
const description =
  "Track the status of your submitted support report using your tracking token. See all replies and current resolution status.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/track-report",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-contact.jpg",
});

interface Props {
  searchParams: Promise<{ token?: string }>;
}

const Page: React.FC<Props> = async ({ searchParams }) => {
  const { token } = await searchParams;
  return <TrackReportPageClient initialToken={token ?? ""} />;
};

export default Page;
