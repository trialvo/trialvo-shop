"use client";

import React, { useMemo, useState } from 'react';
import LocalizedLink from '@/components/i18n/LocalizedLink';
import { useParams } from 'next/navigation';
import Redirect from '@/components/Redirect';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, ShoppingCart, Play, Star, Award, Clock, Package, Headphones, FileText, Video, Loader2, ClipboardList } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import RequestTrialModal from '@/components/trial/RequestTrialModal';
import ProductCard from '@/components/cards/ProductCard';
import FAQ from '@/components/sections/FAQ';
import ScreenshotGallery from '@/components/gallery/ScreenshotGallery';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { usePublicTrialConfig } from '@/hooks/useTrialSettings';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { quoteProductPrice, shopDisplayPrice } from '@/lib/productPricing';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/data/products';

/** Public shop browse URL from deploy_config (trials still gate admin). */
function resolveShopDemoUrl(product: Product): string {
  const dc = product.deployConfig || {};
  const shopUrl = typeof dc.shared_demo_shop_url === 'string' ? dc.shared_demo_shop_url.trim() : '';
  return shopUrl;
}

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'shop' | 'admin'>('shop');
  const [trialOpen, setTrialOpen] = useState(false);

  const { data: product, isLoading, error } = useProduct(slug);
  const { data: relatedProducts } = useRelatedProducts(product?.id, product?.category);
  const { data: trialConfig } = usePublicTrialConfig();
  const canRequestTrial = Boolean(product?.isTrialable && trialConfig?.trialsEnabled !== false);

  const shopDemoUrl = useMemo(
    () => (product ? resolveShopDemoUrl(product) : ''),
    [product],
  );

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

  if (!product || error) {
    return <Redirect href="/products" />;
  }

  const images = activeTab === 'shop'
    ? (product.images?.shop || [])
    : (product.images?.admin || []);
  const galleryImages = (images.length > 0 ? images : [product.thumbnail])
    .map((u) => resolveMediaUrl(u))
    .filter(Boolean);

  const quote = quoteProductPrice(product);
  const display = shopDisplayPrice(quote, language, t('common.bdt'));
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[language],
    description: product.shortDescription[language],
    image: resolveMediaUrl(product.thumbnail),
    offers: {
      '@type': 'Offer',
      price: display.saleRaw,
      priceCurrency: display.currency,
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Organization',
      name: 'Trialvo Shop',
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
      {
        '@type': 'ListItem',
        position: 2,
        name: t('nav.products'),
        item: typeof window !== 'undefined' ? `${window.location.origin}/products` : '',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name[language],
      },
    ],
  };

  const highlights = [
    { icon: Headphones, label: language === 'bn' ? 'আজীবন সাপোর্ট' : 'Lifetime support' },
    { icon: FileText, label: language === 'bn' ? 'সম্পূর্ণ ডকুমেন্টেশন' : 'Full Documentation' },
    { icon: Package, label: language === 'bn' ? 'সোর্স কোড সহ' : 'Source Code Included' },
    { icon: Clock, label: language === 'bn' ? 'দ্রুত ডেলিভারি' : 'Fast Delivery' },
  ];

  return (
    <Layout>
      <SEOHead
        title={product.seo.title[language]}
        description={product.seo.description[language]}
        keywords={product.seo.keywords[language]}
        ogImage={resolveMediaUrl(product.thumbnail)}
        ogType="product"
        structuredData={productSchema}
      />

      <article className="section-padding" itemScope itemType="https://schema.org/Product">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <LocalizedLink href="/" className="hover:text-foreground transition-colors">
                  {language === 'bn' ? 'হোম' : 'Home'}
                </LocalizedLink>
              </li>
              <li>/</li>
              <li>
                <LocalizedLink href="/products" className="hover:text-foreground transition-colors">
                  {t('nav.products')}
                </LocalizedLink>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium truncate max-w-[200px]">
                {product.name[language]}
              </li>
            </ol>
          </nav>

          {/* Back Button (Mobile) */}
          <Button asChild variant="ghost" size="sm" className="mb-4 md:hidden">
            <LocalizedLink href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'ফিরে যান' : 'Back'}
            </LocalizedLink>
          </Button>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Screenshot Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'shop' | 'admin')} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="shop" className="gap-2">
                    <Package className="w-4 h-4" />
                    {t('product.screenshots.shop')}
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-2">
                    <FileText className="w-4 h-4" />
                    {t('product.screenshots.admin')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Gallery with arrows and modal */}
              <ScreenshotGallery
                images={galleryImages.length > 0 ? galleryImages : [resolveMediaUrl(product.thumbnail)].filter(Boolean)}
                title={product.name[language]}
              />
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Category Badge */}
              <Badge variant="secondary" className="mb-4">
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </Badge>

              <h1 className="text-3xl md:text-4xl font-bold mb-4" itemProp="name">
                {product.name[language]}
              </h1>

              {/* Rating Placeholder */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  (5.0) • {language === 'bn' ? '২০+ বিক্রি' : '20+ Sales'}
                </span>
              </div>

              <p className="text-muted-foreground text-lg mb-6" itemProp="description">
                {product.shortDescription[language]}
              </p>

              {/* Price */}
              <div className="bg-muted/50 rounded-xl p-6 mb-6" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  {quote.hasDiscount ? (
                    <>
                      <span className="text-2xl font-semibold text-muted-foreground line-through decoration-destructive decoration-2">
                        {display.list}
                      </span>
                      <span className="text-4xl font-bold text-primary" itemProp="price" content={String(display.saleRaw)}>
                        {display.sale}
                      </span>
                      <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-sm font-bold text-destructive">
                        -{quote.discountPercent}%
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-primary" itemProp="price" content={String(display.saleRaw)}>
                      {display.sale}
                    </span>
                  )}
                  <meta itemProp="priceCurrency" content={display.currency} />
                  <link itemProp="availability" href="https://schema.org/InStock" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'এককালীন পেমেন্ট • আজীবন সাপোর্ট ও আপডেট' : 'One-time payment • Lifetime support & updates'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button asChild size="lg" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-14 text-base font-semibold">
                  <LocalizedLink href={`/checkout?product=${product.slug}`}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('product.buyNow')}
                  </LocalizedLink>
                </Button>
                {canRequestTrial && (
                  <Button size="lg" variant="secondary" className="flex-1 h-14 text-base" onClick={() => setTrialOpen(true)}>
                    <ClipboardList className="w-5 h-5 mr-2" />
                    {language === 'bn' ? 'ট্রায়াল চাই' : 'Request Trial'}
                  </Button>
                )}
                {shopDemoUrl ? (
                  <Button asChild variant="outline" size="lg" className="flex-1 h-14 text-base">
                    <a href={shopDemoUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="w-5 h-5 mr-2" />
                      {language === 'bn' ? 'ডেমো শপ দেখুন' : 'Browse demo shop'}
                    </a>
                  </Button>
                ) : null}
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {highlights.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  {t('product.features')}
                </h2>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {(product.features?.[language] || []).map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:bg-muted/50"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-sm leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Facilities */}
              <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                <h2 className="mb-4 text-xl font-semibold">{t('product.facilities')}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {(product.facilities?.[language] || []).map((facility, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium leading-snug">{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Video Section */}
          {product.videoUrl && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                {t('product.introVideo')}
              </h2>
              <div className="aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                <iframe
                  src={product.videoUrl}
                  title={`${product.name[language]} - Introduction Video`}
                  className="w-full h-full"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </section>
          )}

          {/* FAQ */}
          {product.faq.length > 0 && (
            <section className="mt-12">
              <FAQ items={product.faq} title={t('product.faq')} />
            </section>
          )}

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-semibold mb-6">{t('product.related')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>

      {canRequestTrial && (
        <RequestTrialModal
          open={trialOpen}
          onOpenChange={setTrialOpen}
          productSlug={product.slug}
          productName={product.name[language]}
          supportsOption1={product.deployConfig?.supports_option1 !== false}
          supportsOption2={product.deployConfig?.supports_option2 !== false}
        />
      )}
    </Layout>
  );
};

export default ProductDetailPage;
