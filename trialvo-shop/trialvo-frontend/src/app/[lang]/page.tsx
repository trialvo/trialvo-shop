import type { Metadata } from "next";
import HomePage from "@/views/HomePage";
import JsonLd from "@/components/seo/JsonLd";
import { faqHighlights } from "@/lib/content/faq";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  graphJsonLd,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return buildPageMetadata({
    locale,
    path: "/",
    seo: pageSeo("home", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const seo = pageSeo("home", locale);

  return (
    <>
      <JsonLd
        id="seo-home"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/",
            name: seo.title,
            description: seo.description,
          }),
          serviceJsonLd(locale),
          faqJsonLd(faqHighlights(locale)),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
          ]),
        )}
      />
      <HomePage />
    </>
  );
}
