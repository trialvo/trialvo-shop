import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const GoalSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="section-padding" aria-labelledby="goal-title">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            id="goal-title"
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('goal.title')}
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t('goal.description')}
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default GoalSection;
