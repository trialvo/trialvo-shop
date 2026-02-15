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
      stat: '24/7',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ShieldCheck,
      title: t('trust.secure.title'),
      description: t('trust.secure.description'),
      stat: '100%',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Zap,
      title: t('trust.fast.title'),
      description: t('trust.fast.description'),
      stat: '< 24h',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section className="section-padding surface-gradient" aria-labelledby="trust-title">
      <div className="container-custom">
        <motion.h2
          id="trust-title"
          className="text-3xl md:text-4xl font-bold text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('trust.title')}
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              className="group"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
            >
              <div className="relative bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 text-center h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                {/* Gradient border top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                {/* Stat Badge */}
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} mb-5 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Stat Number */}
                <div className="text-2xl font-bold text-primary mb-1">{item.stat}</div>

                {/* Content */}
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
