import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, t } = useLanguage();

  const categoryLabels: Record<string, { bn: string; en: string }> = {
    ecommerce: { bn: 'ইকমার্স', en: 'Ecommerce' },
    fashion: { bn: 'ফ্যাশন', en: 'Fashion' },
    gift: { bn: 'গিফট', en: 'Gift' },
    accessories: { bn: 'একসেসরিজ', en: 'Accessories' },
    tech: { bn: 'টেক', en: 'Tech' },
  };

  return (
    <article className="product-card group" itemScope itemType="https://schema.org/Product">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.thumbnail}
          alt={product.name[language]}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          itemProp="image"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {categoryLabels[product.category]?.[language] || product.category}
          </Badge>
        </div>
        {product.isFeatured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-accent-foreground text-xs">
              {language === 'bn' ? 'জনপ্রিয়' : 'Featured'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1" itemProp="name">
          {product.name[language]}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2" itemProp="description">
          {product.shortDescription[language]}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <span className="price-display" itemProp="price" content={String(product.priceBDT)}>
            {t('common.bdt')}{product.priceBDT.toLocaleString()}
          </span>
          <meta itemProp="priceCurrency" content="BDT" />
          <span className="text-sm text-muted-foreground">
            (~${product.priceUSD})
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/products/${product.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              {t('product.viewDetails')}
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a
              href={product.demo.shopUrl}
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
