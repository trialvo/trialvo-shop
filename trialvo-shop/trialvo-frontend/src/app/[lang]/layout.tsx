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
      {/*
        `<html lang>` lives in the root layout, which cannot read this segment's
        param, and reading it from headers() would make every route dynamic.
        Declaring the language on a wrapper instead is valid HTML and overrides
        it for this subtree, so crawlers and screen readers see the real
        language in the server HTML. The lang-* class does the same for the
        font, avoiding a reflow once LanguageContext hydrates.
      */}
      <div lang={lang} className={`lang-${lang}`}>
        {children}
      </div>
    </>
  );
}
