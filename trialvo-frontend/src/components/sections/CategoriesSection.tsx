import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Shirt, Gift, Watch, Smartphone, ArrowRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories, products } from '@/data/products';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  Shirt,
  Gift,
  Watch,
  Smartphone,
};

const gradients = [
  'from-blue-500/90 to-indigo-600/90',
  'from-violet-500/90 to-purple-600/90',
  'from-rose-500/90 to-pink-600/90',
  'from-emerald-500/90 to-teal-600/90',
  'from-amber-500/90 to-orange-600/90',
];

const bgImages = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop',
];

const CategoriesSection: React.FC = () => {
  const { t, language } = useLanguage();

  const getCategoryProductCount = (categoryId: string) => {
    return products.filter((p) => p.category === categoryId && p.isActive).length;
  };

  return (
    <section className="section-padding" aria-labelledby="categories-title">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {language === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Browse Categories'}
            </motion.span>
            <motion.h2
              id="categories-title"
              className="text-3xl md:text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {t('categories.title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              {t('categories.subtitle')}
            </motion.p>
          </div>
        </div>

        {/* Grid - Bento style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon] || ShoppingCart;
            const productCount = getCategoryProductCount(category.id);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <Link
                  to={`/products?category=${category.id}`}
                  className="group block relative h-56 md:h-64 rounded-2xl overflow-hidden"
                >
                  {/* Background image */}
                  <img
                    src={bgImages[index % bgImages.length]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradients[index % gradients.length]} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />

                  {/* Subtle pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <h3 className="font-bold text-lg leading-tight mb-1">
                      {category.name[language]}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/75">
                        {productCount} {language === 'bn' ? 'টি' : 'items'}
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
