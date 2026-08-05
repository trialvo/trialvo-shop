import type { Metadata } from "next";
import { API_URL } from "@/config/env";
import SingleOrderPageClient from "./SingleOrderPageClient";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

type ProductMetaResponse = {
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

const apiBase = `${API_URL.replace(/\/+$/, "")}/api/v1`;

async function fetchProductMeta(id: number) {
  try {
    const res = await fetch(`${apiBase}/user/product/${id}/single-page-data`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ProductMetaResponse;
    if (!data?.success || !data?.product) return null;

    const p = data.product;
    return {
      title: p.meta_title ?? p.name ?? undefined,
      description: p.meta_description ?? p.short_description ?? undefined,
      ogTitle: p.og_title ?? undefined,
      ogDescription: p.og_description ?? undefined,
      canonicalUrl: p.canonical_url ?? undefined,
      keywords: p.meta_keywords ?? undefined,
      robots: p.robots ?? undefined,
    };
  } catch {
    return null;
  }
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const idNum = Number(id);
  const fallbackTitle = humanizeSlug(slug);
  const meta =
    Number.isFinite(idNum) && idNum > 0
      ? await fetchProductMeta(idNum)
      : null;

  const title = meta?.title ?? fallbackTitle;
  const description =
    meta?.description ??
    `Order ${title} directly — no login required. Fast checkout.`;

  return {
    title: `${title} — Quick Order | LIFESTYLE`,
    description,
    keywords: meta?.keywords ?? undefined,
    robots: meta?.robots ?? "noindex, nofollow",
    openGraph: {
      title: meta?.ogTitle ?? `${title} — Quick Order | LIFESTYLE`,
      description: meta?.ogDescription ?? description,
    },
  };
}

export default async function SingleOrderPage({ params }: PageProps) {
  const { slug, id } = await params;

  return <SingleOrderPageClient slug={slug} id={id} />;
}
