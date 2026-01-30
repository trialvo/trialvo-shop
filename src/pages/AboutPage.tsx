import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';

const AboutPage: React.FC = () => {
  const { language, t } = useLanguage();

  const seoData = {
    bn: {
      title: 'আমাদের সম্পর্কে - ইশপ মার্কেট',
      description: 'ইশপ মার্কেট বাংলাদেশের সেরা রেডিমেড ইকমার্স সলিউশন প্রোভাইডার। আমাদের মিশন, ভিশন ও লক্ষ্য জানুন।',
      keywords: ['আমাদের সম্পর্কে', 'ইশপ মার্কেট', 'ইকমার্স কোম্পানি বাংলাদেশ'],
    },
    en: {
      title: 'About Us - eShop Market',
      description: 'eShop Market is the best ready-made ecommerce solution provider in Bangladesh. Learn about our mission, vision, and goals.',
      keywords: ['about us', 'eShop Market', 'ecommerce company Bangladesh'],
    },
  };

  const values = [
    {
      icon: Target,
      title: language === 'bn' ? 'মিশন' : 'Mission',
      description: t('about.mission.description'),
    },
    {
      icon: Eye,
      title: language === 'bn' ? 'ভিশন' : 'Vision',
      description: t('about.vision.description'),
    },
    {
      icon: Users,
      title: language === 'bn' ? 'গ্রাহক সেবা' : 'Customer Service',
      description:
        language === 'bn'
          ? 'আমাদের গ্রাহকদের সন্তুষ্টি আমাদের প্রথম অগ্রাধিকার। ২৪/৭ সাপোর্ট দিয়ে থাকি।'
          : 'Customer satisfaction is our first priority. We provide 24/7 support.',
    },
    {
      icon: Award,
      title: language === 'bn' ? 'মান নিয়ন্ত্রণ' : 'Quality Assurance',
      description:
        language === 'bn'
          ? 'প্রতিটি প্রোডাক্ট পরীক্ষিত ও নির্ভরযোগ্য। আমরা মানের সাথে আপস করি না।'
          : 'Every product is tested and reliable. We never compromise on quality.',
    },
  ];

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
        keywords={seoData[language].keywords}
      />

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="container-custom text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t('about.title')}
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {t('footer.description')}
          </motion.p>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="bg-card border border-border rounded-xl p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-3">{value.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+', label: language === 'bn' ? 'প্রোডাক্ট' : 'Products' },
              { value: '500+', label: language === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Happy Customers' },
              { value: '24/7', label: language === 'bn' ? 'সাপোর্ট' : 'Support' },
              { value: '5+', label: language === 'bn' ? 'বছরের অভিজ্ঞতা' : 'Years Experience' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
