import type { Metadata } from "next";
import PrivacyPage from "@/views/PrivacyPage";
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
    path: "/privacy",
    seo: pageSeo("privacy", locale),
  });
}

export default function Page() {
  return <PrivacyPage />;
}
