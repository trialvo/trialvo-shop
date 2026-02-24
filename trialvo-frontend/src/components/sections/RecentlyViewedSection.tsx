import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const RecentlyViewedSection: React.FC = () => {
 const { recentlyViewed } = useRecentlyViewed();
 const { language, t } = useLanguage();

 if (recentlyViewed.length === 0) return null;

 return (
  <section className="section-padding bg-muted/30">
   <div className="container-custom">
    {/* Header */}
    <div className="flex items-center justify-between mb-10">
     <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
       <Clock className="w-5 h-5 text-primary" />
      </div>
      <div>
       <h2 className="text-2xl font-bold">
        {language === 'bn' ? 'সম্প্রতি দেখেছেন' : 'Recently Viewed'}
       </h2>
       <p className="text-sm text-muted-foreground">
        {language === 'bn' ? 'আপনার দেখা প্রোডাক্ট সমূহ' : 'Products you browsed'}
       </p>
      </div>
     </div>
    </div>

    {/* Horizontal scroll */}
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
     {recentlyViewed.map((product, index) => (
      <motion.div
       key={product.id}
       initial={{ opacity: 0, x: 30 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: index * 0.06 }}
       className="flex-shrink-0 w-52"
      >
       <Link
        to={`/products/${product.slug}`}
        className="group block bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20"
       >
        <div className="relative aspect-[4/3] overflow-hidden">
         <img
          src={product.thumbnail}
          alt={product.name[language]}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
         />
         {/* Hover overlay */}
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
           <Eye className="w-4 h-4 text-gray-900" />
          </div>
         </div>
        </div>
        <div className="p-3.5">
         <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors mb-1">
          {product.name[language]}
         </h3>
         <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">
           {t('common.bdt')}{product.priceBDT.toLocaleString()}
          </p>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
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
