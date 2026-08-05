import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <SEOHead
        title={language === 'bn' ? 'পেজ পাওয়া যায়নি' : 'Page Not Found'}
        description={language === 'bn' ? 'ওহ! আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।' : 'Oops! The page you are looking for was not found.'}
        noindex={true}
      />

      <section className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

        <div className="container-custom relative z-10">
          <div className="max-w-lg mx-auto text-center">
            {/* 404 Number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="text-[8rem] md:text-[10rem] font-bold leading-none text-gradient mb-4"
            >
              404
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold mb-4"
            >
              {language === 'bn' ? 'পেজ পাওয়া যায়নি!' : 'Page Not Found!'}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg mb-8"
            >
              {language === 'bn'
                ? 'ওহ! আপনি যে পেজটি খুঁজছেন তা মুছে ফেলা হয়েছে বা সরিয়ে নেওয়া হয়েছে।'
                : 'Oops! The page you are looking for has been deleted or moved.'}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'হোমপেজে যান' : 'Go to Homepage'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl" onClick={() => window.history.back()}>
                <span className="cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'পিছনে যান' : 'Go Back'}
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
