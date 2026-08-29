import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { BRAND } from "@/lib/brand";
import { LOCALES } from "@/lib/i18n";
import {
  allStaticUrls,
  productUrls,
  submitToIndexNow,
} from "@/lib/seo/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  /** Product slugs that changed. */
  slugs?: string[];
  /** Locale-relative paths, e.g. `/products/foo`. */
  paths?: string[];
  /** Submit every indexable static route as well. */
  all?: boolean;
};

function authorized(request: NextRequest): boolean {
  const secret = process.env.SEO_REVALIDATE_SECRET;
  if (!secret) return false;
  const header =
    request.headers.get("x-seo-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return header === secret;
}

function absolute(paths: string[]): string[] {
  const base = BRAND.siteUrl.replace(/\/$/, "");
  return paths.flatMap((path) => {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return LOCALES.map((locale) => `${base}/${locale}${clean === "/" ? "" : clean}`);
  });
}

/**
 * Instant-indexing hook. Call it after a product is published or edited so the
 * sitemap cache is dropped and participating search engines are pinged in the
 * same request.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload = {};
  try {
    payload = (await request.json()) as Payload;
  } catch {
    payload = {};
  }

  const urls: string[] = [];
  if (payload.all) urls.push(...allStaticUrls());
  for (const slug of payload.slugs ?? []) urls.push(...productUrls(slug));
  if (payload.paths?.length) urls.push(...absolute(payload.paths));
  if (!urls.length) urls.push(...allStaticUrls());

  // Drop the cached sitemap and feed so crawlers arriving from the ping see
  // the new URLs rather than the previous hour's snapshot.
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  for (const slug of payload.slugs ?? []) {
    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/products/${slug}`);
      revalidatePath(`/${locale}/products`);
    }
  }

  // Revalidation above is the part that must succeed; the IndexNow ping is
  // best-effort, so its outcome is reported in the body rather than turned into
  // a failure status the caller would have to treat as an error.
  const indexNow = await submitToIndexNow(urls);
  return NextResponse.json({ revalidated: true, urls: urls.length, indexNow });
}
