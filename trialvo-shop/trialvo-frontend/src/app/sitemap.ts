import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { LOCALES, absoluteUrl } from "@/lib/i18n";
import { languageAlternates } from "@/lib/seo/metadata";
import { fetchSeoProducts } from "@/lib/seo/catalog";
import { PUBLIC_ROUTES } from "@/lib/seo/routes";

/** Re-read the catalog hourly so new products enter the sitemap without a deploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchSeoProducts();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of PUBLIC_ROUTES) {
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
        ...(product.thumbnail
          ? { images: [absoluteMedia(product.thumbnail)] }
          : {}),
      });
    }
  }

  return entries;
}

/** Sitemap image entries must be absolute; stored thumbnails may be relative. */
function absoluteMedia(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  return `${BRAND.siteUrl.replace(/\/$/, "")}/${src.replace(/^\//, "")}`;
}
