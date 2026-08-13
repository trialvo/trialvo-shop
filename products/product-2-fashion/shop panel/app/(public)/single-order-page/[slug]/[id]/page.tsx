import { buildMetadata, getSiteUrl } from "@/lib/seo";
import { humanizeSlug, normalizeSlug } from "@/lib/string";
import { toPublicUrl } from "@/lib/utils";
import { API_URL } from "@/config/env";
import type { Metadata } from "next";
import SingleOrderPageClient from "./SingleOrderPageClient";

type PageProps = {
  params: Promise<{ slug: string | string[]; id: string }>;
};

type ProductMeta = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  keywords?: string;
  robots?: string;
  ogImage?: string;
};

const buildApiBase = () => {
  return `${API_URL.replace(/\/+$/, "")}/api/v1`;
};

async function fetchProductMeta(id: number): Promise<ProductMeta | null> {
  try {
    const apiBase = buildApiBase();
    const res = await fetch(`${apiBase}/user/product/${id}/single-page-data`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      product?: {
        name?: string | null;
        short_description?: string | null;
        meta_title?: string | null;
        meta_description?: string | null;
        meta_keywords?: string | null;
        canonical_url?: string | null;
        og_title?: string | null;
        og_description?: string | null;
        robots?: string | null;
        images?: Array<{ path?: string | null }>;
      };
    };

    if (!data?.success || !data?.product) return null;

    const product = data.product;
    const rawImage = product?.images?.[0]?.path ?? null;
    const ogImage = toPublicUrl(rawImage) ?? undefined;

    return {
      title: product?.meta_title ?? product?.name ?? undefined,
      description: product?.meta_description ?? product?.short_description ?? undefined,
      ogTitle: product?.og_title ?? undefined,
      ogDescription: product?.og_description ?? undefined,
      canonicalUrl: product?.canonical_url ?? undefined,
      keywords: product?.meta_keywords ?? undefined,
      robots: product?.robots ?? undefined,
      ogImage,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const idNum = Number(id);

  const fallbackTitle = humanizeSlug(normalizedSlug);
  const metaFromApi = Number.isFinite(idNum) && idNum > 0 ? await fetchProductMeta(idNum) : null;

  const title = metaFromApi?.title ?? fallbackTitle;
  const description =
    metaFromApi?.description ?? `Order ${title} directly — no login required. Fast checkout.`;

  const shopUrl = getSiteUrl();
  const canonical =
    metaFromApi?.canonicalUrl ?? `${shopUrl}/single-order-page/${normalizedSlug}/${id}`;

  return buildMetadata({
    title: `${title} — Quick Order | Vellora`,
    description,
    canonical,
    keywords: metaFromApi?.keywords,
    robots: metaFromApi?.robots ?? "noindex, nofollow",
    ogTitle: metaFromApi?.ogTitle ?? `${title} — Quick Order | Vellora`,
    ogDescription: metaFromApi?.ogDescription ?? description,
    ogImage: metaFromApi?.ogImage ?? "/og-product.jpg",
  });
}

export default async function SingleOrderPage({ params }: PageProps) {
  const { slug, id } = await params;
  const normalizedSlug = normalizeSlug(slug);

  return <SingleOrderPageClient slug={normalizedSlug} id={id} />;
}
