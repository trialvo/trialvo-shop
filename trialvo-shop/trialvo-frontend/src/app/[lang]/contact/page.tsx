import type { Metadata } from "next";
import ContactPage from "@/views/ContactPage";
import JsonLd from "@/components/seo/JsonLd";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  graphJsonLd,
  organizationJsonLd,
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
    path: "/contact",
    seo: pageSeo("contact", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const seo = pageSeo("contact", locale);

  return (
    <>
      <JsonLd
        id="seo-contact"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/contact",
            name: seo.title,
            description: seo.description,
            type: "ContactPage",
          }),
          organizationJsonLd(locale),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
            { name: locale === "bn" ? "যোগাযোগ" : "Contact", path: "/contact" },
          ]),
        )}
      />
      <ContactPage />
    </>
  );
}
