import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import {
  AboutCta,
  AboutHero,
  AboutHighlights,
  AboutPrinciples,
  AboutStory,
  AboutValues,
} from "@/components/about";
import { ABOUT_PAGE_CONTENT } from "@/lib/aboutContent";
import { toAboutHighlightViewModels } from "@/lib/aboutHighlights";
import { useProducts } from "@/hooks/useProducts";

/**
 * Public About page (`/about`).
 * Standard marketplace about layout: header → facts → story → values → steps → CTA.
 */
export default function AboutPage() {
  const { language } = useLanguage();
  const content = ABOUT_PAGE_CONTENT;
  const seo = content.seo[language];

  const { data: products, isLoading: productsLoading } = useProducts();

  const highlights = useMemo(
    () => toAboutHighlightViewModels(content.highlights, language, products),
    [content.highlights, language, products],
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: language === "bn" ? "হোম" : "Home",
        item: typeof window !== "undefined" ? `${window.location.origin}/` : "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: language === "bn" ? "আমাদের সম্পর্কে" : "About",
        item:
          typeof window !== "undefined"
            ? `${window.location.origin}/about`
            : "/about",
      },
    ],
  } as const;

  return (
    <Layout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        structuredData={breadcrumbSchema}
      />

      <AboutHero content={content.hero} language={language} />
      <AboutHighlights
        items={highlights}
        language={language}
        isLoading={productsLoading}
      />
      <AboutStory content={content.story} language={language} />
      <AboutValues
        values={content.values}
        language={language}
        title={language === "bn" ? "আমাদের মূল নীতি" : "What we stand for"}
        supporting={
          language === "bn"
            ? "সংক্ষেপে চারটি বিষয় যা আমাদের কাজ নির্দেশ করে।"
            : "Four simple principles that guide how we work."
        }
      />
      <AboutPrinciples
        principles={content.principles}
        language={language}
        title={language === "bn" ? "কীভাবে শুরু করবেন" : "How to get started"}
        supporting={
          language === "bn"
            ? "তিনটি সহজ ধাপ—দেখুন, টেস্ট করুন, লঞ্চ করুন।"
            : "Three easy steps—browse, try, and launch."
        }
      />
      <AboutCta content={content.cta} language={language} />
    </Layout>
  );
}
