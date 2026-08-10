import { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ProductDetailClient from "@/components/ProductDetailClient";
import { ArrowRight } from "lucide-react";
import config from "@/config";

const API_URL = config.apiUrl;
const BASE_URL = config.baseUrl;

type Params = Promise<{ slug: string }>;

interface ApiProduct {
  id: number;
  name: string;
  name_bn?: string | null;
  slug: string;
  price: number;           // MRP
  discount_amount?: number; // flat BDT discount
  actual_price?: number | null;
  short_description: string;
  description: string;
  image: string;
  images?: string[];
  category?: { id: number; name: string; slug: string };
  tags?: string[];
  features?: string[];
  specifications?: Record<string, string>;
  in_stock: boolean;
  stock_qty?: number;
  rating: number;
  review_count: number;
  is_combo_eligible: boolean;
  is_featured?: boolean;
  video_url?: string;
}

async function getProduct(slug: string): Promise<ApiProduct | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || null;
  } catch {
    return null;
  }
}

async function getRelatedProducts(categorySlug?: string, currentId?: number): Promise<ApiProduct[]> {
  try {
    const params = categorySlug ? `?category=${categorySlug}&limit=4` : "?limit=4";
    const res = await fetch(`${API_URL}/products${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).filter((p: ApiProduct) => p.id !== currentId).slice(0, 4);
  } catch {
    return [];
  }
}

function toFrontend(p: ApiProduct) {
  const mrp = Number(p.price);
  const discountAmt = Number(p.discount_amount ?? 0);
  const sellPrice = discountAmt > 0 ? Math.max(0, mrp - discountAmt) : mrp;
  const hasDiscount = sellPrice < mrp;

  return {
    id: p.id,
    name: p.name,
    name_bn: p.name_bn ?? null,
    slug: p.slug,
    price: mrp,                           // MRP — strikethrough
    discountPrice: hasDiscount ? sellPrice : null,  // sell price
    discountAmount: discountAmt,
    shortDescription: p.short_description,
    description: p.description,
    image: p.image,
    images: (() => {
      if (Array.isArray(p.images) && p.images.length > 0) return p.images as string[];
      if (typeof p.images === "string") {
        try { const parsed = JSON.parse(p.images); if (Array.isArray(parsed)) return parsed as string[]; } catch { }
      }
      return p.image ? [p.image] : [];
    })(),
    category: p.category?.name || "",
    categorySlug: p.category?.slug || "",
    rating: Number(p.rating),
    reviewCount: p.review_count,
    inStock: p.in_stock,
    stockQty: p.stock_qty ?? 0,
    tags: p.tags || [],
    features: p.features || [],
    specifications: p.specifications || {},
    isComboEligible: p.is_combo_eligible,
    isFeatured: p.is_featured ?? false,
    videoUrl: p.video_url || undefined,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product Not Found" };

  return {
    title: p.name,
    description: p.short_description,
    keywords: p.tags || [],
    openGraph: {
      title: p.name,
      description: p.short_description,
      url: `${BASE_URL}/products/${p.slug}`,
      type: "website",
      images: [{ url: p.image, width: 800, height: 600, alt: p.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: p.short_description,
      images: [p.image],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const apiProduct = await getProduct(slug);
  if (!apiProduct) notFound();

  const relatedRaw = await getRelatedProducts(apiProduct.category?.slug, apiProduct.id);

  const product = toFrontend(apiProduct);
  const relatedProducts = relatedRaw.map(toFrontend);

  const effectivePrice = product.discountPrice ?? product.price;
  const discount = product.discountPrice && product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: apiProduct.name,
        description: apiProduct.description,
        image: [apiProduct.image].filter(Boolean),
        sku: `SKU-${apiProduct.id}`,
        brand: { "@type": "Brand", name: "My Shop" },
        offers: {
          "@type": "Offer",
          url: `${BASE_URL}/products/${apiProduct.slug}`,
          priceCurrency: "BDT",
          price: apiProduct.price,
          availability: apiProduct.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: apiProduct.rating,
          reviewCount: apiProduct.review_count,
        },
      }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { label: "Products", href: "/products" },
          { label: product.category, href: `/products?category=${apiProduct.category?.slug || ""}` },
          { label: product.name },
        ]} />

        <ProductDetailClient product={product} discount={discount} relatedProducts={relatedProducts} />

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a]">সম্পর্কিত পণ্য</h2>
                <p className="mt-1 text-sm text-slate-400">এই ক্যাটাগরিতে আরো পণ্য</p>
              </div>
              <a href="/products" className="hidden items-center gap-1 text-sm font-semibold text-[#e91e63] transition-colors hover:text-[#c2185b] sm:flex">
                সব দেখুন <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="stagger-children grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-100 bg-white/95 px-4 py-3.5 shadow-2xl backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-[#e91e63]">BDT {effectivePrice.toLocaleString()}</span>
            {product.discountPrice && (
              <span className="ml-2 text-xs text-slate-400 line-through">BDT {product.price.toLocaleString()}</span>
            )}
            {discount > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">-{discount}%</span>
            )}
          </div>
          <button className="btn-pink px-6 py-2.5 text-sm">
            এখনই অর্ডার করুন <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
