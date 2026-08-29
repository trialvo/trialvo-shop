import type { Metadata } from "next";
import AboutPage from "@/views/AboutPage";
import JsonLd from "@/components/seo/JsonLd";
import { services } from "@/lib/content/services";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  graphJsonLd,
  serviceCatalogJsonLd,
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
    path: "/about",
    seo: pageSeo("about", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const seo = pageSeo("about", locale);
  const { entries } = services(locale);

  return (
    <>
      <JsonLd
        id="seo-about"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/about",
            name: seo.title,
            description: seo.description,
            type: "AboutPage",
          }),
          serviceJsonLd(locale),
          serviceCatalogJsonLd(locale, entries),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
            {
              name: locale === "bn" ? "আমাদের সম্পর্কে" : "About",
              path: "/about",
            },
          ]),
        )}
      />
      <AboutPage />
    </>
  );
}
