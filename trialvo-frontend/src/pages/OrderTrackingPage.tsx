import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle2, Truck, Clock, MapPin, XCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface OrderData {
 order: {
  order_id: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  total_bdt: number;
  payment_method: string;
  created_at: string;
  tracking_number?: string;
 };
 timeline: { to_status: string; created_at: string; comment?: string }[];
}

const statusSteps = [
 { key: 'pending', icon: Clock, label: { bn: 'পেন্ডিং', en: 'Pending' } },
 { key: 'confirmed', icon: CheckCircle2, label: { bn: 'কনফার্মড', en: 'Confirmed' } },
 { key: 'processing', icon: Package, label: { bn: 'প্রসেসিং', en: 'Processing' } },
 { key: 'shipped', icon: Truck, label: { bn: 'শিপড', en: 'Shipped' } },
 { key: 'delivered', icon: MapPin, label: { bn: 'ডেলিভার্ড', en: 'Delivered' } },
];

const OrderTrackingPage: React.FC = () => {
 const { language } = useLanguage();
 const [orderId, setOrderId] = useState('');
 const [phone, setPhone] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [orderData, setOrderData] = useState<OrderData | null>(null);

 const handleTrack = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!orderId.trim() || !phone.trim()) return;

  setLoading(true);
  setError('');
  setOrderData(null);

  try {
   const res = await fetch(`${API_BASE}/api/orders/track?order_id=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`);
   if (!res.ok) throw new Error('not_found');
   const data = await res.json();
   setOrderData(data);
  } catch {
   setError(language === 'bn' ? 'অর্ডার পাওয়া যায়নি। অর্ডার ID ও ফোন নম্বর চেক করুন।' : 'Order not found. Please check your Order ID and phone number.');
  } finally {
   setLoading(false);
  }
 };

 const currentStepIndex = orderData
  ? statusSteps.findIndex(s => s.key === orderData.order.status)
  : -1;

 const isCancelled = orderData?.order.status === 'cancelled';

 return (
  <Layout>
   <SEOHead
    title={language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
    description={language === 'bn' ? 'অর্ডার ID দিয়ে আপনার অর্ডার ট্র্যাক করুন' : 'Track your order using Order ID'}
   />

   <section className="section-padding">
    <div className="container-custom max-w-2xl">
     {/* Header */}
     <motion.div
      className="text-center mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
     >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
       <Truck className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
       {language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
      </h1>
      <p className="text-muted-foreground">
       {language === 'bn' ? 'আপনার অর্ডার ID ও ফোন নম্বর দিন' : 'Enter your Order ID and phone number'}
      </p>
     </motion.div>

     {/* Search Form */}
     <motion.form
      onSubmit={handleTrack}
      className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
     >
      <div className="grid sm:grid-cols-2 gap-4">
       <div>
        <label className="text-sm font-medium mb-1.5 block">
         {language === 'bn' ? 'অর্ডার ID' : 'Order ID'}
        </label>
        <Input
         value={orderId}
         onChange={(e) => setOrderId(e.target.value)}
         placeholder="e.g. ORD-240224-XXXX"
         className="bg-background"
         required
        />
       </div>
       <div>
        <label className="text-sm font-medium mb-1.5 block">
         {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
        </label>
        <Input
         value={phone}
         onChange={(e) => setPhone(e.target.value)}
         placeholder="01XXXXXXXXX"
         className="bg-background"
         required
        />
       </div>
      </div>
      <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading}>
       {loading ? (
        <span className="flex items-center gap-2">
         <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
         {language === 'bn' ? 'খুঁজছি...' : 'Searching...'}
        </span>
       ) : (
        <span className="flex items-center gap-2">
         <Search className="w-4 h-4" />
         {language === 'bn' ? 'ট্র্যাক করুন' : 'Track Order'}
        </span>
       )}
      </Button>
     </motion.form>

     {/* Error */}
     {error && (
      <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="bg-destructive/10 text-destructive rounded-xl p-4 mb-8 text-sm text-center flex items-center justify-center gap-2"
      >
       <XCircle className="w-4 h-4 flex-shrink-0" />
       {error}
      </motion.div>
     )}

     {/* Order Result */}
     {orderData && (
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="space-y-6"
      >
       {/* Order Info Card */}
       <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
         <h2 className="font-bold text-lg">{orderData.order.order_id}</h2>
         <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${isCancelled
           ? 'bg-red-500/10 text-red-600 border border-red-200'
           : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
          {orderData.order.status}
         </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
         <div>
          <p className="text-muted-foreground text-xs mb-0.5">{language === 'bn' ? 'গ্রাহক' : 'Customer'}</p>
          <p className="font-medium">{orderData.order.customer_name}</p>
         </div>
         <div>
          <p className="text-muted-foreground text-xs mb-0.5">{language === 'bn' ? 'মোট' : 'Total'}</p>
          <p className="font-bold text-primary">৳{Number(orderData.order.total_bdt).toLocaleString()}</p>
         </div>
         <div>
          <p className="text-muted-foreground text-xs mb-0.5">{language === 'bn' ? 'পেমেন্ট' : 'Payment'}</p>
          <p className="capitalize">{orderData.order.payment_method}</p>
         </div>
         <div>
          <p className="text-muted-foreground text-xs mb-0.5">{language === 'bn' ? 'তারিখ' : 'Date'}</p>
          <p>{new Date(orderData.order.created_at).toLocaleDateString()}</p>
         </div>
        </div>
       </div>

       {/* Progress Steps */}
       {!isCancelled && (
        <div className="bg-card border border-border rounded-2xl p-6">
         <h3 className="font-semibold mb-6">{language === 'bn' ? 'ডেলিভারি প্রগ্রেস' : 'Delivery Progress'}</h3>
         <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-border">
           <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
           />
          </div>

          {statusSteps.map((step, i) => {
           const isCompleted = i <= currentStepIndex;
           const isCurrent = i === currentStepIndex;
           return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
               ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
               : 'bg-muted text-muted-foreground'
              } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
              <step.icon className="w-4 h-4" />
             </div>
             <span className={`text-[10px] sm:text-xs mt-2 font-medium text-center ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.label[language]}
             </span>
            </div>
           );
          })}
         </div>
        </div>
       )}

       {/* Timeline */}
       {orderData.timeline && orderData.timeline.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
         <h3 className="font-semibold mb-4">{language === 'bn' ? 'টাইমলাইন' : 'Timeline'}</h3>
         <div className="space-y-4">
          {orderData.timeline.map((entry, i) => (
           <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
             <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
             {i < orderData.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-4">
             <p className="text-sm font-medium capitalize">{entry.to_status}</p>
             <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
             {entry.comment && <p className="text-xs text-muted-foreground/70 mt-0.5">{entry.comment}</p>}
            </div>
           </div>
          ))}
         </div>
        </div>
       )}
      </motion.div>
     )}
    </div>
   </section>
  </Layout>
 );
};

export default OrderTrackingPage;
