import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import HeroSection from '@/components/sections/HeroSection';
import GoalSection from '@/components/sections/GoalSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import HowItWorks from '@/components/sections/HowItWorks';
import TrustSection from '@/components/sections/TrustSection';

const HomePage: React.FC = () => {
  const { language } = useLanguage();

  const seoData = {
    bn: {
      title: 'রেডিমেড ইকমার্স ওয়েবসাইট - এডমিন প্যানেল সহ',
      description: 'বাংলাদেশের সেরা রেডিমেড ইকমার্স সলিউশন। এডমিন প্যানেল + শপ ওয়েবসাইট একসাথে কিনুন। ফ্যাশন, গিফট, টেক - সব ক্যাটাগরির জন্য।',
      keywords: ['রেডিমেড ইকমার্স ওয়েবসাইট', 'ইকমার্স ওয়েবসাইট কিনুন', 'এডমিন প্যানেল সহ ইকমার্স', 'বাংলাদেশ ইকমার্স সলিউশন'],
    },
    en: {
      title: 'Ready-Made Ecommerce Website - With Admin Panel',
      description: 'Best ready-made ecommerce solutions in Bangladesh. Buy Admin Panel + Shop Website together. Available for fashion, gift, tech, and more categories.',
      keywords: ['ready-made ecommerce website', 'buy ecommerce website', 'ecommerce admin panel', 'Bangladesh ecommerce solution'],
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: language === 'bn' ? 'হোম' : 'Home',
        item: typeof window !== 'undefined' ? window.location.origin : '',
      },
    ],
  };

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
        keywords={seoData[language].keywords}
        structuredData={breadcrumbSchema}
      />
      
      <HeroSection />
      <GoalSection />
      <CategoriesSection />
      <FeaturedProducts />
      <HowItWorks />
      <TrustSection />
    </Layout>
  );
};

export default HomePage;
