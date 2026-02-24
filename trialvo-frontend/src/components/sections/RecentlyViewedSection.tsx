import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const RecentlyViewedSection: React.FC = () => {
 const { recentlyViewed } = useRecentlyViewed();
 const { language, t } = useLanguage();

 if (recentlyViewed.length === 0) return null;

 return (
  <section className="section-padding bg-muted/20">
   <div className="container-custom">
    <div className="flex items-center justify-between mb-8">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
       <Clock className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">
       {language === 'bn' ? 'সম্প্রতি দেখেছেন' : 'Recently Viewed'}
      </h2>
     </div>
    </div>

    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
     {recentlyViewed.map((product, index) => (
      <motion.div
       key={product.id}
       initial={{ opacity: 0, x: 20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: index * 0.05 }}
       className="flex-shrink-0 w-48"
      >
       <Link
        to={`/products/${product.slug}`}
        className="group block bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
       >
        <div className="aspect-[4/3] overflow-hidden">
         <img
          src={product.thumbnail}
          alt={product.name[language]}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
         />
        </div>
        <div className="p-3">
         <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {product.name[language]}
         </h3>
         <p className="text-sm font-bold text-primary mt-1">
          {t('common.bdt')}{product.priceBDT.toLocaleString()}
         </p>
        </div>
       </Link>
      </motion.div>
     ))}
    </div>
   </div>
  </section>
 );
};

export default RecentlyViewedSection;
