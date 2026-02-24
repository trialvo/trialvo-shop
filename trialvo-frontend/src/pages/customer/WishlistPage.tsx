import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Loader2, ShoppingBag, ExternalLink } from 'lucide-react';
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
  <div className="space-y-5">
   <div>
    <h1 className="text-xl font-bold text-foreground">
     {language === 'bn' ? 'উইশলিস্ট' : 'Wishlist'}
    </h1>
    <p className="text-sm text-muted-foreground">
     {language === 'bn' ? 'আপনার পছন্দের প্রোডাক্ট' : 'Your saved products'}
    </p>
   </div>

   {items && items.length > 0 ? (
    <div className="grid sm:grid-cols-2 gap-4">
     {items.map((item) => {
      const productName = typeof item.name === 'string' ? item.name : (item.name as any)?.[language] || 'Product';
      const price = item.discount_price_bdt || item.price_bdt;

      return (
       <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex gap-4 group hover:shadow-soft-sm transition-all">
        <Link to={`/products/${item.slug}`} className="flex-shrink-0">
         <img
          src={item.thumbnail}
          alt={productName}
          className="w-20 h-20 object-cover rounded-lg"
         />
        </Link>
        <div className="flex-1 min-w-0">
         <Link to={`/products/${item.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 text-sm">
          {productName}
         </Link>
         <div className="mt-1 flex items-center gap-2">
          <span className="font-bold text-primary text-sm">
           ৳{Number(price).toLocaleString()}
          </span>
          {item.discount_price_bdt && item.discount_price_bdt < item.price_bdt && (
           <span className="text-xs text-muted-foreground line-through">
            ৳{Number(item.price_bdt).toLocaleString()}
           </span>
          )}
         </div>
         <div className="mt-2 flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1 border-border">
           <Link to={`/checkout?product=${item.slug}`}>
            <ShoppingBag className="w-3 h-3" />
            {language === 'bn' ? 'অর্ডার' : 'Order'}
           </Link>
          </Button>
          <Button
           size="sm"
           variant="ghost"
           className="h-7 text-xs text-muted-foreground hover:text-destructive"
           onClick={() => handleRemove(item.product_id)}
          >
           <Trash2 className="w-3 h-3" />
          </Button>
         </div>
        </div>
       </div>
      );
     })}
    </div>
   ) : (
    <div className="text-center py-16 text-muted-foreground">
     <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
     <p className="font-medium">{language === 'bn' ? 'উইশলিস্ট খালি' : 'Your wishlist is empty'}</p>
     <p className="text-xs mt-1 mb-4">{language === 'bn' ? 'প্রোডাক্ট ব্রাউজ করুন' : 'Browse products to add favorites'}</p>
     <Button asChild variant="outline" className="border-border gap-2">
      <Link to="/products">
       <ExternalLink className="w-4 h-4" />
       {t('nav.products')}
      </Link>
     </Button>
    </div>
   )}
  </div>
 );
};

export default WishlistPage;
