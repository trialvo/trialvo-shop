import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Download, FileText, Server, Home, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { useProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';

const OrderSuccessPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ORD-XXXXXX';
  const productSlug = searchParams.get('product');

  const { data: product, isLoading } = useProduct(productSlug || undefined);

  const steps = [
    { icon: Mail, text: t('orderSuccess.step1') },
    { icon: Download, text: t('orderSuccess.step2') },
    { icon: FileText, text: t('orderSuccess.step3') },
    { icon: Server, text: t('orderSuccess.step4') },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-custom flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={t('orderSuccess.title')}
        description={t('orderSuccess.message')}
        noindex
      />

      <section className="section-padding">
        <div className="container-custom max-w-2xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Success Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('orderSuccess.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              {t('orderSuccess.thankYou')}
            </p>

            {/* Order ID */}
            <div className="inline-block bg-muted rounded-lg px-6 py-3 mb-8">
              <span className="text-sm text-muted-foreground">
                {t('orderSuccess.orderId')}:
              </span>
              <span className="ml-2 font-mono font-bold text-lg">{orderId}</span>
            </div>

            {/* Product Info */}
            {product && (
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src={product.thumbnail}
                    alt={product.name[language]}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div className="text-left">
                    <h3 className="font-semibold">{product.name[language]}</h3>
                    <p className="text-primary font-bold">
                      {t('common.bdt')}{product.priceBDT.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <p className="text-muted-foreground mb-8">
              {t('orderSuccess.message')}
            </p>

            {/* Next Steps */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left">
              <h2 className="font-semibold text-lg mb-4">
                {t('orderSuccess.instructions')}
              </h2>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span>{step.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to Home Button */}
            <Button asChild size="lg">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                {t('orderSuccess.backHome')}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderSuccessPage;
