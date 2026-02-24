import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const NewsletterSection: React.FC = () => {
 const { language } = useLanguage();
 const [email, setEmail] = React.useState('');
 const [status, setStatus] = React.useState<'idle' | 'success'>('idle');

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!email) return;
  // Simulate subscribe
  setStatus('success');
  setEmail('');
  setTimeout(() => setStatus('idle'), 4000);
 };

 return (
  <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
   {/* Decorative elements */}
   <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
   <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

   <div className="container-custom relative z-10">
    <motion.div
     className="max-w-2xl mx-auto text-center"
     initial={{ opacity: 0, y: 30 }}
     whileInView={{ opacity: 1, y: 0 }}
     viewport={{ once: true }}
     transition={{ duration: 0.6 }}
    >
     {/* Icon */}
     <motion.div
      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
      whileHover={{ scale: 1.1, rotate: 5 }}
     >
      <Mail className="w-8 h-8 text-primary" />
     </motion.div>

     <h2 className="text-3xl md:text-4xl font-bold mb-4">
      {language === 'bn'
       ? 'আমাদের নিউজলেটারে সাবস্ক্রাইব করুন'
       : 'Subscribe to Our Newsletter'}
     </h2>
     <p className="text-muted-foreground text-lg mb-8">
      {language === 'bn'
       ? 'নতুন প্রোডাক্ট, স্পেশাল অফার ও ডিসকাউন্ট পেতে সাবস্ক্রাইব করুন'
       : 'Get notified about new products, special offers & exclusive deals'}
     </p>

     {/* Form */}
     <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="relative flex-1">
       <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
       <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={language === 'bn' ? 'আপনার ইমেইল লিখুন' : 'Enter your email'}
        className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        required
       />
      </div>
      <Button
       type="submit"
       size="lg"
       className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
      >
       {status === 'success' ? (
        <>
         <Sparkles className="w-4 h-4 mr-2" />
         {language === 'bn' ? 'সাবস্ক্রাইব হয়েছে!' : 'Subscribed!'}
        </>
       ) : (
        <>
         {language === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
         <ArrowRight className="w-4 h-4 ml-2" />
        </>
       )}
      </Button>
     </form>

     {/* Privacy note */}
     <p className="text-xs text-muted-foreground/70 mt-4">
      {language === 'bn'
       ? '🔒 আমরা আপনার ইমেইল কখনো শেয়ার করবো না'
       : '🔒 We never share your email with anyone'}
     </p>
    </motion.div>
   </div>
  </section>
 );
};

export default NewsletterSection;
