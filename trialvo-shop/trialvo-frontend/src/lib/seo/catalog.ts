import { API_BASE } from "@/lib/env";
import { quoteProductPrice } from "@/lib/productPricing";

const SERVER_API_BASE =
  process.env.INTERNAL_API_URL || API_BASE;

export type SeoProduct = {
  slug: string;
  name: { bn: string; en: string };
  shortDescription: { bn: string; en: string };
  seo: {
    title: { bn: string; en: string };
    description: { bn: string; en: string };
    keywords: { bn: string[]; en: string[] };
  };
  thumbnail: string;
  videoUrl?: string;
  priceBdt: number;
  priceUsd: number;
  discountPercent: number;
  faq: { question: { bn: string; en: string }; answer: { bn: string; en: string } }[];
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapRow(row: Record<string, unknown>): SeoProduct {
  const quote = quoteProductPrice({
    priceBDT: Number(row.price_bdt) || 0,
    priceUSD: Number(row.price_usd) || 0,
    discountPercent: Number(row.discount_percent) || 0,
  });
  return {
    slug: String(row.slug || ""),
    name: parseJson(row.name, { bn: "", en: "" }),
    shortDescription: parseJson(row.short_description, { bn: "", en: "" }),
    seo: parseJson(row.seo, {
      title: { bn: "", en: "" },
      description: { bn: "", en: "" },
      keywords: { bn: [] as string[], en: [] as string[] },
    }),
    thumbnail: String(row.thumbnail || ""),
    videoUrl: String(row.video_url || "").trim() || undefined,
    priceBdt: quote.saleBdt,
    priceUsd: quote.saleUsd,
    discountPercent: quote.discountPercent,
    faq: parseJson(row.faq, []),
  };
}

export async function fetchSeoProducts(): Promise<SeoProduct[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/products`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown>[];
    return (Array.isArray(data) ? data : [])
      .map(mapRow)
      .filter((product) => product.slug);
  } catch {
    return [];
  }
}

export async function fetchSeoProduct(slug: string): Promise<SeoProduct | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return mapRow((await res.json()) as Record<string, unknown>);
  } catch {
    return null;
  }
}
