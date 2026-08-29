import type { Metadata } from "next";
import ProductsPage from "@/views/ProductsPage";
import JsonLd from "@/components/seo/JsonLd";
import { faqHighlights } from "@/lib/content/faq";
import { fetchSeoProducts } from "@/lib/seo/catalog";
import { pageSeo } from "@/lib/seo/copy";
import {
  aggregateOfferJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  graphJsonLd,
  itemListJsonLd,
  webPageJsonLd,
} from "@/lib/seo/jsonld";
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
  const seo = pageSeo("products", locale);

  return (
    <>
      <JsonLd
        id="seo-products"
        data={graphJsonLd(
          webPageJsonLd({
            locale,
            path: "/products",
            name: seo.title,
            description: seo.description,
            type: "CollectionPage",
          }),
          itemListJsonLd(
            locale,
            products.map((product) => ({
              slug: product.slug,
              name: product.name[locale] || product.slug,
            })),
          ),
          aggregateOfferJsonLd(
            locale,
            products.map((product) => product.priceBdt),
          ),
          // Mirrors the FAQ block rendered below the catalog grid.
          faqJsonLd(faqHighlights(locale)),
          breadcrumbJsonLd(locale, [
            { name: locale === "bn" ? "হোম" : "Home", path: "/" },
            { name: locale === "bn" ? "প্রোডাক্ট" : "Products", path: "/products" },
          ]),
        )}
      />
      <ProductsPage />
    </>
  );
}
