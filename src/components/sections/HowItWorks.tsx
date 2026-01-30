import React from 'react';
import { ShoppingBag, CreditCard, Mail, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: ShoppingBag,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      icon: CreditCard,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      icon: Mail,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
    {
      icon: Rocket,
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
    },
  ];

  return (
    <section className="section-padding bg-primary text-primary-foreground" aria-labelledby="how-it-works-title">
      <div className="container-custom">
        <motion.h2
          id="how-it-works-title"
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('howItWorks.title')}
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              {/* Step Number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                <step.icon className="w-9 h-9" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-primary-foreground/70 text-sm">
                {step.description}
              </p>

              {/* Connector Line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-primary-foreground/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
