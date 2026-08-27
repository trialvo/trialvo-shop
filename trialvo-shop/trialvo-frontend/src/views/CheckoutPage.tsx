"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Loader2, CreditCard, AlertTriangle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { useProduct } from '@/hooks/useProducts';
import { useCreateOrder } from '@/hooks/useOrders';
import { usePublicTrialConfig } from '@/hooks/useTrialSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { quoteProductPrice } from '@/lib/productPricing';

const CheckoutPage: React.FC = () => {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const productSlug = searchParams.get('product');
  const trialInstanceId = searchParams.get('trialInstance') || undefined;
  const isExtend = searchParams.get('extend') === '1';

  const { data: product, isLoading: productLoading } = useProduct(
    !isExtend || productSlug ? (productSlug || undefined) : undefined,
  );
  const { data: trialConfig, isLoading: configLoading } = usePublicTrialConfig();
  const createOrder = useCreateOrder();

  const errorParam = searchParams.get('error');
  const [showError, setShowError] = useState(!!errorParam);

  const [formData, setFormData] = useState({
    name: searchParams.get('name') || '',
    email: searchParams.get('email') || '',
    phone: '',
    company: '',
    needsHosting: false,
    notes: '',
  });
  const [redirecting, setRedirecting] = useState(false);

  const loading = isExtend ? configLoading : productLoading;
  const extendDays = trialConfig?.extendDays ?? 30;
  const extendPriceBdt = trialConfig?.extendPriceBdt ?? 1500;
  const extendPriceUsd = trialConfig?.extendPriceUsd ?? 15;

  if (loading) {
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

  if (isExtend && !trialInstanceId) {
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'bn' ? 'ট্রায়াল এক্সটেন্ড লিংক অবৈধ' : 'Invalid extend link'}
          </h1>
          <Button asChild><Link href="/products">{t('nav.products')}</Link></Button>
        </div>
      </Layout>
    );
  }

  if (!isExtend && !product) {
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'bn' ? 'প্রোডাক্ট পাওয়া যায়নি' : 'Product not found'}
          </h1>
          <Button asChild><Link href="/products">{t('nav.products')}</Link></Button>
        </div>
      </Layout>
    );
  }

  const displayName = isExtend
    ? (language === 'bn'
      ? `ট্রায়াল এক্সটেন্ড (+${extendDays} দিন)`
      : `Trial extend (+${extendDays} days)`)
    : (product!.name[language] || product!.name.en);

  const productQuote = product
    ? quoteProductPrice(product)
    : null;
  const priceBdt = isExtend ? extendPriceBdt : (productQuote?.saleBdt ?? 0);
  const priceUsd = isExtend ? extendPriceUsd : (productQuote?.saleUsd ?? 0);
  const listBdt = isExtend ? extendPriceBdt : (productQuote?.listBdt ?? 0);
  const showProductDiscount = !isExtend && Boolean(productQuote?.hasDiscount);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedirecting(true);

    try {
      const order = await createOrder.mutateAsync({
        ...(isExtend
          ? {
              orderKind: 'trial_extend' as const,
              trialInstanceId,
              productId: product?.id,
              productName: displayName,
            }
          : {
              orderKind: 'product' as const,
              productId: product!.id,
              productName: product!.name[language],
              trialInstanceId: trialInstanceId || undefined,
            }),
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        company: formData.company,
        needsHosting: isExtend ? false : formData.needsHosting,
        notes: formData.notes,
        paymentMethod: 'trialvo_pay',
      });

      if (order.pay_url) {
        toast.success(
          language === 'bn' ? 'পেমেন্ট পেজে পাঠানো হচ্ছে...' : 'Redirecting to payment page...',
        );
        setTimeout(() => {
          window.location.href = order.pay_url!;
        }, 800);
      } else {
        toast.error(
          language === 'bn'
            ? 'পেমেন্ট সিস্টেমে সংযোগ করা যায়নি। পরে আবার চেষ্টা করুন।'
            : 'Could not connect to payment system. Try again shortly.',
        );
        setRedirecting(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      toast.error(
        message || (language === 'bn'
          ? 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to submit order. Please try again.'),
      );
      setRedirecting(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title={isExtend
          ? (language === 'bn' ? 'ট্রায়াল এক্সটেন্ড' : 'Extend trial')
          : (language === 'bn' ? 'চেকআউট - অর্ডার সম্পন্ন করুন' : 'Checkout - Complete Your Order')}
        description={isExtend
          ? 'Pay to extend your trial period'
          : 'Complete checkout to purchase your selected ecommerce solution.'}
        noindex
      />

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link href={productSlug ? `/products/${productSlug}` : '/products'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'ফিরে যান' : 'Back'}
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-8">
            {isExtend
              ? (language === 'bn' ? 'ট্রায়াল এক্সটেন্ড' : 'Extend your trial')
              : t('checkout.title')}
          </h1>

          {isExtend ? (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-1">
              <p className="font-medium">
                {language === 'bn'
                  ? `পেমেন্ট সফল হলে ট্রায়ালে +${extendDays} দিন যোগ হবে।`
                  : `Successful payment adds +${extendDays} days to this trial.`}
              </p>
              <p className="text-muted-foreground text-xs">
                {language === 'bn'
                  ? 'এটি প্রোডাক্ট কেনা নয় — শুধুমাত্র ট্রায়াল মেয়াদ বাড়ানো। একই ইমেইল ব্যবহার করুন।'
                  : 'This is not a full product purchase — only a trial time extension. Use the same email as your trial.'}
              </p>
            </div>
          ) : trialInstanceId ? (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              {language === 'bn'
                ? 'এই কেনা ট্রায়ালের সাথে লিঙ্ক থাকবে। পেমেন্ট সফল হলে ট্রায়াল কনভার্ট/সক্রিয় হবে।'
                : 'This purchase links to your trial. On payment success the trial will convert/activate.'}
            </div>
          ) : null}

          {showError && errorParam && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-xl border p-4 ${
                errorParam === 'payment_cancelled'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1.5 ${
                  errorParam === 'payment_cancelled'
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {errorParam === 'payment_cancelled'
                    ? <XCircle className="w-5 h-5" />
                    : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    errorParam === 'payment_cancelled' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {errorParam === 'payment_cancelled'
                      ? (language === 'bn' ? 'পেমেন্ট বাতিল' : 'Payment Cancelled')
                      : (language === 'bn' ? 'পেমেন্ট ব্যর্থ' : 'Payment Failed')}
                  </h3>
                </div>
                <button type="button" onClick={() => setShowError(false)} className="text-muted-foreground">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6 border rounded-xl p-6 bg-card">
                <h2 className="font-semibold">{t('checkout.customerInfo')}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t('checkout.name')} *</Label>
                    <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t('checkout.email')} *</Label>
                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t('checkout.phone')} *</Label>
                    <Input id="phone" name="phone" required placeholder="+880…" value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">{t('checkout.company')}</Label>
                    <Input id="company" name="company" value={formData.company} onChange={handleInputChange} />
                  </div>
                </div>

                {!isExtend && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="needsHosting"
                      checked={formData.needsHosting}
                      onCheckedChange={(v) => setFormData((p) => ({ ...p, needsHosting: !!v }))}
                    />
                    <Label htmlFor="needsHosting">{t('checkout.hosting')}</Label>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="notes">{t('checkout.notes')}</Label>
                  <Textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} />
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <CreditCard className="w-4 h-4" />
                    Secure Payment Gateway
                  </div>
                  <p className="text-xs text-muted-foreground">Trialvo Pay — bKash, Nagad, Card & more</p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={redirecting || createOrder.isPending}>
                  {(redirecting || createOrder.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {redirecting
                    ? t('checkout.processing')
                    : (isExtend
                      ? (language === 'bn' ? 'এক্সটেন্ড পেমেন্ট' : 'Pay to extend')
                      : (language === 'bn' ? 'পেমেন্টে যান' : 'Proceed to Payment'))}
                </Button>
              </form>
            </div>

            <aside className="border rounded-xl p-6 bg-card h-fit space-y-4">
              <h2 className="font-semibold">{t('checkout.orderSummary')}</h2>
              <div>
                <p className="font-medium">{displayName}</p>
                {isExtend && product && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.name[language] || product.name.en}
                  </p>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'bn' ? 'মূল্য' : 'Price'}</span>
                {showProductDiscount ? (
                  <span>
                    <span className="line-through text-muted-foreground mr-2">৳{Number(listBdt).toLocaleString()}</span>
                    ৳{Number(priceBdt).toLocaleString()}
                  </span>
                ) : (
                  <span>৳{Number(priceBdt).toLocaleString()} (~${priceUsd})</span>
                )}
              </div>
              {showProductDiscount && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>{language === 'bn' ? `ছাড় (${productQuote!.discountPercent}%)` : `Discount (${productQuote!.discountPercent}%)`}</span>
                  <span>-৳{Number(productQuote!.discountBdt).toLocaleString()}</span>
                </div>
              )}
              {isExtend && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{language === 'bn' ? 'যোগ হবে' : 'Adds'}</span>
                  <span>+{extendDays} {language === 'bn' ? 'দিন' : 'days'}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>{language === 'bn' ? 'মোট' : 'Total'}</span>
                <span>৳{Number(priceBdt).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure checkout
              </p>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CheckoutPage;
