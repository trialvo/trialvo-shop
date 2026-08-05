import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Shirt, Gift, Watch, Smartphone, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryCardProps {
  id: string;
  name: { bn: string; en: string };
  icon: string;
  description: { bn: string; en: string };
  productCount?: number;
}

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Shirt,
  Gift,
  Watch,
  Smartphone,
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  name,
  icon,
  description,
  productCount = 0,
}) => {
  const { language } = useLanguage();
  const IconComponent = iconMap[icon] || ShoppingCart;

  return (
    <Link
      to={`/products?category=${id}`}
      className="category-card group"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary">
        <IconComponent className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{name[language]}</h3>
      <p className="text-muted-foreground text-sm">{description[language]}</p>
      {productCount > 0 && (
        <span className="inline-block mt-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {productCount} {language === 'bn' ? 'টি প্রোডাক্ট' : 'Products'}
        </span>
      )}
    </Link>
  );
};

export default CategoryCard;
