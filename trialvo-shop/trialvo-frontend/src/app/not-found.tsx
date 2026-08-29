import type { Metadata } from "next";
import NotFound from "@/views/NotFound";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { PAGE_SEO } from "@/lib/seo/copy";

/**
 * A 404 has no locale segment to read, so it uses the default locale's copy.
 * Explicit `noindex` matters here: without it the page would otherwise inherit
 * the root layout's home-page title and description.
 */
export const metadata: Metadata = {
  title: PAGE_SEO.notFound[DEFAULT_LOCALE].title,
  description: PAGE_SEO.notFound[DEFAULT_LOCALE].description,
  robots: { index: false, follow: true },
};

export default NotFound;
