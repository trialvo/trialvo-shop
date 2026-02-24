import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Loader2, ArrowUpDown, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import ProductCard from '@/components/cards/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/skeleton-card';
import ProductCompareModal, { CompareBar } from '@/components/ProductCompareModal';
import { categories, Product } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest' | 'name-asc';
type ViewMode = 'grid' | 'list';

const ProductsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const { data: products, isLoading } = useProducts(selectedCategory || undefined);

  // Filter and sort products
  const sortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name[language].toLowerCase().includes(q) ||
        p.shortDescription[language].toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.priceBDT - b.priceBDT);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.priceBDT - a.priceBDT);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name[language].localeCompare(b.name[language]));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, sortBy, searchQuery, language]);

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

  const sortOptions: { value: SortOption; label: { bn: string; en: string } }[] = [
    { value: 'default', label: { bn: 'ডিফল্ট', en: 'Default' } },
    { value: 'price-asc', label: { bn: 'দাম: কম থেকে বেশি', en: 'Price: Low to High' } },
    { value: 'price-desc', label: { bn: 'দাম: বেশি থেকে কম', en: 'Price: High to Low' } },
    { value: 'newest', label: { bn: 'সর্বশেষ', en: 'Newest First' } },
    { value: 'name-asc', label: { bn: 'নাম অনুসারে', en: 'Name A-Z' } },
  ];

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
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('nav.products')}
            </motion.h1>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isLoading
                ? (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')
                : `${sortedProducts.length} ${language === 'bn' ? 'টি প্রোডাক্ট পাওয়া গেছে' : 'products found'}`}
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <motion.div
                className="bg-card border border-border rounded-xl p-6 sticky top-24"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
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
                  <div className="space-y-1.5">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilter(category.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted text-foreground'
                          }`}
                      >
                        <span>{category.name[language]}</span>
                        {selectedCategory === category.id && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-primary-foreground rounded-full"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl"
              >
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                  {selectedCategory && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">1</Badge>
                  )}
                </Button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 flex-1">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label[language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              {/* Active Filters */}
              <AnimatePresence>
                {(selectedCategory || searchQuery) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mb-6 flex-wrap"
                  >
                    <span className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'ফিল্টার:' : 'Filters:'}
                    </span>
                    {selectedCategory && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive/10 transition-colors"
                        onClick={() => handleCategoryFilter(selectedCategory)}
                      >
                        {categories.find((c) => c.id === selectedCategory)?.name[language]}
                        <X className="w-3 h-3" />
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive/10 transition-colors"
                        onClick={() => {
                          searchParams.delete('search');
                          setSearchParams(searchParams);
                        }}
                      >
                        "{searchQuery}"
                        <X className="w-3 h-3" />
                      </Badge>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Products */}
              {isLoading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {sortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <ProductCard
                        product={product}
                        onCompareToggle={(p) => {
                          setCompareItems(prev => {
                            if (prev.find(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
                            if (prev.length >= 2) return prev;
                            return [...prev, p];
                          });
                        }}
                        isInCompare={!!compareItems.find(x => x.id === product.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Filter className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-lg mb-2">
                    {language === 'bn'
                      ? 'কোনো প্রোডাক্ট পাওয়া যায়নি'
                      : 'No products found'}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mb-4">
                    {language === 'bn'
                      ? 'অন্য ফিল্টার ব্যবহার করে দেখুন'
                      : 'Try adjusting your filters'}
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    {language === 'bn' ? 'সব প্রোডাক্ট দেখুন' : 'View all products'}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Compare Bar */}
      <AnimatePresence>
        <CompareBar
          items={compareItems}
          onRemove={(id) => setCompareItems(prev => prev.filter(x => x.id !== id))}
          onCompare={() => setShowCompare(true)}
          onClear={() => setCompareItems([])}
        />
      </AnimatePresence>

      {/* Compare Modal */}
      <ProductCompareModal
        products={compareItems}
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
      />
    </Layout>
  );
};

export default ProductsPage;
