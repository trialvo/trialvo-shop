import HomePage from "@/views/HomePage";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { pageSeo } from "@/lib/seo/copy";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";
import type { Metadata } from "next";

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
  return (
    <>
      <JsonLd
        id="seo-breadcrumb-home"
        data={breadcrumbJsonLd(locale, [
          { name: locale === "bn" ? "হোম" : "Home", path: "/" },
        ])}
      />
      <HomePage />
    </>
  );
}
