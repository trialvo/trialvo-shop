import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { useProduct } from '@/hooks/useProducts';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const paymentMethods = [
  { id: 'sslcommerz', name: 'SSLCommerz', icon: CreditCard },
  { id: 'bkash', name: 'bKash', icon: Smartphone },
  { id: 'nagad', name: 'Nagad', icon: Smartphone },
  { id: 'aamarpay', name: 'aamarPay', icon: Building2 },
];

const CheckoutPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { data: product, isLoading: productLoading } = useProduct(productSlug || undefined);
  const createOrder = useCreateOrder();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    needsHosting: false,
    notes: '',
    paymentMethod: 'bkash',
  });

  if (productLoading) {
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

  if (!product) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-custom text-center">
            <h1 className="text-2xl font-bold mb-4">
              {language === 'bn' ? 'প্রোডাক্ট পাওয়া যায়নি' : 'Product not found'}
            </h1>
            <Button asChild>
              <Link to="/products">{t('nav.products')}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const order = await createOrder.mutateAsync({
        productId: product.id,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        company: formData.company,
        needsHosting: formData.needsHosting,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        totalBdt: product.priceBDT,
      });

      navigate(`/order-success?orderId=${order.order_id}&product=${product.slug}`);
    } catch (err) {
      toast.error(
        language === 'bn'
          ? 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to submit order. Please try again.'
      );
    }
  };

  const seoData = {
    bn: {
      title: 'চেকআউট - অর্ডার সম্পন্ন করুন',
      description: 'আপনার পছন্দের ইকমার্স সলিউশন কিনতে চেকআউট সম্পন্ন করুন।',
    },
    en: {
      title: 'Checkout - Complete Your Order',
      description: 'Complete checkout to purchase your selected ecommerce solution.',
    },
  };

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
        noindex
      />

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          {/* Back Button */}
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to={`/products/${product.slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'প্রোডাক্টে ফিরুন' : 'Back to product'}
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-8">{t('checkout.title')}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="font-semibold text-xl mb-4">
                    {t('checkout.customerInfo')}
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('checkout.name')} *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={language === 'bn' ? 'আপনার নাম' : 'Your name'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('checkout.email')} *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('checkout.phone')} *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+880 1XXX-XXXXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">{t('checkout.company')}</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder={language === 'bn' ? 'কোম্পানির নাম' : 'Company name'}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Checkbox
                      id="needsHosting"
                      checked={formData.needsHosting}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          needsHosting: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="needsHosting" className="text-sm cursor-pointer">
                      {t('checkout.hosting')}
                    </Label>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="notes">{t('checkout.notes')}</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder={
                        language === 'bn'
                          ? 'কোনো বিশেষ অনুরোধ থাকলে লিখুন...'
                          : 'Any special requests...'
                      }
                      rows={3}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="font-semibold text-xl mb-4">
                    {t('checkout.paymentMethod')}
                  </h2>

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, paymentMethod: value }))
                    }
                    className="grid sm:grid-cols-2 gap-3"
                  >
                    {paymentMethods.map((method) => (
                      <div key={method.id}>
                        <RadioGroupItem
                          value={method.id}
                          id={method.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={method.id}
                          className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted"
                        >
                          <method.icon className="w-5 h-5 text-primary" />
                          <span className="font-medium">{method.name}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('checkout.processing')}
                    </>
                  ) : (
                    t('checkout.placeOrder')
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-semibold text-xl mb-4">
                  {t('checkout.orderSummary')}
                </h2>

                <div className="flex gap-4 mb-4">
                  <img
                    src={product.thumbnail}
                    alt={product.name[language]}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium line-clamp-2">
                      {product.name[language]}
                    </h3>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">
                      {t('product.price')}
                    </span>
                    <span className="font-semibold">
                      {t('common.bdt')}{product.priceBDT.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>USD</span>
                    <span>~${product.priceUSD}</span>
                  </div>
                </div>

                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{language === 'bn' ? 'মোট' : 'Total'}</span>
                    <span className="text-primary">
                      {t('common.bdt')}{product.priceBDT.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CheckoutPage;
