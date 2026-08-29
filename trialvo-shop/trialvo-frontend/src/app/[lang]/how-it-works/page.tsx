import type { Metadata } from "next";
import HowItWorksPage from "@/views/HowItWorksPage";
import JsonLd from "@/components/seo/JsonLd";
import { howItWorks } from "@/lib/content/howItWorks";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  graphJsonLd,
  howToJsonLd,
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
    path: "/how-it-works",
    seo: pageSeo("howItWorks", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const seo = pageSeo("howItWorks", locale);
  const content = howItWorks(locale);

  return (
    <>
      <JsonLd
        id="seo-how-it-works"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/how-it-works",
            name: seo.title,
            description: seo.description,
          }),
          howToJsonLd({
            locale,
            name: seo.title,
            description: seo.description,
            path: "/how-it-works",
            steps: content.steps.map((step) => ({
              name: step.title,
              text: step.summary,
              anchor: step.id,
            })),
          }),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
            {
              name: locale === "bn" ? "কীভাবে কাজ করে" : "How it works",
              path: "/how-it-works",
            },
          ]),
        )}
      />
      <HowItWorksPage />
    </>
  );
}
