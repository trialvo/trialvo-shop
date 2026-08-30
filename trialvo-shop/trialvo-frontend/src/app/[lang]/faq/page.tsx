import type { Metadata } from "next";
import FaqPage from "@/views/FaqPage";
import JsonLd from "@/components/seo/JsonLd";
import { faqFlat } from "@/lib/content/faq";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  graphJsonLd,
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
    path: "/faq",
    seo: pageSeo("faq", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const seo = pageSeo("faq", locale);

  return (
    <>
      <JsonLd
        id="seo-faq-page"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/faq",
            name: seo.title,
            description: seo.description,
            type: "FAQPage",
          }),
          faqJsonLd(faqFlat(locale)),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
            {
              name: locale === "bn" ? "প্রশ্নোত্তর" : "FAQ",
              path: "/faq",
            },
          ]),
        )}
      />
      <FaqPage />
    </>
  );
}
