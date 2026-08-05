import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
import Layout from "@/components/layout/Layout";
import ShopClient from "@/components/product/ShopClient";
import { ProductCardsSkeleton } from "@/components/product/ProductCardsSkeleton";
import { products } from "@/data/products";
import { sanitizeSearchQuery } from "@/lib/security/search";
import {
  buildShopCategoryHref,
  humanizeCategorySlug,
  sanitizeCategorySlug,
} from "@/lib/shop/categoryRoutes";

interface Props {
  searchParams: {
    category?: string;
    badge?: string;
    brand?: string;
    q?: string;
  };
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const category = sanitizeCategorySlug(searchParams.category);
  const { badge, brand, q } = searchParams;

  let title = "Shop All Products | ShopLinkBD";
  let description =
    "Explore our wide range of premium tech accessories and gadgets in Bangladesh. Authentic products with official warranty.";

  if (category) {
    const label = humanizeCategorySlug(category);
    title = `${label} | ShopLinkBD`;
    description = `Buy authentic ${label} gadgets and accessories from ShopLinkBD. 100% genuine products with fast delivery in Bangladesh.`;
  } else if (badge) {
    title = `${badge.charAt(0).toUpperCase() + badge.slice(1)} Deals | ShopLinkBD`;
    description = `Check out our ${badge} products. Best prices on premium tech gadgets with official warranty and fast shipping.`;
  } else if (brand) {
    title = `${brand} Products | ShopLinkBD`;
    description = `Shop the latest ${brand} collection at ShopLinkBD. Genuine ${brand} accessories and gadgets with nationwide delivery.`;
  } else if (q) {
    title = `Search results for "${q}" | ShopLinkBD`;
  }

  const siteUrl = "https://shoplinkbd.com";
  const canonicalPath = category
    ? buildShopCategoryHref(category)
    : badge
      ? `/shop?badge=${encodeURIComponent(badge)}`
      : brand
        ? `/shop?brand=${encodeURIComponent(brand)}`
        : "/shop";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      siteName: "ShopLinkBD",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
    },
  };
}

function ShopLoading() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="h-4 w-32 bg-muted animate-pulse mb-6 rounded-sm"></div>
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded-sm"></div>
            <div className="h-3 w-32 bg-muted animate-pulse rounded-sm"></div>
          </div>
          <div className="h-10 w-48 bg-muted animate-pulse rounded-sm"></div>
        </div>
        <div className="flex gap-10">
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            <div className="h-[400px] w-full bg-muted animate-pulse rounded-sm"></div>
          </aside>
          <div className="flex-1">
            <ProductCardsSkeleton
              count={6}
              className="gap-6 md:grid-cols-2 xl:grid-cols-3"
              label="Loading shop products"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ShopPage({ searchParams }: Props) {
  const category = sanitizeCategorySlug(searchParams.category) || null;
  const { badge, brand, q } = searchParams;
  const searchQuery = q ? sanitizeSearchQuery(q) : null;

  let filtered = [...products];
  if (category) {
    filtered = filtered.filter(
      (p) => sanitizeCategorySlug(p.category) === category,
    );
  }
  if (badge) filtered = filtered.filter((p) => p.badge === badge);
  if (brand) filtered = filtered.filter((p) => p.brand === brand);
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query),
    );
  }

  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopClient
        initialProducts={filtered}
        categoryParam={category}
        badgeParam={badge || null}
        brandParam={brand || null}
        searchParam={searchQuery}
      />
    </Suspense>
  );
}
