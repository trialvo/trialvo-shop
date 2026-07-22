import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import {
  MarketplaceHero,
  CategoryBrowse,
  FeaturedMarketplace,
  MarketplaceHowItWorks,
  MarketplaceCTA,
} from "@/components/home";

type HomeSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
};

const HOME_SEO: Record<"bn" | "en", HomeSeoCopy> = {
  bn: {
    title: "ইশপ মার্কেট — ডিজিটাল ইকমার্স মার্কেটপ্লেস",
    description:
      "রেডিমেড ইকমার্স সলিউশনের ডিজিটাল মার্কেটপ্লেস। এডমিন প্যানেল ও শপ ওয়েবসাইট কিনুন বা লাইভ ট্রায়াল করুন।",
    keywords: [
      "ডিজিটাল মার্কেটপ্লেস",
      "রেডিমেড ইকমার্স",
      "এডমিন প্যানেল",
      "ইকমার্স টেমপ্লেট",
    ],
  },
  en: {
    title: "eShop Market — Digital Ecommerce Marketplace",
    description:
      "A digital marketplace for ready-made ecommerce solutions. Buy admin panel + shop or start a live trial.",
    keywords: [
      "digital marketplace",
      "ready-made ecommerce",
      "admin panel",
      "ecommerce templates",
    ],
  },
};

/**
 * Public marketplace home (`/`).
 * Header + hero stay; body sections follow digital-goods catalog patterns.
 */
export default function HomePage() {
  const { language } = useLanguage();
  const seo = HOME_SEO[language];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: language === "bn" ? "হোম" : "Home",
        item: typeof window !== "undefined" ? window.location.origin : "",
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

      <MarketplaceHero />
      <CategoryBrowse />
      <FeaturedMarketplace />
      <MarketplaceHowItWorks />
      <MarketplaceCTA />
    </Layout>
  );
}
