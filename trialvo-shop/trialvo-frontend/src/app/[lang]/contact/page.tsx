import type { Metadata } from "next";
import ContactPage from "@/views/ContactPage";
import JsonLd from "@/components/seo/JsonLd";
import { pageSeo } from "@/lib/seo/copy";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
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
  return (
    <>
      <JsonLd
        id="seo-breadcrumb-contact"
        data={breadcrumbJsonLd(locale, [
          { name: locale === "bn" ? "হোম" : "Home", path: "/" },
          { name: locale === "bn" ? "যোগাযোগ" : "Contact", path: "/contact" },
        ])}
      />
      <ContactPage />
    </>
  );
}
