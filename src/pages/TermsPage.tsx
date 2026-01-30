import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';

const TermsPage: React.FC = () => {
  const { language } = useLanguage();

  const seoData = {
    bn: {
      title: 'শর্তাবলী - ইশপ মার্কেট',
      description: 'ইশপ মার্কেটের সেবা ব্যবহারের শর্তাবলী পড়ুন। প্রোডাক্ট কেনার আগে শর্তাবলী জেনে নিন।',
    },
    en: {
      title: 'Terms & Conditions - eShop Market',
      description: 'Read the terms and conditions for using eShop Market services. Know the terms before purchasing.',
    },
  };

  const termsContent = {
    bn: {
      title: 'শর্তাবলী',
      lastUpdated: 'সর্বশেষ আপডেট: জানুয়ারি ২০২৫',
      sections: [
        {
          title: '১. সাধারণ শর্তাবলী',
          content: 'ইশপ মার্কেটের ওয়েবসাইট ব্যবহার করে আপনি এই শর্তাবলী মেনে নিচ্ছেন। আমাদের প্রোডাক্ট কেনার আগে অবশ্যই এই শর্তাবলী পড়ে নিন।',
        },
        {
          title: '২. প্রোডাক্ট ও সার্ভিস',
          content: 'আমরা রেডিমেড ইকমার্স ওয়েবসাইট সলিউশন বিক্রি করি। প্রতিটি প্রোডাক্টে এডমিন প্যানেল ও শপ ওয়েবসাইট অন্তর্ভুক্ত। প্রোডাক্ট কেনার পর সোর্স কোড সরবরাহ করা হয়।',
        },
        {
          title: '৩. মূল্য ও পেমেন্ট',
          content: 'সকল মূল্য বাংলাদেশি টাকায় (BDT) প্রদর্শিত। পেমেন্ট সম্পন্ন হওয়ার পর প্রোডাক্ট ডেলিভারি করা হয়। রিফান্ড পলিসি প্রযোজ্য শর্ত অনুযায়ী।',
        },
        {
          title: '৪. লাইসেন্স',
          content: 'প্রতিটি প্রোডাক্ট একটি ডোমেইনের জন্য লাইসেন্সড। সোর্স কোড পুনরায় বিক্রি করা যাবে না। ব্যক্তিগত বা বাণিজ্যিক প্রজেক্টে ব্যবহার করা যাবে।',
        },
        {
          title: '৫. সাপোর্ট',
          content: 'প্রোডাক্ট অনুযায়ী নির্দিষ্ট সময়ের জন্য ফ্রি সাপোর্ট দেওয়া হয়। সাপোর্ট সময় শেষ হওয়ার পর অতিরিক্ত সাপোর্ট আলাদা চার্জে পাওয়া যাবে।',
        },
        {
          title: '৬. দায়বদ্ধতা',
          content: 'প্রোডাক্ট ব্যবহারের ফলে কোনো ক্ষতি হলে ইশপ মার্কেট দায়ী থাকবে না। ব্যবহারকারী নিজ দায়িত্বে প্রোডাক্ট ব্যবহার করবেন।',
        },
      ],
    },
    en: {
      title: 'Terms & Conditions',
      lastUpdated: 'Last Updated: January 2025',
      sections: [
        {
          title: '1. General Terms',
          content: 'By using the eShop Market website, you agree to these terms. Please read these terms before purchasing any product.',
        },
        {
          title: '2. Products & Services',
          content: 'We sell ready-made ecommerce website solutions. Each product includes an admin panel and shop website. Source code is provided after purchase.',
        },
        {
          title: '3. Pricing & Payment',
          content: 'All prices are displayed in Bangladeshi Taka (BDT). Product delivery is made after payment is completed. Refund policy applies according to applicable terms.',
        },
        {
          title: '4. License',
          content: 'Each product is licensed for one domain. Source code cannot be resold. Can be used for personal or commercial projects.',
        },
        {
          title: '5. Support',
          content: 'Free support is provided for a specific period according to the product. Additional support is available at extra charge after the support period ends.',
        },
        {
          title: '6. Liability',
          content: 'eShop Market is not liable for any damage resulting from product use. Users use products at their own responsibility.',
        },
      ],
    },
  };

  const content = termsContent[language];

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
      />

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{content.title}</h1>
            <p className="text-muted-foreground mb-8">{content.lastUpdated}</p>

            <div className="prose prose-lg max-w-none">
              {content.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsPage;
