import { BRAND } from "@/lib/brand";
import { LOCALES, absoluteUrl } from "@/lib/i18n";
import { PUBLIC_ROUTES } from "@/lib/seo/routes";

const ENDPOINT = "https://api.indexnow.org/indexnow";

export function indexNowKey(): string {
  return process.env.INDEXNOW_KEY || "";
}

/**
 * Where crawlers verify ownership. Prefer a file dropped in `public/`
 * (`public/<key>.txt`); the API route is the fallback when that is not
 * practical, e.g. when the key only exists as an environment variable.
 */
export function indexNowKeyLocation(): string {
  const explicit = process.env.INDEXNOW_KEY_LOCATION;
  if (explicit) return explicit;
  const key = indexNowKey();
  return `${BRAND.siteUrl}/api/indexnow/${key}`;
}

/** Absolute URLs for every indexable static route, in both locales. */
export function allStaticUrls(): string[] {
  return LOCALES.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => absoluteUrl(locale, route.path, BRAND.siteUrl)),
  );
}

/** Absolute URLs for one product slug, in both locales. */
export function productUrls(slug: string): string[] {
  return LOCALES.map((locale) =>
    absoluteUrl(locale, `/products/${slug}`, BRAND.siteUrl),
  );
}

export type IndexNowResult = {
  submitted: number;
  ok: boolean;
  status: number;
  message: string;
};

/**
 * Push URLs to IndexNow, which fans out to Bing, Yandex, Seznam, and Naver.
 * Google does not participate — for Google, discovery still comes from the
 * sitemap and the RSS feed, which is why both are kept fresh.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = indexNowKey();
  const unique = Array.from(new Set(urls.filter(Boolean)));

  if (!key) {
    return {
      submitted: 0,
      ok: false,
      status: 501,
      message: "INDEXNOW_KEY is not configured",
    };
  }
  if (!unique.length) {
    return { submitted: 0, ok: false, status: 400, message: "No URLs to submit" };
  }

  const host = new URL(BRAND.siteUrl).host;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: indexNowKeyLocation(),
        urlList: unique.slice(0, 10000),
      }),
      cache: "no-store",
    });

    return {
      submitted: unique.length,
      ok: res.ok,
      status: res.status,
      message: res.ok ? "Submitted" : `IndexNow responded ${res.status}`,
    };
  } catch (error) {
    return {
      submitted: 0,
      ok: false,
      status: 502,
      message: error instanceof Error ? error.message : "IndexNow request failed",
    };
  }
}
