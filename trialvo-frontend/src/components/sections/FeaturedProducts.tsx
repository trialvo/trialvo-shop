import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeaturedProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/cards/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/skeleton-card';
import { Button } from '@/components/ui/button';

const FeaturedProducts: React.FC = () => {
  const { t, language } = useLanguage();
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  return (
    <section className="section-padding bg-muted/30 relative overflow-hidden" aria-labelledby="featured-title">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)' }} />

      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent-foreground text-sm font-semibold rounded-full mb-4 border border-accent/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              {language === 'bn' ? 'জনপ্রিয় প্রোডাক্ট' : 'Popular Products'}
            </motion.span>
            <motion.h2
              id="featured-title"
              className="text-3xl md:text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {t('featured.title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              {t('featured.subtitle')}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button
              asChild
              variant="outline"
              className="mt-4 md:mt-0 rounded-xl group border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Link to="/products">
                {t('common.seeAll')}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts?.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
