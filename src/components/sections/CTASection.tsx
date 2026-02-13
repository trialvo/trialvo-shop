import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const CTASection: React.FC = () => {
 const { language, t } = useLanguage();

 return (
  <section className="relative overflow-hidden py-20 md:py-28">
   {/* Background */}
   <div className="absolute inset-0 hero-gradient" />

   {/* Decorative Elements */}
   <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
   </div>

   <div className="container-custom relative z-10">
    <motion.div
     className="max-w-3xl mx-auto text-center"
     initial={{ opacity: 0, y: 30 }}
     whileInView={{ opacity: 1, y: 0 }}
     viewport={{ once: true }}
     transition={{ duration: 0.6 }}
    >
     {/* Badge */}
     <motion.span
      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white/90 mb-6 border border-white/10"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
     >
      <Sparkles className="w-4 h-4 text-accent" />
      {language === 'bn' ? 'আজই শুরু করুন' : 'Get Started Today'}
     </motion.span>

     {/* Title */}
     <motion.h2
      className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
     >
      {language === 'bn' ? (
       <>
        আপনার <span className="text-gradient">ইকমার্স ব্যবসা</span> শুরু করুন আজই
       </>
      ) : (
       <>
        Start Your <span className="text-gradient">Ecommerce Business</span> Today
       </>
      )}
     </motion.h2>

     {/* Description */}
     <motion.p
      className="text-lg md:text-xl text-white/75 mb-10 max-w-2xl mx-auto leading-relaxed"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 }}
     >
      {language === 'bn'
       ? 'রেডিমেড ইকমার্স সলিউশনে বিনিয়োগ করুন এবং মিনিটের মধ্যে আপনার অনলাইন স্টোর চালু করুন। সম্পূর্ণ সোর্স কোড ও সাপোর্ট সহ।'
       : 'Invest in a ready-made ecommerce solution and launch your online store in minutes. Complete source code and support included.'}
     </motion.p>

     {/* CTA Buttons */}
     <motion.div
      className="flex flex-col sm:flex-row gap-4 justify-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5 }}
     >
      <Button
       asChild
       size="lg"
       className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-14 px-10 text-base shadow-lg shadow-accent/25 rounded-xl"
      >
       <Link to="/products">
        {t('hero.cta.products')}
        <ArrowRight className="ml-2 w-5 h-5" />
       </Link>
      </Button>
      <Button
       asChild
       variant="outline"
       size="lg"
       className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white h-14 px-10 text-base rounded-xl"
      >
       <Link to="/contact">
        <Phone className="mr-2 w-5 h-5" />
        {t('hero.cta.contact')}
       </Link>
      </Button>
     </motion.div>

     {/* Trust line */}
     <motion.p
      className="mt-8 text-sm text-white/50"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.7 }}
     >
      {language === 'bn'
       ? '✓ সম্পূর্ণ সোর্স কোড  •  ✓ ফ্রি সাপোর্ট  •  ✓ লাইফটাইম আপডেট'
       : '✓ Full Source Code  •  ✓ Free Support  •  ✓ Lifetime Updates'}
     </motion.p>
    </motion.div>
   </div>
  </section>
 );
};

export default CTASection;
