import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutPage from "@/views/CheckoutPage";
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
    path: "/checkout",
    seo: pageSeo("checkout", locale),
    noindex: true,
  });
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  );
}
