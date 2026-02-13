import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, ShoppingCart, Play, Star, Award, Clock, Package, Headphones, FileText, Video, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import DemoAccessCard from '@/components/cards/DemoAccessCard';
import ProductCard from '@/components/cards/ProductCard';
import FAQ from '@/components/sections/FAQ';
import ScreenshotGallery from '@/components/gallery/ScreenshotGallery';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'shop' | 'admin'>('shop');

  const { data: product, isLoading, error } = useProduct(slug);
  const { data: relatedProducts } = useRelatedProducts(product?.id, product?.category);

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
    return <Navigate to="/products" replace />;
  }

  const images = activeTab === 'shop' ? product.images.shop : product.images.admin;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[language],
    description: product.shortDescription[language],
    image: product.thumbnail,
    offers: {
      '@type': 'Offer',
      price: product.priceBDT,
      priceCurrency: 'BDT',
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Organization',
      name: language === 'bn' ? 'ইশপ মার্কেট' : 'eShop Market',
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
    { icon: Headphones, label: language === 'bn' ? '২৪/৭ সাপোর্ট' : '24/7 Support' },
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
        ogImage={product.thumbnail}
        ogType="product"
        structuredData={productSchema}
      />

      <article className="section-padding" itemScope itemType="https://schema.org/Product">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  {language === 'bn' ? 'হোম' : 'Home'}
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/products" className="hover:text-foreground transition-colors">
                  {t('nav.products')}
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium truncate max-w-[200px]">
                {product.name[language]}
              </li>
            </ol>
          </nav>

          {/* Back Button (Mobile) */}
          <Button asChild variant="ghost" size="sm" className="mb-4 md:hidden">
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'ফিরে যান' : 'Back'}
            </Link>
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
                images={images.length > 0 ? images : [product.thumbnail]}
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
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-primary" itemProp="price" content={String(product.priceBDT)}>
                    {t('common.bdt')}{product.priceBDT.toLocaleString()}
                  </span>
                  <meta itemProp="priceCurrency" content="BDT" />
                  <link itemProp="availability" href="https://schema.org/InStock" />
                  <span className="text-lg text-muted-foreground">
                    (~${product.priceUSD})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'এককালীন পেমেন্ট • আজীবন আপডেট' : 'One-time payment • Lifetime updates'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button asChild size="lg" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-14 text-base font-semibold">
                  <Link to={`/checkout?product=${product.slug}`}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('product.buyNow')}
                  </Link>
                </Button>
                {product.demo.length > 0 && (
                  <Button asChild variant="outline" size="lg" className="flex-1 h-14 text-base">
                    <a href={product.demo[0].url} target="_blank" rel="noopener noreferrer">
                      <Play className="w-5 h-5 mr-2" />
                      {t('product.viewDemo')}
                    </a>
                  </Button>
                )}
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
                <ul className="grid sm:grid-cols-2 gap-3">
                  {product.features[language].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Check className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Facilities */}
              <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                <h2 className="font-semibold text-xl mb-4">{t('product.facilities')}</h2>
                <ul className="space-y-3">
                  {product.facilities[language].map((facility, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium">{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Demo Access */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Play className="w-6 h-6 text-primary" />
              {language === 'bn' ? 'ডেমো অ্যাক্সেস' : 'Demo Access'}
            </h2>
            <DemoAccessCard demos={product.demo} />
          </section>

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
    </Layout>
  );
};

export default ProductDetailPage;
