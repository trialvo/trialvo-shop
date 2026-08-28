import type { Metadata } from "next";
import TrialStatusPage from "@/views/TrialStatusPage";
import { pageSeo } from "@/lib/seo/copy";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return buildPageMetadata({
    locale,
    path: "/trial-status",
    seo: {
      title: locale === "bn" ? "ট্রায়াল স্ট্যাটাস" : "Trial status",
      description: pageSeo("trialSubmitted", locale).description,
      keywords: [],
    },
    noindex: true,
  });
}

export default function Page() {
  return <TrialStatusPage />;
}
