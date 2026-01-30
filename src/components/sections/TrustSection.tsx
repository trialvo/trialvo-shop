import React from 'react';
import { Headphones, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const TrustSection: React.FC = () => {
  const { t } = useLanguage();

  const trustItems = [
    {
      icon: Headphones,
      title: t('trust.support.title'),
      description: t('trust.support.description'),
    },
    {
      icon: ShieldCheck,
      title: t('trust.secure.title'),
      description: t('trust.secure.description'),
    },
    {
      icon: Zap,
      title: t('trust.fast.title'),
      description: t('trust.fast.description'),
    },
  ];

  return (
    <section className="section-padding surface-gradient" aria-labelledby="trust-title">
      <div className="container-custom">
        <motion.h2
          id="trust-title"
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('trust.title')}
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              className="trust-badge flex-col items-center text-center p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
