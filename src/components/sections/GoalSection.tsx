import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Palette, HeadphonesIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const GoalSection: React.FC = () => {
  const { t, language } = useLanguage();

  const highlights = [
    {
      icon: Rocket,
      title: language === 'bn' ? 'দ্রুত ডেলিভারি' : 'Fast Delivery',
      description: language === 'bn'
        ? 'অর্ডার করার পর ২৪ ঘণ্টার মধ্যে সম্পূর্ণ সেটআপ পাবেন'
        : 'Get complete setup within 24 hours of ordering',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Palette,
      title: language === 'bn' ? 'প্রফেশনাল ডিজাইন' : 'Professional Design',
      description: language === 'bn'
        ? 'মডার্ন ও আকর্ষণীয় UI/UX যা প্রতিটি ডিভাইসে সুন্দর দেখায়'
        : 'Modern and attractive UI/UX that looks beautiful on every device',
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: HeadphonesIcon,
      title: language === 'bn' ? 'ডেডিকেটেড সাপোর্ট' : 'Dedicated Support',
      description: language === 'bn'
        ? 'যেকোনো সমস্যায় আমাদের এক্সপার্ট টিম আপনাকে সাহায্য করবে'
        : 'Our expert team will help you with any issue',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="section-padding" aria-labelledby="goal-title">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4"
          >
            {language === 'bn' ? 'আমাদের লক্ষ্য' : 'Our Goal'}
          </motion.span>
          <motion.h2
            id="goal-title"
            className="text-3xl md:text-4xl font-bold mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('goal.title')}
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t('goal.description')}
          </motion.p>
        </div>

        {/* Highlight Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <div className={`relative bg-card border border-border rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 overflow-hidden`}>
                {/* Gradient BG on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                    <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-[0.95rem]">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default GoalSection;
