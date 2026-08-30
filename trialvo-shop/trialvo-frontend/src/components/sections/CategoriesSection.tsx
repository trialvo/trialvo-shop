"use client";

import React from 'react';
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { motion } from 'framer-motion';
import { ShoppingCart, Shirt, Gift, Watch, Smartphone, ArrowRight, AlertTriangle, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/hooks/useCategories';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  Shirt,
  Gift,
  Watch,
  Smartphone,
};

const CategoriesSection: React.FC = () => {
  const { t, language } = useLanguage();
  // Categories are now DB-driven so admin edits and live product counts reflect here.
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="section-padding bg-muted/30" aria-labelledby="categories-title">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4"
          >
            {language === 'bn' ? 'আমাদের ক্যাটাগরি' : 'Our Categories'}
          </motion.span>
          <motion.h2
            id="categories-title"
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('categories.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            {t('categories.subtitle')}
          </motion.p>
        </div>

        {/* Error state — surface a retry instead of a silently empty section */}
        {isError && !isLoading && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center"
          >
            <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {language === 'bn'
                ? 'ক্যাটাগরি লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।'
                : 'Categories could not be loaded. Please try again.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!isError && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-card border border-border rounded-2xl p-6 h-44 animate-pulse"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted" />
                <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-2" />
                <div className="h-3 bg-muted rounded w-full mx-auto" />
              </div>
            ))}
          {!isLoading && categories.map((category) => {
            const IconComponent = iconMap[category.icon || ''] || ShoppingCart;
            const productCount = category.product_count ?? 0;
            const categoryName = category.name?.[language] || category.name?.en || category.slug;
            const categoryDesc = category.description?.[language] || category.description?.en || '';

            return (
              <motion.div key={category.id} variants={itemVariants}>
                <LocalizedLink
                  href={`/products?category=${category.slug}`}
                  className="group block"
                >
                  <div className="relative bg-card border border-border rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 overflow-hidden">
                    {/* Background Gradient on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Icon Container */}
                    <div className="relative z-10">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                        <IconComponent className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>

                      {/* Category Name */}
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {categoryName}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {categoryDesc}
                      </p>

                      {/* Product Count Badge */}
                      {productCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {productCount} {language === 'bn' ? 'টি প্রোডাক্ট' : 'Products'}
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </div>
                  </div>
                </LocalizedLink>
              </motion.div>
            );
          })}
        </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
