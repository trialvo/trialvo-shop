import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { LOCALES, absoluteUrl } from "@/lib/i18n";
import { languageAlternates } from "@/lib/seo/metadata";
import { fetchSeoProducts } from "@/lib/seo/catalog";

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchSeoProducts();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of STATIC_PATHS) {
      entries.push({
        url: absoluteUrl(locale, page.path, BRAND.siteUrl),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: languageAlternates(page.path) },
      });
    }

    for (const product of products) {
      const path = `/products/${product.slug}`;
      entries.push({
        url: absoluteUrl(locale, path, BRAND.siteUrl),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: languageAlternates(path) },
      });
    }
  }

  return entries;
}
