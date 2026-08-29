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

/** Branded fallback card, served by the dynamic Open Graph route. */
export const DEFAULT_OG_IMAGE = `${BRAND.siteUrl}/api/og`;

export function buildPageMetadata({
  locale,
  path,
  seo,
  ogType = "website",
  ogImage,
  noindex = false,
  publishedTime,
  modifiedTime,
}: {
  locale: Locale;
  path: string;
  seo: PageSeoCopy;
  ogType?: "website" | "article";
  ogImage?: string;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const canonical = absoluteUrl(locale, path, BRAND.siteUrl);
  const image = ogImage || DEFAULT_OG_IMAGE;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    applicationName: BRAND.name,
    authors: [{ name: BRAND.name, url: BRAND.siteUrl }],
    creator: BRAND.name,
    publisher: BRAND.name,
    category: "Ecommerce software",
    metadataBase: new URL(BRAND.siteUrl),
    formatDetection: { telephone: false, address: false, email: false },
    alternates: {
      canonical,
      languages: languageAlternates(path),
    },
    robots: noindex
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
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
      ...(ogType === "article" && (publishedTime || modifiedTime)
        ? {
            publishedTime,
            modifiedTime,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: BRAND.social.twitter,
      creator: BRAND.social.twitter,
      title: `${seo.title} | ${BRAND.name}`,
      description: seo.description,
      images: [image],
    },
    other: {
      "geo.region": "BD-13",
      "geo.placename": "Savar, Dhaka",
      "content-language": locale === "bn" ? "bn-BD" : "en-US",
    },
  };
}
