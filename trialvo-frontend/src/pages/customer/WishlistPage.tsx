import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Loader2, ShoppingBag, ExternalLink, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';

const WishlistPage: React.FC = () => {
 const { language, t } = useLanguage();
 const { data: items, isLoading } = useWishlist();
 const removeFromWishlist = useRemoveFromWishlist();
 const { toast } = useToast();

 const handleRemove = async (productId: string) => {
  try {
   await removeFromWishlist.mutateAsync(productId);
   toast({ title: language === 'bn' ? 'উইশলিস্ট থেকে সরানো হয়েছে' : 'Removed from wishlist' });
  } catch {
   toast({ title: 'Error', variant: 'destructive' });
  }
 };

 if (isLoading) {
  return (
   <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {/* Header */}
   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-center justify-between">
     <div>
      <h1 className="text-2xl font-bold text-foreground">
       {language === 'bn' ? 'উইশলিস্ট' : 'Wishlist'}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
       {language === 'bn' ? 'আপনার পছন্দের প্রোডাক্ট' : 'Your saved products'}
       {items && items.length > 0 && (
        <span className="ml-1 text-foreground font-semibold">({items.length})</span>
       )}
      </p>
     </div>
    </div>
   </motion.div>

   {items && items.length > 0 ? (
    <div className="grid sm:grid-cols-2 gap-4">
     <AnimatePresence>
      {items.map((item, i) => {
       const productName = typeof item.name === 'string' ? item.name : (item.name as any)?.[language] || 'Product';

       return (
        <motion.div
         key={item.id}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95 }}
         transition={{ delay: i * 0.05 }}
         className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl p-4 flex gap-4 group hover:border-primary/25 hover:shadow-md transition-all duration-300"
        >
         <Link to={`/products/${item.slug}`} className="flex-shrink-0">
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-border/30">
           <img
            src={item.thumbnail}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
           />
          </div>
         </Link>
         <div className="flex-1 min-w-0">
          <Link to={`/products/${item.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-sm">
           {productName}
          </Link>
          <div className="mt-1.5 flex items-center gap-2">
           <span className="font-bold text-primary text-sm">
            ৳{Number(item.price_bdt).toLocaleString()}
           </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
           <Button asChild size="sm" className="h-8 text-xs gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 shadow-sm">
            <Link to={`/checkout?product=${item.slug}`}>
             <ShoppingBag className="w-3 h-3" />
             {language === 'bn' ? 'অর্ডার করুন' : 'Order Now'}
            </Link>
           </Button>
           <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 rounded-lg px-2"
            onClick={() => handleRemove(item.product_id)}
           >
            <Trash2 className="w-3.5 h-3.5" />
           </Button>
          </div>
         </div>
        </motion.div>
       );
      })}
     </AnimatePresence>
    </div>
   ) : (
    <motion.div
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     className="text-center py-16 rounded-2xl border border-border/60 bg-card/80"
    >
     <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center">
      <Heart className="w-8 h-8 text-rose-400/40" />
     </div>
     <p className="text-foreground font-semibold text-lg">
      {language === 'bn' ? 'উইশলিস্ট খালি' : 'Your wishlist is empty'}
     </p>
     <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
      {language === 'bn' ? 'প্রোডাক্ট ব্রাউজ করে পছন্দের আইটেম সেভ করুন' : 'Browse products and save your favorites here'}
     </p>
     <Button asChild variant="outline" className="rounded-xl gap-2 border-border/60 hover:border-primary/30">
      <Link to="/products">
       <Package className="w-4 h-4" />
       {t('nav.products')}
      </Link>
     </Button>
    </motion.div>
   )}
  </div>
 );
};

export default WishlistPage;
