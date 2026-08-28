import type { Metadata } from "next";
import AboutPage from "@/views/AboutPage";
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
  return (
    <>
      <JsonLd
        id="seo-breadcrumb-about"
        data={breadcrumbJsonLd(locale, [
          { name: locale === "bn" ? "হোম" : "Home", path: "/" },
          { name: locale === "bn" ? "আমাদের সম্পর্কে" : "About", path: "/about" },
        ])}
      />
      <AboutPage />
    </>
  );
}
