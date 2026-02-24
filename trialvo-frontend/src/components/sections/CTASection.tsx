import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Sparkles, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const CTASection: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.12), transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md rounded-full text-sm font-medium text-white/90 mb-8 border border-white/10"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-accent" />
            {language === 'bn' ? 'আজই শুরু করুন' : 'Get Started Today'}
          </motion.span>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            {language === 'bn' ? (
              <>
                আপনার{' '}
                <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  ইকমার্স যাত্রা
                </span>
                <br />
                শুরু করুন আজই
              </>
            ) : (
              <>
                Start Your{' '}
                <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  Ecommerce Journey
                </span>
                <br />
                Today
              </>
            )}
          </h2>

          <p className="text-base md:text-lg text-white/60 mb-10 max-w-lg mx-auto">
            {language === 'bn'
              ? 'রেডিমেড ওয়েবসাইট কিনুন, কাস্টমাইজ করুন এবং আপনার ব্যবসা শুরু করুন'
              : 'Buy a ready-made website, customize it, and launch your business'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-14 px-10 text-base rounded-2xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-[1.02]"
            >
              <Link to="/products">
                {language === 'bn' ? 'প্রোডাক্ট দেখুন' : 'Browse Products'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/[0.06] border-white/20 text-white hover:bg-white/15 hover:text-white h-14 px-8 text-base rounded-2xl backdrop-blur-sm"
            >
              <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 w-5 h-5" />
                {language === 'bn' ? 'হোয়াটসঅ্যাপে যোগাযোগ' : 'Chat on WhatsApp'}
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
