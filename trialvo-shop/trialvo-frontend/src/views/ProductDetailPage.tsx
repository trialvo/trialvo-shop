"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import LocalizedLink from '@/components/i18n/LocalizedLink';
import Layout from '@/components/layout/Layout';
import Redirect from '@/components/Redirect';
import RequestTrialModal from '@/components/trial/RequestTrialModal';
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
  ProductDetailVideo,
} from '@/components/product-detail';
import { Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { usePublicTrialConfig } from '@/hooks/useTrialSettings';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [trialOpen, setTrialOpen] = useState(false);

  const { data: product, isLoading, error } = useProduct(slug);
  const { data: relatedProducts = [] } = useRelatedProducts(
    product?.id,
    product?.category,
  );
  const { data: trialConfig } = usePublicTrialConfig();
  const canRequestTrial = Boolean(
    product?.isTrialable && trialConfig?.trialsEnabled !== false,
  );

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

          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
            <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
              <ProductDetailIntro product={product} language={language} />
            </div>

            <div className="lg:sticky lg:top-24 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
              <ProductDetailGallery
                product={product}
                language={language}
                shopLabel={t('product.screenshots.shop')}
                adminLabel={t('product.screenshots.admin')}
              />
            </div>

            <div className="space-y-6 lg:col-span-5 lg:col-start-8 lg:row-start-2">
              <ProductDetailBuyCard
                product={product}
                language={language}
                currencyLabel={t('common.bdt')}
                buyLabel={t('product.buyNow')}
                canRequestTrial={canRequestTrial}
                onStartTrial={() => setTrialOpen(true)}
              />

              <ProductDetailDemoPanel
                product={product}
                language={language}
                canRequestTrial={canRequestTrial}
                onStartTrial={() => setTrialOpen(true)}
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

      {canRequestTrial ? (
        <RequestTrialModal
          open={trialOpen}
          onOpenChange={setTrialOpen}
          productSlug={product.slug}
          productName={title}
          supportsOption1={product.deployConfig?.supports_option1 !== false}
          supportsOption2={product.deployConfig?.supports_option2 !== false}
        />
      ) : null}
    </Layout>
  );
};

export default ProductDetailPage;
