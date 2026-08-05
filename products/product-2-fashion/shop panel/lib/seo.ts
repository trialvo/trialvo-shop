import type { Metadata } from "next";
import { SITE_URL } from "@/config/env";

export type SeoInput = {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  keywords?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
};

const DEFAULT_TITLE = "Graduate | A Clothing Brand";
const DEFAULT_DESCRIPTION = "A Clothing Brand - Where we sell clothing goods.";

export const getSiteUrl = () =>
  SITE_URL.replace(/\/+$/, "");

const toFullUrl = (base: string, value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
};

const normalizeRobots = (value?: string | null) => {
  if (!value) return "index,follow";
  const trimmed = value.trim();
  return trimmed ? trimmed : "index,follow";
};

export const buildMetadata = (input?: SeoInput): Metadata => {
  const siteUrl = getSiteUrl();
  const title = input?.title?.trim() || DEFAULT_TITLE;
  const description = input?.description?.trim() || DEFAULT_DESCRIPTION;
  const canonical = toFullUrl(siteUrl, input?.canonical) ?? siteUrl;
  const ogImage = toFullUrl(siteUrl, input?.ogImage) ?? `${siteUrl}/og-product.jpg`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: input?.keywords ?? undefined,
    robots: normalizeRobots(input?.robots),
    openGraph: {
      title: input?.ogTitle ?? title,
      description: input?.ogDescription ?? description,
      url: canonical,
      siteName: "Graduate",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input?.ogTitle ?? title,
      description: input?.ogDescription ?? description,
      images: [ogImage],
    },
  };
};
