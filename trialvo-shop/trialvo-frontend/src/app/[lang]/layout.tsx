import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import { LOCALES, isLocale } from "@/lib/i18n";
import { pageSeo } from "@/lib/seo/copy";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  return buildPageMetadata({
    locale,
    path: "/",
    seo: pageSeo("home", locale),
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      <JsonLd id="seo-organization" data={organizationJsonLd(lang)} />
      <JsonLd id="seo-website" data={websiteJsonLd(lang)} />
      {children}
    </>
  );
}
