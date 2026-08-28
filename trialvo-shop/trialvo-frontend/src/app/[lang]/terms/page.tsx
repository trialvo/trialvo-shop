import type { Metadata } from "next";
import TermsPage from "@/views/TermsPage";
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
    path: "/terms",
    seo: pageSeo("terms", locale),
  });
}

export default function Page() {
  return <TermsPage />;
}
