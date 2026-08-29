"use client";

import React from 'react';
import LocalizedLink from '@/components/i18n/LocalizedLink';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Download, FileText, Server, Home, Loader2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { useProduct } from '@/hooks/useProducts';
import { useOrder } from '@/hooks/useOrders';
import { quoteProductPrice, shopDisplayPrice } from '@/lib/productPricing';
import { Button } from '@/components/ui/button';

const OrderSuccessPage: React.FC = () => {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ORD-XXXXXX';
  const productSlug = searchParams.get('product');
  // Trialvo Pay appends these on redirect back
  const transactionId = searchParams.get('transaction_id');
  const billToken = searchParams.get('bill_token');

  const { data: product, isLoading } = useProduct(productSlug || undefined);
  const { data: order } = useOrder(orderId && orderId !== 'ORD-XXXXXX' ? orderId : null);
  const quote = product ? quoteProductPrice(product) : null;
  const display = quote ? shopDisplayPrice(quote, language, t('common.bdt')) : null;
  const paidBdt = order?.total_bdt != null
    ? Number(order.total_bdt)
    : quote?.saleBdt;

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
            <div className="inline-block bg-muted rounded-lg px-6 py-3 mb-4">
              <span className="text-sm text-muted-foreground">
                {t('orderSuccess.orderId')}:
              </span>
              <span className="ml-2 font-mono font-bold text-lg">{orderId}</span>
            </div>

            {/* Trialvo Pay Transaction Badge */}
            {transactionId && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 bg-success/10 border border-success/30 text-success rounded-full px-4 py-1.5 text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  {language === 'bn' ? 'পেমেন্ট নিশ্চিত হয়েছে' : 'Payment Confirmed'}
                  <span className="font-mono text-xs opacity-70">{transactionId.substring(0, 12)}...</span>
                </div>
              </div>
            )}

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
                      {quote?.hasDiscount && display ? (
                        <>
                          <span className="text-muted-foreground line-through font-semibold mr-2">
                            {display.list}
                          </span>
                          {paidBdt != null
                            ? `${t('common.bdt')}${paidBdt.toLocaleString()}`
                            : display.sale}
                        </>
                      ) : (
                        <>
                          {paidBdt != null
                            ? `${t('common.bdt')}${paidBdt.toLocaleString()}`
                            : (display?.sale ?? '')}
                        </>
                      )}
                    </p>
                    {display?.hasUsd ? (
                      <p className="text-[11px] font-normal text-muted-foreground">{display.usdSale}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <p className="text-muted-foreground mb-8">
              {t('orderSuccess.message')}
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8 text-left text-sm">
              <p className="font-medium mb-1">
                {language === 'bn' ? 'লাইসেন্স ও ডিপ্লয়মেন্ট প্যাক' : 'License & deployment pack'}
              </p>
              <p className="text-muted-foreground">
                {language === 'bn'
                  ? 'পেমেন্ট নিশ্চিত হলে আপনার ইমেইলে license key এবং একবার ব্যবহারযোগ্য Docker/cPanel ডাউনলোড লিংক যাবে। লিংক একবারই কাজ করে।'
                  : 'After payment confirms, check your email for the license key and one-time Docker/cPanel pack download links. Each link works once.'}
              </p>
            </div>

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
              <LocalizedLink href="/">
                <Home className="w-5 h-5 mr-2" />
                {t('orderSuccess.backHome')}
              </LocalizedLink>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderSuccessPage;
