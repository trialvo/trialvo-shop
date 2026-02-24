import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, GitCompareArrows } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  onCompareToggle?: (product: Product) => void;
  isInCompare?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onCompareToggle, isInCompare }) => {
  const { language, t } = useLanguage();

  const categoryLabels: Record<string, { bn: string; en: string }> = {
    ecommerce: { bn: 'ইকমার্স', en: 'Ecommerce' },
    fashion: { bn: 'ফ্যাশন', en: 'Fashion' },
    gift: { bn: 'গিফট', en: 'Gift' },
    accessories: { bn: 'একসেসরিজ', en: 'Accessories' },
    tech: { bn: 'টেক', en: 'Tech' },
  };

  // Check if product was created recently (within 30 days)
  const isNew = () => {
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  return (
    <article className="group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 flex flex-col h-full" itemScope itemType="https://schema.org/Product">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.thumbnail}
          alt={product.name[language]}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          itemProp="image"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick View on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <Button
            asChild
            size="sm"
            className="bg-white/95 text-foreground hover:bg-white shadow-lg rounded-full px-5"
          >
            <Link to={`/products/${product.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              {t('product.viewDetails')}
            </Link>
          </Button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge variant="secondary" className="text-xs font-medium backdrop-blur-sm bg-background/85">
            {categoryLabels[product.category]?.[language] || product.category}
          </Badge>
          {isNew() && (
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-xs font-semibold">
              {language === 'bn' ? 'নতুন' : 'NEW'}
            </Badge>
          )}
        </div>

        {product.isFeatured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-accent-foreground text-xs font-semibold shadow-md">
              ⭐ {language === 'bn' ? 'জনপ্রিয়' : 'Featured'}
            </Badge>
          </div>
        )}

        {/* Compare button */}
        {onCompareToggle && (
          <button
            onClick={(e) => { e.preventDefault(); onCompareToggle(product); }}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isInCompare
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-black/40 text-white/80 hover:bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100'
              }`}
            title={language === 'bn' ? 'তুলনা করুন' : 'Compare'}
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors" itemProp="name">
          {product.name[language]}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1" itemProp="description">
          {product.shortDescription[language]}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-5" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <span className="text-2xl font-bold text-primary" itemProp="price" content={String(product.priceBDT)}>
            {t('common.bdt')}{product.priceBDT.toLocaleString()}
          </span>
          <meta itemProp="priceCurrency" content="BDT" />
          <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            ~${product.priceUSD}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild className="flex-1 rounded-xl">
            <Link to={`/products/${product.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              {t('product.viewDetails')}
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild className="rounded-xl">
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
