import { BRAND, brandName } from "@/lib/brand";
import { lifetimeCopy } from "@/lib/commerce";
import {
  absoluteUrl,
  LOCALE_HREFLANG,
  LOCALE_HTML,
  type Locale,
} from "@/lib/i18n";

/**
 * Combine several schema nodes into a single `@graph` document.
 * One script tag with cross-referenced `@id`s is easier for crawlers to
 * reconcile than many disconnected blocks.
 */
export function graphJsonLd(...nodes: (object | null | undefined)[]) {
  const graph = nodes.filter(Boolean).map((node) => {
    const { ["@context"]: _context, ...rest } = node as Record<string, unknown>;
    return rest;
  });
  if (!graph.length) return null;
  return { "@context": "https://schema.org", "@graph": graph };
}

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
  price,
  currency,
}: {
  locale: Locale;
  name: string;
  description: string;
  slug: string;
  image: string;
  price: number;
  currency: "BDT" | "USD";
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
      price,
      priceCurrency: currency,
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

/**
 * Generic page node. Ties the page to the WebSite and Organization nodes so a
 * crawler can resolve publisher and language without guessing.
 */
export function webPageJsonLd({
  locale,
  path,
  name,
  description,
  type = "WebPage",
  dateModified,
}: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "FAQPage" | "ItemPage";
  dateModified?: string;
}) {
  const url = absoluteUrl(locale, path, BRAND.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: LOCALE_HREFLANG[locale],
    isPartOf: { "@id": `${BRAND.siteUrl}/#website` },
    publisher: { "@id": `${BRAND.siteUrl}/#organization` },
    ...(dateModified ? { dateModified } : {}),
  };
}

/** Policy and terms pages — a WebPage wrapping a DigitalDocument. */
export function legalPageJsonLd({
  locale,
  path,
  name,
  description,
  dateModified,
}: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  dateModified: string;
}) {
  const url = absoluteUrl(locale, path, BRAND.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: LOCALE_HREFLANG[locale],
    isPartOf: { "@id": `${BRAND.siteUrl}/#website` },
    publisher: { "@id": `${BRAND.siteUrl}/#organization` },
    dateModified,
    mainEntity: {
      "@type": "DigitalDocument",
      name,
      description,
      dateModified,
      inLanguage: LOCALE_HREFLANG[locale],
      publisher: { "@id": `${BRAND.siteUrl}/#organization` },
    },
  };
}

export function howToJsonLd({
  locale,
  name,
  description,
  path,
  steps,
}: {
  locale: Locale;
  name: string;
  description: string;
  path: string;
  steps: { name: string; text: string; anchor?: string }[];
}) {
  const url = absoluteUrl(locale, path, BRAND.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    inLanguage: LOCALE_HREFLANG[locale],
    totalTime: "PT1H",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.anchor ? `${url}#${step.anchor}` : url,
    })),
  };
}

/**
 * What the company offers, beyond the individual products. Helps the shop rank
 * for service intent ("ecommerce website development") alongside product intent.
 */
export function serviceJsonLd(locale: Locale) {
  const copy = lifetimeCopy(locale);
  const isBn = locale === "bn";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BRAND.siteUrl}/#service`,
    name: isBn
      ? "রেডিমেড ইকমার্স ওয়েবসাইট ও কাস্টম সফটওয়্যার ডেভেলপমেন্ট"
      : "Ready-made ecommerce websites and custom software development",
    description: isBn
      ? "রেডিমেড ইকমার্স সলিউশন সরবরাহ, ডেলিভারি, কাস্টমাইজেশন, DevOps ও মেইনটেন্যান্স — এককালীন পেমেন্টে আজীবন লাইসেন্স ও সাপোর্ট।"
      : "Supplying ready-made ecommerce solutions with delivery, customization, DevOps, and maintenance — a lifetime license and support for a one-time payment.",
    serviceType: isBn ? "ইকমার্স ওয়েবসাইট সলিউশন" : "Ecommerce website solutions",
    provider: { "@id": `${BRAND.siteUrl}/#organization` },
    areaServed: [
      { "@type": "Country", name: "Bangladesh" },
      { "@type": "AdministrativeArea", name: "Worldwide" },
    ],
    availableLanguage: ["bn", "en"],
    termsOfService: absoluteUrl(locale, "/terms", BRAND.siteUrl),
    additionalProperty: [
      { "@type": "PropertyValue", name: "License", value: copy.license },
      { "@type": "PropertyValue", name: "Support", value: copy.support },
      { "@type": "PropertyValue", name: "Updates", value: copy.updates },
    ],
  };
}

/**
 * The individual services we offer, as an OfferCatalog hanging off the Service
 * node. Built from the same content module the about page renders.
 */
export function serviceCatalogJsonLd(
  locale: Locale,
  entries: { name: string; summary: string }[],
) {
  if (!entries.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${BRAND.siteUrl}/#service-catalog`,
    name: locale === "bn" ? "সেবার তালিকা" : "Service catalog",
    inLanguage: LOCALE_HREFLANG[locale],
    provider: { "@id": `${BRAND.siteUrl}/#organization` },
    itemListElement: entries.map((entry, index) => ({
      "@type": "Offer",
      position: index + 1,
      itemOffered: {
        "@type": "Service",
        name: entry.name,
        description: entry.summary,
        provider: { "@id": `${BRAND.siteUrl}/#organization` },
      },
    })),
  };
}

/**
 * Price range across the catalog. Gives the collection page an offer signal
 * that a plain ItemList cannot provide.
 */
export function aggregateOfferJsonLd(
  locale: Locale,
  prices: number[],
  currency: "BDT" | "USD" = "BDT",
) {
  const valid = prices.filter((price) => price > 0);
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice: Math.min(...valid),
    highPrice: Math.max(...valid),
    offerCount: valid.length,
    availability: "https://schema.org/InStock",
    url: absoluteUrl(locale, "/products", BRAND.siteUrl),
    seller: { "@id": `${BRAND.siteUrl}/#organization` },
  };
}
