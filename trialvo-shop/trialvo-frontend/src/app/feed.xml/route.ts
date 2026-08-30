import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, LOCALES, absoluteUrl } from "@/lib/i18n";
import { fetchSeoProducts } from "@/lib/seo/catalog";
import { pageSeo } from "@/lib/seo/copy";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function item({
  title,
  link,
  description,
  pubDate,
}: {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}) {
  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
}

/**
 * RSS feed of the catalog. Crawlers and aggregators poll feeds far more
 * aggressively than sitemaps, so new products get discovered faster.
 */
export async function GET() {
  const products = await fetchSeoProducts();
  const now = new Date().toUTCString();
  const home = pageSeo("home", DEFAULT_LOCALE);
  const self = `${BRAND.siteUrl}/feed.xml`;

  const items = products.flatMap((product) =>
    LOCALES.map((locale) =>
      item({
        title: product.name[locale] || product.slug,
        link: absoluteUrl(locale, `/products/${product.slug}`, BRAND.siteUrl),
        description:
          product.seo.description[locale] ||
          product.shortDescription[locale] ||
          home.description,
        pubDate: now,
      }),
    ),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(BRAND.name)}</title>
    <link>${BRAND.siteUrl}</link>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(home.description)}</description>
    <language>${DEFAULT_LOCALE}</language>
    <lastBuildDate>${now}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
