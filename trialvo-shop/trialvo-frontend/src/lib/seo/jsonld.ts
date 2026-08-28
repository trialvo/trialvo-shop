import { BRAND, brandName } from "@/lib/brand";
import { lifetimeCopy } from "@/lib/commerce";
import {
  absoluteUrl,
  LOCALE_HTML,
  type Locale,
} from "@/lib/i18n";

export function organizationJsonLd(locale: Locale) {
  const siteName = brandName(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BRAND.siteUrl}/#organization`,
    name: siteName,
    url: BRAND.siteUrl,
    email: BRAND.contactEmail,
    logo: {
      "@type": "ImageObject",
      url: `${BRAND.siteUrl}/favicon.svg`,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jamgora",
      addressLocality: "Savar",
      addressRegion: "Dhaka",
      addressCountry: "BD",
    },
    sameAs: [BRAND.social.facebook, BRAND.social.youtube, BRAND.social.whatsapp],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+880-1629-615314",
      email: BRAND.contactEmail,
      contactType: "customer support",
      availableLanguage: ["Bengali", "English"],
      areaServed: "BD",
    },
    parentOrganization: {
      "@type": "Organization",
      name: BRAND.company.name,
      url: BRAND.company.url,
    },
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BRAND.siteUrl}/#website`,
    url: BRAND.siteUrl,
    name: brandName(locale),
    inLanguage: locale === "bn" ? "bn-BD" : "en-US",
    publisher: { "@id": `${BRAND.siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl(locale, "/products", BRAND.siteUrl)}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? { item: absoluteUrl(locale, item.path, BRAND.siteUrl) }
        : {}),
    })),
  };
}

export function productJsonLd({
  locale,
  name,
  description,
  slug,
  image,
  priceBdt,
}: {
  locale: Locale;
  name: string;
  description: string;
  slug: string;
  image: string;
  priceBdt: number;
}) {
  const copy = lifetimeCopy(locale);
  const url = absoluteUrl(locale, `/products/${slug}`, BRAND.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "SoftwareApplication"],
    name,
    description,
    image,
    url,
    sku: slug,
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      url,
      price: priceBdt,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: "2099-12-31",
      category: copy.license,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "License", value: copy.license },
      { "@type": "PropertyValue", name: "Support", value: copy.support },
      { "@type": "PropertyValue", name: "Updates", value: copy.updates },
    ],
  };
}

export function faqJsonLd(
  items: { question: string; answer: string }[],
) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function itemListJsonLd(
  locale: Locale,
  products: { name: string; slug: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: locale === "bn" ? "সকল প্রোডাক্ট" : "All products",
    inLanguage: LOCALE_HTML[locale],
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(locale, `/products/${product.slug}`, BRAND.siteUrl),
        name: product.name,
      })),
    },
  };
}
