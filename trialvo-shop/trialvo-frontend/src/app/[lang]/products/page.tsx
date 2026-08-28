import { Suspense } from "react";
import type { Metadata } from "next";
import ProductsPage from "@/views/ProductsPage";
import JsonLd from "@/components/seo/JsonLd";
import { fetchSeoProducts } from "@/lib/seo/catalog";
import { pageSeo } from "@/lib/seo/copy";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return buildPageMetadata({
    locale,
    path: "/products",
    seo: pageSeo("products", locale),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = resolveLocale((await params).lang);
  const products = await fetchSeoProducts();

  return (
    <>
      <JsonLd
        id="seo-breadcrumb-products"
        data={breadcrumbJsonLd(locale, [
          { name: locale === "bn" ? "হোম" : "Home", path: "/" },
          { name: locale === "bn" ? "প্রোডাক্ট" : "Products", path: "/products" },
        ])}
      />
      <JsonLd
        id="seo-itemlist-products"
        data={itemListJsonLd(
          locale,
          products.map((product) => ({
            slug: product.slug,
            name: product.name[locale] || product.slug,
          })),
        )}
      />
      <Suspense fallback={null}>
        <ProductsPage />
      </Suspense>
    </>
  );
}
