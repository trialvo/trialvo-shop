import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, CheckCircle, Star, Users, Clock, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();

  const trustBadges = [
    { icon: Users, value: '500+', label: language === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Happy Clients' },
    { icon: Code2, value: '50+', label: language === 'bn' ? 'রেডিমেড সলিউশন' : 'Ready Solutions' },
    { icon: Clock, value: '24h', label: language === 'bn' ? 'দ্রুত ডেলিভারি' : 'Fast Delivery' },
    { icon: Star, value: '4.9', label: language === 'bn' ? 'গড় রেটিং' : 'Avg Rating' },
  ];

  const features = [
    language === 'bn' ? 'সম্পূর্ণ এডমিন প্যানেল' : 'Complete Admin Panel',
    language === 'bn' ? 'পেমেন্ট গেটওয়ে ইন্টিগ্রেশন' : 'Payment Gateway',
    language === 'bn' ? 'মোবাইল রেসপন্সিভ' : 'Mobile Responsive',
    language === 'bn' ? 'ফুল সোর্স কোড' : 'Full Source Code',
  ];

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Layered Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
        {/* Glow orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.15), transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 70%)' }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-4rem)] py-20">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            {/* Announcement badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-white/15 bg-white/[0.06] backdrop-blur-md text-white/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {language === 'bn' ? '🎉 নতুন প্রোডাক্ট এসেছে!' : '🎉 New products available!'}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
            >
              {language === 'bn' ? (
                <>
                  আপনার ব্যবসার জন্য
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                    প্রফেশনাল ইকমার্স
                  </span>
                  <br />
                  সলিউশন
                </>
              ) : (
                <>
                  Professional
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                    Ecommerce Solution
                  </span>
                  <br />
                  For Your Business
                </>
              )}
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/65 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              {t('hero.description')}
            </motion.p>

            {/* Feature checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-10 max-w-md mx-auto lg:mx-0"
            >
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-14 px-10 text-base rounded-2xl shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.02]"
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
                className="bg-white/[0.06] border-white/20 text-white hover:bg-white/15 hover:text-white h-14 px-8 text-base rounded-2xl backdrop-blur-sm"
              >
                <Link to="/contact">
                  <Phone className="mr-2 w-5 h-5" />
                  {t('hero.cta.contact')}
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main mockup */}
            <motion.div
              className="relative z-10"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Browser frame */}
              <div className="bg-gray-900/80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white/50 text-center font-mono">
                      yourstore.com/admin
                    </div>
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&h=440&fit=crop"
                  alt={language === 'bn' ? 'এডমিন প্যানেল প্রিভিউ' : 'Admin Panel Preview'}
                  className="w-full"
                />
              </div>
            </motion.div>

            {/* Floating stat cards */}
            <motion.div
              className="absolute -bottom-4 -left-6 z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="bg-card rounded-2xl p-4 shadow-2xl border border-border flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-card-foreground">100%</div>
                  <div className="text-xs text-muted-foreground">{language === 'bn' ? 'সোর্স কোড' : 'Source Code'}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -top-4 -right-4 z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              <div className="bg-card rounded-2xl p-4 shadow-2xl border border-border flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-xl font-bold text-card-foreground">4.9★</div>
                  <div className="text-xs text-muted-foreground">{language === 'bn' ? 'গ্রাহক রেটিং' : 'Client Rating'}</div>
                </div>
              </div>
            </motion.div>

            {/* Background glow */}
            <div className="absolute inset-0 bg-accent/10 blur-[80px] rounded-full -z-10 scale-90" />
          </motion.div>
        </div>

        {/* Trust Bar - at bottom of hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="pb-16"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={i}
                className="text-center group"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <badge.icon className="w-4 h-4 text-accent" />
                  <span className="text-2xl font-bold text-white">{badge.value}</span>
                </div>
                <span className="text-xs text-white/50 font-medium">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
