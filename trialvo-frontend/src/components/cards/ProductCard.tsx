import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, GitCompareArrows, Sparkles, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { Product } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface ProductCardProps {
  product: Product;
  onCompareToggle?: (product: Product) => void;
  isInCompare?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onCompareToggle, isInCompare }) => {
  const { language, t } = useLanguage();
  const { isLoggedIn } = useCustomerAuth();
  const { data: wishlistItems } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { toast } = useToast();

  const isInWishlist = wishlistItems?.some(item => item.product_id === product.id) || false;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast({
        title: language === 'bn' ? 'লগইন করুন' : 'Login Required',
        description: language === 'bn' ? 'ফেভারিটে যোগ করতে প্রথমে লগইন করুন' : 'Please login to add to favourites',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync(product.id);
        toast({ title: language === 'bn' ? 'ফেভারিট থেকে সরানো হয়েছে' : 'Removed from favourites' });
      } else {
        await addToWishlist.mutateAsync(product.id);
        toast({ title: language === 'bn' ? 'ফেভারিটে যোগ হয়েছে ❤️' : 'Added to favourites ❤️' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const categoryLabels: Record<string, { bn: string; en: string }> = {
    ecommerce: { bn: 'ইকমার্স', en: 'Ecommerce' },
    fashion: { bn: 'ফ্যাশন', en: 'Fashion' },
    gift: { bn: 'গিফট', en: 'Gift' },
    accessories: { bn: 'একসেসরিজ', en: 'Accessories' },
    tech: { bn: 'টেক', en: 'Tech' },
  };

  const categoryColors: Record<string, string> = {
    ecommerce: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    fashion: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
    gift: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
    accessories: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
    tech: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  };

  const isNew = () => {
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const featurePreview = product.features[language].slice(0, 3);

  return (
    <article
      className="group relative bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 hover:border-primary/30 flex flex-col h-full"
      itemScope
      itemType="https://schema.org/Product"
      style={{ willChange: 'transform' }}
    >
      {/* Hover glow effect */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />

      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.thumbnail}
          alt={product.name[language]}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-[0.85]"
          loading="lazy"
          itemProp="image"
        />

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick View on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0">
          <Button
            asChild
            size="sm"
            className="bg-white/95 text-gray-900 hover:bg-white shadow-xl rounded-full px-6 py-2 font-medium backdrop-blur-sm border border-white/20"
          >
            <Link to={`/products/${product.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              {t('product.viewDetails')}
            </Link>
          </Button>
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge
            variant="secondary"
            className={`text-xs font-semibold backdrop-blur-xl bg-gradient-to-r ${categoryColors[product.category] || ''} border shadow-lg`}
          >
            {categoryLabels[product.category]?.[language] || product.category}
          </Badge>
          {isNew() && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-500 hover:to-green-400 text-white text-[10px] font-bold tracking-wider uppercase shadow-lg shadow-emerald-500/20 border-0">
              {language === 'bn' ? '✨ নতুন' : '✨ NEW'}
            </Badge>
          )}
        </div>

        {/* Top Right — Favourite + Featured */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          {/* Favourite Heart Button */}
          <motion.button
            onClick={handleWishlistToggle}
            whileTap={{ scale: 0.85 }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${isInWishlist
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white backdrop-blur-md'
              }`}
            title={language === 'bn' ? 'ফেভারিট' : 'Favourite'}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isInWishlist ? 'filled' : 'outline'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Featured badge */}
          {product.isFeatured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-500 hover:to-orange-400 text-white text-[10px] font-bold shadow-lg shadow-amber-500/25 border-0 gap-1">
              <Sparkles className="w-3 h-3" />
              {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
            </Badge>
          )}
        </div>

        {/* Compare button */}
        {onCompareToggle && (
          <button
            onClick={(e) => { e.preventDefault(); onCompareToggle(product); }}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isInCompare
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
              : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110'
              }`}
            title={language === 'bn' ? 'তুলনা করুন' : 'Compare'}
          >
            <GitCompareArrows className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Title */}
        <h3
          className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-300"
          itemProp="name"
        >
          {product.name[language]}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1" itemProp="description">
          {product.shortDescription[language]}
        </p>

        {/* Feature preview chips */}
        <div className="flex flex-wrap gap-1.5">
          {featurePreview.map((feature, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/5 text-primary/80 border border-primary/10"
            >
              <Check className="w-2.5 h-2.5" />
              {feature}
            </span>
          ))}
          {product.features[language].length > 3 && (
            <span className="text-[11px] text-muted-foreground/60 px-1 py-0.5">
              +{product.features[language].length - 3} {language === 'bn' ? 'আরও' : 'more'}
            </span>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Price */}
        <div className="flex items-baseline gap-2" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <span
            className="text-2xl font-extrabold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
            itemProp="price"
            content={String(product.priceBDT)}
          >
            {t('common.bdt')}{product.priceBDT.toLocaleString()}
          </span>
          <meta itemProp="priceCurrency" content="BDT" />
          <span className="text-xs text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md font-medium">
            ~${product.priceUSD}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            asChild
            className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 font-semibold"
          >
            <Link to={`/products/${product.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              {t('product.viewDetails')}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            asChild
            className="rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
          >
            <a
              href={product.demo[0]?.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('product.viewDemo')}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
