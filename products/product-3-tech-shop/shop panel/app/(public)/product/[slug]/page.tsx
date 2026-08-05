import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "@/components/product/ProductPageClient";
import { fetchProductBySlugServer } from "@/lib/api/product/server";
import { sanitizeProductSlug } from "@/lib/security/slug";
import { htmlToPlainText } from "@/lib/security/html";
import { resolveMediaUrl } from "@/lib/media/url";
import { SITE_URL } from "@/config/env";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = sanitizeProductSlug(rawSlug);

  if (!slug) {
    return { title: "Product Not Found" };
  }

  const product = await fetchProductBySlugServer(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.meta_title || product.og_title || product.name;
  const description = htmlToPlainText(
    product.meta_description ||
      product.og_description ||
      product.short_description ||
      product.long_description ||
      product.name,
  ).slice(0, 160);

  const image = resolveMediaUrl(product.images?.[0]?.path);
  const url = `${SITE_URL.replace(/\/+$/, "")}/product/${product.slug}`;

  return {
    title,
    description,
    openGraph: {
      title: product.og_title || title,
      description: htmlToPlainText(product.og_description || description).slice(
        0,
        160,
      ),
      url: product.canonical_url || url,
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: product.canonical_url || url,
    },
    robots: product.robots || undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = sanitizeProductSlug(rawSlug);

  if (!slug) {
    notFound();
  }

  return <ProductPageClient slug={slug} />;
}
