import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Building2, Loader2, Tag, X } from 'lucide-react';
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
import { api } from '@/lib/api';

const paymentMethods = [
  { id: 'online', name: 'Online Payment', icon: CreditCard },
  { id: 'send_money', name: 'Send Money', icon: Smartphone },
  { id: 'manual', name: 'Manual / Inbox', icon: Building2 },
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
    paymentMethod: 'send_money',
  });

  const [paymentSettings, setPaymentSettings] = React.useState<{
    payment_method_send_money_active: boolean;
    payment_method_send_money_instructions: string;
    payment_method_online_active: boolean;
    payment_method_manual_inbox_active: boolean;
  } | null>(null);

  React.useEffect(() => {
    // Fetch public payment settings
    api.get<any>('/settings/features').then((res) => {
      setPaymentSettings(res);
      // Auto-select first available payment method
      if (res.payment_method_send_money_active) {
        setFormData(prev => ({ ...prev, paymentMethod: 'send_money' }));
      } else if (res.payment_method_online_active) {
        setFormData(prev => ({ ...prev, paymentMethod: 'online' }));
      } else if (res.payment_method_manual_inbox_active) {
        setFormData(prev => ({ ...prev, paymentMethod: 'manual' }));
      }
    }).catch(() => { });
  }, []);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; type: string; value: number } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

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
        totalBdt: product.priceBDT - discount,
        discountAmount: discount,
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
                    {paymentSettings && paymentMethods.map((method) => {
                      if (method.id === 'send_money' && !paymentSettings.payment_method_send_money_active) return null;
                      if (method.id === 'online' && !paymentSettings.payment_method_online_active) return null;
                      if (method.id === 'manual' && !paymentSettings.payment_method_manual_inbox_active) return null;

                      return (
                        <div key={method.id}>
                          <RadioGroupItem
                            value={method.id}
                            id={method.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={method.id}
                            className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted h-full"
                          >
                            <method.icon className="w-5 h-5 text-primary shrink-0" />
                            <span className="font-medium">{method.name}</span>
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>

                  {/* Send Money Instructions */}
                  {formData.paymentMethod === 'send_money' && paymentSettings?.payment_method_send_money_instructions && (
                    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-medium text-sm text-primary mb-2 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        {language === 'bn' ? 'সেন্ড মানি নির্দেশাবলী:' : 'Send Money Instructions:'}
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {paymentSettings.payment_method_send_money_instructions}
                      </p>
                    </div>
                  )}

                  {/* Offline Manual Instruction */}
                  {formData.paymentMethod === 'manual' && (
                    <div className="mt-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-sm text-orange-700/80">
                        {language === 'bn'
                          ? 'অর্ডার প্লেস করার পর, আমাদের টিম আপনার সাথে ম্যাসেজ বা কলে যোগাযোগ করে পেমেন্ট সম্পন্ন করবে।'
                          : 'After placing the order, our team will contact you via message or phone to arrange payment.'}
                      </p>
                    </div>
                  )}
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

                {/* Coupon Code */}
                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{language === 'bn' ? 'কুপন কোড' : 'Coupon Code'}</span>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-200 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-mono text-sm font-bold text-emerald-700">{appliedCoupon.code}</span>
                        <span className="text-xs text-emerald-600 ml-2">
                          {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% off` : `৳${appliedCoupon.value} off`}
                        </span>
                      </div>
                      <button onClick={() => { setAppliedCoupon(null); setDiscount(0); setCouponCode(''); }} className="text-emerald-600 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        placeholder="SAVE20"
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!couponCode || couponLoading}
                        onClick={async () => {
                          setCouponLoading(true);
                          setCouponError('');
                          try {
                            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                            const res = await fetch(`${API_BASE}/coupons/validate`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ code: couponCode, orderTotal: product.priceBDT }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            setAppliedCoupon(data.coupon);
                            setDiscount(data.discount);
                          } catch (err: any) {
                            setCouponError(err.message || 'Invalid coupon');
                          }
                          setCouponLoading(false);
                        }}
                        className="shrink-0"
                      >
                        {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
                </div>

                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">{language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
                    <span>{t('common.bdt')}{product.priceBDT.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center mb-2 text-emerald-600">
                      <span>{language === 'bn' ? 'ডিসকাউন্ট' : 'Discount'}</span>
                      <span>-{t('common.bdt')}{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{language === 'bn' ? 'মোট' : 'Total'}</span>
                    <span className="text-primary">
                      {t('common.bdt')}{(product.priceBDT - discount).toLocaleString()}
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
