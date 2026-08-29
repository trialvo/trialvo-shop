import type { Metadata } from "next";
import ProductDetailPage from "@/views/ProductDetailPage";
import JsonLd from "@/components/seo/JsonLd";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { fetchSeoProduct } from "@/lib/seo/catalog";
import { pageSeo } from "@/lib/seo/copy";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  graphJsonLd,
  productJsonLd,
  webPageJsonLd,
} from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";
import { parseVideoUrl } from "@/lib/videoEmbed";

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

  const parsedVideo = parseVideoUrl(product?.videoUrl);
  const productName = product ? product.name[locale] || product.name.en : "";
  const productDescription = product
    ? product.shortDescription[locale] || product.shortDescription.en
    : "";

  return (
    <>
      {product ? (
        <JsonLd
          id="seo-product"
          data={graphJsonLd(
            webPageJsonLd({
              locale,
              path: `/products/${product.slug}`,
              name: product.seo.title[locale] || product.name[locale] || product.slug,
              description:
                product.seo.description[locale] ||
                product.shortDescription[locale] ||
                "",
              type: "ItemPage",
            }),
            productJsonLd({
              locale,
              name: productName,
              description: productDescription,
              slug: product.slug,
              image: resolveMediaUrl(product.thumbnail),
              price: product.priceBdt,
              currency: "BDT",
              video: parsedVideo
                ? {
                    name: `${productName} demo`,
                    description: productDescription,
                    embedUrl: parsedVideo.embedUrl,
                    contentUrl: parsedVideo.watchUrl,
                    thumbnailUrl: parsedVideo.thumbnailUrl,
                  }
                : undefined,
            }),
            faqJsonLd(faqItems),
            breadcrumbJsonLd(locale, [
              { name: locale === "bn" ? "হোম" : "Home", path: "/" },
              {
                name: locale === "bn" ? "প্রোডাক্ট" : "Products",
                path: "/products",
              },
              { name: product.name[locale] || product.slug },
            ]),
          )}
        />
      ) : null}
      <ProductDetailPage />
    </>
  );
}
