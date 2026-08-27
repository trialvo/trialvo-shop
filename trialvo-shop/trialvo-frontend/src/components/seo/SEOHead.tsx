"use client";

import { useEffect, type FC } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND, brandName } from "@/lib/brand";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  structuredData?: object;
  faqData?: { question: string; answer: string }[];
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra?.hrefLang
    ? `link[rel="${rel}"][hreflang="${extra.hrefLang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: object | null) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  let el = existing as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const SEOHead: FC<SEOHeadProps> = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop",
  ogType = "website",
  structuredData,
  faqData,
  noindex = false,
}) => {
  const { language } = useLanguage();
  const siteUrl = BRAND.siteUrl;
  const currentUrl =
    canonicalUrl ||
    (typeof window !== "undefined" ? window.location.href : siteUrl);

  const siteName = brandName(language);
  const fullTitle = `${title} | ${siteName}`;

  useEffect(() => {
    document.documentElement.lang = language === "bn" ? "bn" : "en";
    document.title = fullTitle;

    upsertMeta("name", "description", description);
    if (keywords.length > 0) {
      upsertMeta("name", "keywords", keywords.join(", "));
    }
    upsertMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    );
    upsertLink("canonical", currentUrl);
    upsertLink("alternate", siteUrl, { hrefLang: "bn-BD" });
    upsertLink("alternate", `${siteUrl}/en`, { hrefLang: "en-US" });
    upsertLink("alternate", siteUrl, { hrefLang: "x-default" });

    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", currentUrl);
    upsertMeta("property", "og:site_name", siteName);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:locale", language === "bn" ? "bn_BD" : "en_US");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:site", BRAND.social.twitter);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      email: BRAND.contactEmail,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/favicon.svg`,
        width: "112",
        height: "112",
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
        contactType: "customer service",
        availableLanguage: ["Bengali", "English"],
        areaServed: "BD",
      },
      parentOrganization: {
        "@type": "Organization",
        name: BRAND.company.name,
        url: BRAND.company.url,
      },
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: language === "bn" ? "bn-BD" : "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/products?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    const faqSchema =
      faqData && faqData.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqData.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }
        : null;

    upsertJsonLd("seo-organization", organizationSchema);
    upsertJsonLd("seo-website", websiteSchema);
    upsertJsonLd("seo-structured", structuredData || null);
    upsertJsonLd("seo-faq", faqSchema);
  }, [
    currentUrl,
    description,
    faqData,
    fullTitle,
    keywords,
    language,
    noindex,
    ogImage,
    ogType,
    siteName,
    siteUrl,
    structuredData,
    title,
  ]);

  return null;
};

export default SEOHead;
