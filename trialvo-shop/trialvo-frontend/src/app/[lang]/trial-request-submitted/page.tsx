import { Suspense } from "react";
import type { Metadata } from "next";
import TrialRequestSubmittedPage from "@/views/TrialRequestSubmittedPage";
import { pageSeo } from "@/lib/seo/copy";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return buildPageMetadata({
    locale,
    path: "/trial-request-submitted",
    seo: pageSeo("trialSubmitted", locale),
    noindex: true,
  });
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TrialRequestSubmittedPage />
    </Suspense>
  );
}
