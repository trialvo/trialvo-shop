import type { Metadata } from "next";
import ProductDetailPage from "@/views/ProductDetailPage";
import JsonLd from "@/components/seo/JsonLd";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { fetchSeoProduct } from "@/lib/seo/catalog";
import { pageSeo } from "@/lib/seo/copy";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = resolveLocale(lang);
  const product = await fetchSeoProduct(slug);
  if (!product) {
    return buildPageMetadata({
      locale,
      path: `/products/${slug}`,
      seo: pageSeo("products", locale),
    });
  }

  const title = product.seo.title[locale] || product.name[locale] || slug;
  const description =
    product.seo.description[locale] || product.shortDescription[locale] || "";
  const keywords = product.seo.keywords[locale] || [];

  return buildPageMetadata({
    locale,
    path: `/products/${slug}`,
    seo: { title, description, keywords },
    ogImage: resolveMediaUrl(product.thumbnail) || undefined,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = resolveLocale(lang);
  const product = await fetchSeoProduct(slug);

  const faqItems =
    product?.faq?.map((item) => ({
      question: item.question?.[locale] || item.question?.en || "",
      answer: item.answer?.[locale] || item.answer?.en || "",
    })).filter((item) => item.question && item.answer) || [];

  return (
    <>
      {product ? (
        <>
          <JsonLd
            id="seo-product"
            data={productJsonLd({
              locale,
              name: product.name[locale] || product.name.en,
              description:
                product.shortDescription[locale] || product.shortDescription.en,
              slug: product.slug,
              image: resolveMediaUrl(product.thumbnail),
              price: locale === "en" && product.priceUsd > 0 ? product.priceUsd : product.priceBdt,
              currency: locale === "en" && product.priceUsd > 0 ? "USD" : "BDT",
            })}
          />
          <JsonLd
            id="seo-breadcrumb-product"
            data={breadcrumbJsonLd(locale, [
              { name: locale === "bn" ? "হোম" : "Home", path: "/" },
              {
                name: locale === "bn" ? "প্রোডাক্ট" : "Products",
                path: "/products",
              },
              { name: product.name[locale] || product.slug },
            ])}
          />
          <JsonLd id="seo-faq-product" data={faqJsonLd(faqItems)} />
        </>
      ) : null}
      <ProductDetailPage />
    </>
  );
}
