"use client";

import React, { useRef } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import LocalizedLink from '@/components/i18n/LocalizedLink';
import Layout from '@/components/layout/Layout';
import Redirect from '@/components/Redirect';
import { useTrialLaunch } from '@/components/trial/TrialLaunchProvider';
import {
  ProductDetailBreadcrumb,
  ProductDetailBuyCard,
  ProductDetailDemoPanel,
  ProductDetailFaq,
  ProductDetailGallery,
  ProductDetailHighlights,
  ProductDetailIntro,
  ProductDetailRelated,
  ProductDetailSpecs,
  ProductDetailStickyBar,
  ProductDetailTrialPaths,
  ProductDetailVideo,
} from '@/components/product-detail';
import { Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { productSupportsDemo, productSupportsDomainTrial } from '@/lib/trial/types';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const buyCardRef = useRef<HTMLDivElement>(null);

  const { data: product, isLoading, error } = useProduct(slug);
  const { data: relatedProducts = [] } = useRelatedProducts(
    product?.id,
    product?.category,
  );

  // The trial dialogs live in TrialLaunchProvider (mounted once in app
  // providers); this page only decides which CTAs to show and opens them.
  const trial = useTrialLaunch();
  const canDemo = Boolean(product && trial.demoAvailable && productSupportsDemo(product));
  const canDomainTrial = Boolean(
    product && trial.domainAvailable && productSupportsDomainTrial(product),
  );
  const openDemo = () => product && trial.openDemo({ product });
  const openDomain = () => product && trial.openDomain({ product });

  if (isLoading) {
    return (
      <Layout>
        <Section size="lg">
          <div className="flex justify-center py-20" role="status" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <span className="sr-only">
              {language === 'bn' ? 'লোড হচ্ছে' : 'Loading'}
            </span>
          </div>
        </Section>
      </Layout>
    );
  }

  if (!product || error) {
    return <Redirect href="/products" />;
  }

  const title = product.name[language] || product.name.en;
  const features = product.features?.[language] || product.features?.en || [];
  const facilities = product.facilities?.[language] || product.facilities?.en || [];

  return (
    <Layout>
      <article itemScope itemType="https://schema.org/Product">
        {/*
          The gallery is pinned while the right column scrolls, so screenshots
          stay visible next to the price, demo links and full spec list.
          `clip={false}` is required — an overflow ancestor would cancel sticky.
        */}
        <Section
          labelledBy="product-title"
          tone="muted"
          pattern="mesh"
          size="sm"
          divider="bottom"
          clip={false}
        >
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 lg:hidden">
            <LocalizedLink href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'bn' ? 'ফিরে যান' : 'Back'}
            </LocalizedLink>
          </Button>

          <ProductDetailBreadcrumb
            title={title}
            productsLabel={t('nav.products')}
            language={language}
          />

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
            <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-1">
              <ProductDetailIntro product={product} language={language} />
            </div>

            <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
              <ProductDetailGallery
                product={product}
                language={language}
                shopLabel={t('product.screenshots.shop')}
                adminLabel={t('product.screenshots.admin')}
              />
            </div>

            <div className="min-w-0 space-y-6 lg:col-span-5 lg:col-start-8 lg:row-start-2">
              <div ref={buyCardRef}>
                <ProductDetailBuyCard
                  product={product}
                  language={language}
                  currencyLabel={t('common.bdt')}
                  buyLabel={t('product.buyNow')}
                  canDemo={canDemo}
                  canDomainTrial={canDomainTrial}
                  domainMonths={trial.config.domainMonths}
                  onStartDemo={openDemo}
                  onStartDomainTrial={openDomain}
                />
              </div>

              <ProductDetailTrialPaths product={product} language={language} />

              <ProductDetailDemoPanel
                product={product}
                language={language}
                canRequestTrial={canDemo}
                onStartTrial={openDemo}
              />

              <ProductDetailHighlights language={language} />

              <ProductDetailSpecs
                id="product-features-title"
                eyebrow={language === 'bn' ? 'ফিচার' : 'Features'}
                title={t('product.features')}
                items={features}
              />

              <ProductDetailSpecs
                id="product-facilities-title"
                eyebrow={language === 'bn' ? 'সুবিধা' : 'Included'}
                title={t('product.facilities')}
                items={facilities}
              />
            </div>
          </div>
        </Section>

        {product.videoUrl ? (
          <ProductDetailVideo
            videoUrl={product.videoUrl}
            title={`${title} — ${t('product.introVideo')}`}
            posterUrl={resolveMediaUrl(product.thumbnail) || undefined}
            language={language}
          />
        ) : null}

        <ProductDetailFaq
          items={product.faq || []}
          language={language}
          title={t('product.faq')}
        />

        <ProductDetailRelated
          products={relatedProducts}
          language={language}
          title={t('product.related')}
        />
      </article>

      <ProductDetailStickyBar
        product={product}
        language={language}
        currencyLabel={t('common.bdt')}
        buyLabel={t('product.buyNow')}
        canRequestTrial={canDemo}
        onStartTrial={openDemo}
        watch={buyCardRef}
      />
    </Layout>
  );
};

export default ProductDetailPage;
