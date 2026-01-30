import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';

const PrivacyPage: React.FC = () => {
  const { language } = useLanguage();

  const seoData = {
    bn: {
      title: 'গোপনীয়তা নীতি - ইশপ মার্কেট',
      description: 'ইশপ মার্কেটের গোপনীয়তা নীতি পড়ুন। আমরা কিভাবে আপনার তথ্য সংরক্ষণ ও ব্যবহার করি জানুন।',
    },
    en: {
      title: 'Privacy Policy - eShop Market',
      description: 'Read the privacy policy of eShop Market. Learn how we collect, store, and use your information.',
    },
  };

  const privacyContent = {
    bn: {
      title: 'গোপনীয়তা নীতি',
      lastUpdated: 'সর্বশেষ আপডেট: জানুয়ারি ২০২৫',
      sections: [
        {
          title: '১. তথ্য সংগ্রহ',
          content: 'আমরা অর্ডার প্রসেসিং এর জন্য আপনার নাম, ইমেইল, ফোন নম্বর সংগ্রহ করি। এই তথ্য শুধুমাত্র আপনার সেবা প্রদানের জন্য ব্যবহৃত হয়।',
        },
        {
          title: '২. তথ্য ব্যবহার',
          content: 'সংগৃহীত তথ্য অর্ডার প্রসেসিং, গ্রাহক সাপোর্ট ও সার্ভিস আপডেট জানাতে ব্যবহার করা হয়। আমরা তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি করি না।',
        },
        {
          title: '৩. তথ্য সুরক্ষা',
          content: 'আমরা আপনার তথ্য সুরক্ষিত রাখতে SSL এনক্রিপশন ও অন্যান্য নিরাপত্তা ব্যবস্থা ব্যবহার করি। পেমেন্ট তথ্য সরাসরি পেমেন্ট গেটওয়ে প্রসেস করে।',
        },
        {
          title: '৪. কুকিজ',
          content: 'আমাদের ওয়েবসাইট কুকিজ ব্যবহার করে ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে। আপনি ব্রাউজার সেটিংস থেকে কুকিজ নিয়ন্ত্রণ করতে পারেন।',
        },
        {
          title: '৫. তৃতীয় পক্ষ',
          content: 'পেমেন্ট প্রসেসিং এর জন্য আমরা তৃতীয় পক্ষের পেমেন্ট গেটওয়ে ব্যবহার করি। তাদের নিজস্ব গোপনীয়তা নীতি প্রযোজ্য।',
        },
        {
          title: '৬. যোগাযোগ',
          content: 'গোপনীয়তা সংক্রান্ত কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন: info@eshopmarket.com',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: January 2025',
      sections: [
        {
          title: '1. Information Collection',
          content: 'We collect your name, email, and phone number for order processing. This information is only used to provide you with our services.',
        },
        {
          title: '2. Information Usage',
          content: 'Collected information is used for order processing, customer support, and service updates. We do not sell your information to third parties.',
        },
        {
          title: '3. Data Security',
          content: 'We use SSL encryption and other security measures to protect your information. Payment information is processed directly by the payment gateway.',
        },
        {
          title: '4. Cookies',
          content: 'Our website uses cookies to improve user experience. You can control cookies from your browser settings.',
        },
        {
          title: '5. Third Parties',
          content: 'We use third-party payment gateways for payment processing. Their own privacy policies apply.',
        },
        {
          title: '6. Contact',
          content: 'For any privacy-related questions, contact us at: info@eshopmarket.com',
        },
      ],
    },
  };

  const content = privacyContent[language];

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

export default PrivacyPage;
