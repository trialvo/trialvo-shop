import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import ProductCard from '@/components/cards/ProductCard';
import { products, categories } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ProductsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const selectedCategory = searchParams.get('category') || '';

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product.isActive) return false;
      if (selectedCategory && product.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedCategory]);

  const handleCategoryFilter = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const seoData = {
    bn: {
      title: 'সকল প্রোডাক্ট - রেডিমেড ইকমার্স ওয়েবসাইট',
      description: 'আমাদের সকল রেডিমেড ইকমার্স সলিউশন দেখুন। ফ্যাশন, গিফট, একসেসরিজ, টেক - সব ক্যাটাগরির প্রোডাক্ট পাবেন।',
      keywords: ['ইকমার্স প্রোডাক্ট', 'রেডিমেড ওয়েবসাইট', 'অনলাইন শপ'],
    },
    en: {
      title: 'All Products - Ready-Made Ecommerce Websites',
      description: 'Browse all our ready-made ecommerce solutions. Find products for fashion, gift, accessories, tech, and more categories.',
      keywords: ['ecommerce products', 'ready-made website', 'online shop'],
    },
  };

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
        keywords={seoData[language].keywords}
      />

      <section className="section-padding">
        <div className="container-custom">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('nav.products')}
            </h1>
            <p className="text-muted-foreground">
              {filteredProducts.length}{' '}
              {language === 'bn' ? 'টি প্রোডাক্ট পাওয়া গেছে' : 'products found'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">
                    {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                  </h2>
                  {selectedCategory && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      {language === 'bn' ? 'ক্লিয়ার' : 'Clear'}
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-3">
                    {t('categories.title')}
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilter(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {category.name[language]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                  {selectedCategory && (
                    <Badge variant="secondary" className="ml-2">1</Badge>
                  )}
                </Button>
              </div>

              {/* Active Filters */}
              {selectedCategory && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'ফিল্টার:' : 'Filters:'}
                  </span>
                  <Badge
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => handleCategoryFilter(selectedCategory)}
                  >
                    {categories.find((c) => c.id === selectedCategory)?.name[language]}
                    <X className="w-3 h-3" />
                  </Badge>
                </div>
              )}

              {/* Products */}
              {filteredProducts.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    {language === 'bn'
                      ? 'কোনো প্রোডাক্ট পাওয়া যায়নি'
                      : 'No products found'}
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    {language === 'bn' ? 'সব প্রোডাক্ট দেখুন' : 'View all products'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductsPage;
