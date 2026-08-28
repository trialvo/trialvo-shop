import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import {
  absoluteUrl,
  isLocale,
  LOCALES,
  LOCALE_HREFLANG,
  LOCALE_OG,
  type Locale,
} from "@/lib/i18n";
import type { PageSeoCopy } from "@/lib/seo/copy";

export function resolveLocale(lang: string | undefined): Locale {
  return isLocale(lang) ? lang : "bn";
}

export function languageAlternates(path: string) {
  const languages: Record<string, string> = {
    "x-default": absoluteUrl("bn", path, BRAND.siteUrl),
  };
  for (const locale of LOCALES) {
    languages[LOCALE_HREFLANG[locale]] = absoluteUrl(locale, path, BRAND.siteUrl);
  }
  return languages;
}

export function buildPageMetadata({
  locale,
  path,
  seo,
  ogType = "website",
  ogImage,
  noindex = false,
}: {
  locale: Locale;
  path: string;
  seo: PageSeoCopy;
  ogType?: "website" | "article";
  ogImage?: string;
  noindex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(locale, path, BRAND.siteUrl);
  const image =
    ogImage ||
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop";

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    authors: [{ name: BRAND.name }],
    creator: BRAND.name,
    publisher: BRAND.name,
    metadataBase: new URL(BRAND.siteUrl),
    alternates: {
      canonical,
      languages: languageAlternates(path),
    },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType,
      locale: LOCALE_OG[locale],
      alternateLocale: LOCALES.filter((item) => item !== locale).map(
        (item) => LOCALE_OG[item],
      ),
      url: canonical,
      siteName: BRAND.name,
      title: `${seo.title} | ${BRAND.name}`,
      description: seo.description,
      images: [{ url: image, width: 1200, height: 630, alt: BRAND.name }],
    },
    twitter: {
      card: "summary_large_image",
      site: BRAND.social.twitter,
      title: `${seo.title} | ${BRAND.name}`,
      description: seo.description,
      images: [image],
    },
  };
}
