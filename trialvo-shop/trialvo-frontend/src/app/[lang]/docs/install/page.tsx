import type { Metadata } from "next";
import InstallGuidePage from "@/views/InstallGuidePage";
import JsonLd from "@/components/seo/JsonLd";
import { INSTALL_GUIDE } from "@/lib/content/installGuide";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  graphJsonLd,
  howToJsonLd,
  webPageJsonLd,
} from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";
import { localize } from "@/lib/localize";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return buildPageMetadata({
    locale,
    path: "/docs/install",
    seo: pageSeo("installGuide", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const seo = pageSeo("installGuide", locale);
  const content = INSTALL_GUIDE;

  return (
    <>
      <JsonLd
        id="seo-install-guide"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/docs/install",
            name: seo.title,
            description: seo.description,
          }),
          howToJsonLd({
            locale,
            name: seo.title,
            description: seo.description,
            path: "/docs/install",
            steps: content.sections.map((section) => ({
              name: localize(section.title, locale),
              text: localize(section.lead, locale),
              anchor: section.id,
            })),
          }),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
            {
              name: locale === "bn" ? "ইনস্টল গাইড" : "Installation guide",
              path: "/docs/install",
            },
          ]),
        )}
      />
      <InstallGuidePage />
    </>
  );
}
