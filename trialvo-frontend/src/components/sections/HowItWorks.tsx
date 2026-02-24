import React from 'react';
import { ShoppingBag, CreditCard, Mail, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t, language } = useLanguage();

  const steps = [
    { icon: ShoppingBag, title: t('howItWorks.step1.title'), description: t('howItWorks.step1.description'), color: 'from-blue-500 to-indigo-500' },
    { icon: CreditCard, title: t('howItWorks.step2.title'), description: t('howItWorks.step2.description'), color: 'from-violet-500 to-purple-500' },
    { icon: Mail, title: t('howItWorks.step3.title'), description: t('howItWorks.step3.description'), color: 'from-emerald-500 to-teal-500' },
    { icon: Rocket, title: t('howItWorks.step4.title'), description: t('howItWorks.step4.description'), color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <section className="section-padding bg-muted/40" aria-labelledby="how-it-works-title">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4"
          >
            {language === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}
          </motion.span>
          <motion.h2
            id="how-it-works-title"
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('howItWorks.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            {language === 'bn'
              ? '৪টি সহজ ধাপে আপনার ওয়েবসাইট পেয়ে যান'
              : 'Get your website in 4 simple steps'}
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
            >
              <div className="relative bg-card rounded-2xl border border-border p-6 h-full transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 overflow-hidden">
                {/* Gradient hover background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

                {/* Step number */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-5xl font-black text-muted-foreground/[0.08]">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2 relative z-10">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 items-center justify-center">
                  <div className="w-2 h-2 border-r-2 border-t-2 border-muted-foreground/20 rotate-45" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
