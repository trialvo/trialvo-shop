import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompareArrows, Check, Minus, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface CompareProduct {
 id: string;
 slug: string;
 name: { bn: string; en: string };
 thumbnail: string;
 priceBDT: number;
 priceUSD: number;
 features: { bn: string[]; en: string[] };
 category: string;
}

interface Props {
 products: CompareProduct[];
 isOpen: boolean;
 onClose: () => void;
}

const ProductCompareModal: React.FC<Props> = ({ products, isOpen, onClose }) => {
 const { language, t } = useLanguage();

 if (products.length < 2) return null;

 // Get all unique features across both products
 const allFeatures = Array.from(
  new Set([
   ...products[0].features[language],
   ...products[1].features[language],
  ])
 );

 return (
  <AnimatePresence>
   {isOpen && (
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     className="fixed inset-0 z-50 flex items-center justify-center p-4"
     onClick={onClose}
    >
     {/* Overlay */}
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

     {/* Modal */}
     <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
     >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
       <div className="flex items-center gap-2">
        <GitCompareArrows className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">
         {language === 'bn' ? 'প্রোডাক্ট তুলনা' : 'Product Comparison'}
        </h2>
       </div>
       <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-5 h-5" />
       </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-6">
       <div className="grid grid-cols-3 gap-4">
        {/* Header Row - Empty cell + 2 products */}
        <div className="font-semibold text-sm text-muted-foreground">
         {language === 'bn' ? 'তুলনার বিষয়' : 'Compare'}
        </div>
        {products.slice(0, 2).map((product) => (
         <div key={product.id} className="text-center">
          <img
           src={product.thumbnail}
           alt={product.name[language]}
           className="w-20 h-20 rounded-xl object-cover mx-auto mb-3 border border-border"
          />
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name[language]}</h3>
          <p className="text-primary font-bold">{t('common.bdt')}{product.priceBDT.toLocaleString()}</p>
         </div>
        ))}

        {/* Divider */}
        <div className="col-span-3 border-t border-border my-2" />

        {/* Price Row */}
        <div className="text-sm font-medium text-muted-foreground py-3">
         {language === 'bn' ? 'মূল্য (BDT)' : 'Price (BDT)'}
        </div>
        {products.slice(0, 2).map((p) => (
         <div key={p.id} className="text-center py-3 font-bold text-primary">
          ৳{p.priceBDT.toLocaleString()}
         </div>
        ))}

        {/* USD Price */}
        <div className="text-sm font-medium text-muted-foreground py-3">
         {language === 'bn' ? 'মূল্য (USD)' : 'Price (USD)'}
        </div>
        {products.slice(0, 2).map((p) => (
         <div key={p.id} className="text-center py-3 text-muted-foreground">
          ${p.priceUSD}
         </div>
        ))}

        {/* Category */}
        <div className="text-sm font-medium text-muted-foreground py-3">
         {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
        </div>
        {products.slice(0, 2).map((p) => (
         <div key={p.id} className="text-center py-3 capitalize">{p.category}</div>
        ))}

        {/* Divider */}
        <div className="col-span-3 border-t border-border my-2" />

        {/* Features comparison */}
        <div className="col-span-3 text-sm font-semibold mb-2">
         {language === 'bn' ? 'ফিচার তুলনা' : 'Feature Comparison'}
        </div>

        {allFeatures.map((feature, i) => {
         const has0 = products[0].features[language].includes(feature);
         const has1 = products[1].features[language].includes(feature);
         return (
          <React.Fragment key={i}>
           <div className={`text-xs py-2.5 ${i % 2 === 0 ? 'bg-muted/30' : ''} px-2 rounded-l-lg`}>
            {feature}
           </div>
           <div className={`text-center py-2.5 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
            {has0 ? (
             <Check className="w-4 h-4 text-emerald-500 mx-auto" />
            ) : (
             <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
            )}
           </div>
           <div className={`text-center py-2.5 ${i % 2 === 0 ? 'bg-muted/30' : ''} rounded-r-lg`}>
            {has1 ? (
             <Check className="w-4 h-4 text-emerald-500 mx-auto" />
            ) : (
             <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
            )}
           </div>
          </React.Fragment>
         );
        })}
       </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border grid grid-cols-2 gap-3">
       {products.slice(0, 2).map((p) => (
        <Button key={p.id} asChild className="rounded-xl">
         <Link to={`/checkout?product=${p.slug}`}>
          {language === 'bn' ? 'কিনুন' : 'Buy Now'}
          <ArrowRight className="w-4 h-4 ml-2" />
         </Link>
        </Button>
       ))}
      </div>
     </motion.div>
    </motion.div>
   )}
  </AnimatePresence>
 );
};

// Compare bar that appears at bottom when items are selected
export const CompareBar: React.FC<{
 items: CompareProduct[];
 onRemove: (id: string) => void;
 onCompare: () => void;
 onClear: () => void;
}> = ({ items, onRemove, onCompare, onClear }) => {
 const { language } = useLanguage();

 if (items.length === 0) return null;

 return (
  <motion.div
   initial={{ y: 100 }}
   animate={{ y: 0 }}
   exit={{ y: 100 }}
   className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl"
  >
   <div className="container-custom py-3 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
     <GitCompareArrows className="w-5 h-5 text-primary flex-shrink-0" />
     <div className="flex gap-2">
      {items.map((item) => (
       <div key={item.id} className="relative group">
        <img
         src={item.thumbnail}
         alt={item.name[language]}
         className="w-10 h-10 rounded-lg object-cover border border-border"
        />
        <button
         onClick={() => onRemove(item.id)}
         className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
         <X className="w-2.5 h-2.5" />
        </button>
       </div>
      ))}
      {items.length < 2 && (
       <div className="w-10 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
        <Plus className="w-4 h-4 text-muted-foreground" />
       </div>
      )}
     </div>
     <span className="text-sm text-muted-foreground">
      {items.length}/2 {language === 'bn' ? 'নির্বাচিত' : 'selected'}
     </span>
    </div>
    <div className="flex gap-2">
     <Button variant="ghost" size="sm" onClick={onClear}>
      {language === 'bn' ? 'ক্লিয়ার' : 'Clear'}
     </Button>
     <Button size="sm" onClick={onCompare} disabled={items.length < 2} className="gap-2">
      <GitCompareArrows className="w-4 h-4" />
      {language === 'bn' ? 'তুলনা করুন' : 'Compare'}
     </Button>
    </div>
   </div>
  </motion.div>
 );
};

export default ProductCompareModal;
