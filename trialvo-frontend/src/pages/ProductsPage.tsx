import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, X, ArrowUpDown, LayoutGrid, List, SlidersHorizontal,
  Search, Package, ShoppingCart, Shirt, Gift, Watch, Smartphone,
  Sparkles, TrendingUp
} from 'lucide-react';
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

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  ecommerce: <ShoppingCart className="w-4 h-4" />,
  fashion: <Shirt className="w-4 h-4" />,
  gift: <Gift className="w-4 h-4" />,
  accessories: <Watch className="w-4 h-4" />,
  tech: <Smartphone className="w-4 h-4" />,
};

const ProductsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const { data: products, isLoading } = useProducts(selectedCategory || undefined);
  const { data: allProducts } = useProducts();

  // Filter and sort products
  const sortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Search filter (from URL param and local input)
    const query = searchQuery || searchInput;
    if (query) {
      const q = query.toLowerCase();
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
  }, [products, sortBy, searchQuery, searchInput, language]);

  // Category product counts
  const categoryCounts = useMemo(() => {
    if (!allProducts) return {};
    const counts: Record<string, number> = {};
    allProducts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

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
    setSearchInput('');
  };

  const sortOptions: { value: SortOption; label: { bn: string; en: string } }[] = [
    { value: 'default', label: { bn: 'ডিফল্ট', en: 'Default' } },
    { value: 'price-asc', label: { bn: 'দাম: কম → বেশি', en: 'Price: Low → High' } },
    { value: 'price-desc', label: { bn: 'দাম: বেশি → কম', en: 'Price: High → Low' } },
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

  const totalProducts = allProducts?.length || 0;
  const featuredCount = allProducts?.filter(p => p.isFeatured).length || 0;

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
        keywords={seoData[language].keywords}
      />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/40">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.15), transparent 70%)' }} />

        <div className="container-custom py-12 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            {/* Left: Title and description */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-5 border border-primary/20"
              >
                <Package className="w-3.5 h-3.5" />
                {language === 'bn' ? 'আমাদের সলিউশন সমূহ' : 'Our Solutions'}
              </motion.div>

              <motion.h1
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {t('nav.products')}
              </motion.h1>

              <motion.p
                className="text-muted-foreground text-base md:text-lg leading-relaxed"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {language === 'bn'
                  ? 'আপনার ব্যবসার জন্য সেরা রেডিমেড ইকমার্স সলিউশন খুঁজুন। সব ক্যাটাগরির প্রোডাক্ট এক জায়গায়।'
                  : 'Find the perfect ready-made ecommerce solution for your business. All categories, one place.'}
              </motion.p>
            </div>

            {/* Right: Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex gap-4"
            >
              <div className="text-center px-5 py-3 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl">
                <div className="text-2xl font-extrabold text-primary">{totalProducts}</div>
                <div className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'মোট প্রোডাক্ট' : 'Total Products'}
                </div>
              </div>
              <div className="text-center px-5 py-3 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl">
                <div className="text-2xl font-extrabold text-amber-500">{featuredCount}</div>
                <div className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'জনপ্রিয়' : 'Featured'}
                </div>
              </div>
              <div className="text-center px-5 py-3 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl">
                <div className="text-2xl font-extrabold text-emerald-500">{categories.length}</div>
                <div className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <motion.div
                className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 sticky top-24 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                    </div>
                    {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                  </h2>
                  {selectedCategory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-7 px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      {language === 'bn' ? 'ক্লিয়ার' : 'Clear'}
                    </Button>
                  )}
                </div>

                {/* Search in sidebar */}
                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'প্রোডাক্ট খুঁজুন...' : 'Search products...'}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 bg-muted/40 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>

                {/* Category list */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {t('categories.title')}
                  </h3>
                  <div className="space-y-1">
                    {categories.map((category) => {
                      const isSelected = selectedCategory === category.id;
                      const count = categoryCounts[category.id] || 0;
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryFilter(category.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 group/cat ${isSelected
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                            : 'hover:bg-muted/70 text-foreground'
                            }`}
                        >
                          <span className={`flex-shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground group-hover/cat:text-foreground'} transition-colors`}>
                            {categoryIcons[category.id]}
                          </span>
                          <span className="flex-1 font-medium">{category.name[language]}</span>
                          <Badge
                            variant="secondary"
                            className={`h-5 min-w-[22px] px-1.5 text-[10px] font-bold ${isSelected
                              ? 'bg-primary-foreground/20 text-primary-foreground border-0'
                              : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price range info */}
                <div className="mt-6 pt-5 border-t border-border/50">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {language === 'bn' ? 'মূল্য পরিসীমা' : 'Price Range'}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'bn' ? 'শুরু' : 'From'}
                    </span>
                    <span className="font-bold text-primary">
                      {t('common.bdt')}{allProducts ? Math.min(...allProducts.map(p => p.priceBDT)).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">
                      {language === 'bn' ? 'সর্বোচ্চ' : 'Up to'}
                    </span>
                    <span className="font-bold text-primary">
                      {t('common.bdt')}{allProducts ? Math.max(...allProducts.map(p => p.priceBDT)).toLocaleString() : '—'}
                    </span>
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
                transition={{ duration: 0.3 }}
                className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl shadow-sm"
              >
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden gap-2 rounded-lg"
                >
                  <Filter className="w-4 h-4" />
                  {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                  {selectedCategory && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">1</Badge>
                  )}
                </Button>

                {/* Result count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')
                      : <>
                        <span className="font-bold text-foreground">{sortedProducts.length}</span>
                        {' '}{language === 'bn' ? 'টি প্রোডাক্ট' : 'products'}
                      </>
                    }
                  </span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-8 px-3 bg-muted/50 border border-border/60 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label[language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-0.5 bg-muted/50 border border-border/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>

              {/* Active Filters */}
              <AnimatePresence>
                {(selectedCategory || searchQuery || searchInput) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mb-6 flex-wrap"
                  >
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active Filters:'}
                    </span>
                    {selectedCategory && (
                      <Badge
                        variant="secondary"
                        className="gap-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg px-3 py-1"
                        onClick={() => handleCategoryFilter(selectedCategory)}
                      >
                        {categoryIcons[selectedCategory]}
                        {categories.find((c) => c.id === selectedCategory)?.name[language]}
                        <X className="w-3 h-3" />
                      </Badge>
                    )}
                    {(searchQuery || searchInput) && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg px-3 py-1"
                        onClick={() => {
                          searchParams.delete('search');
                          setSearchParams(searchParams);
                          setSearchInput('');
                        }}
                      >
                        <Search className="w-3 h-3" />
                        "{searchQuery || searchInput}"
                        <X className="w-3 h-3" />
                      </Badge>
                    )}
                    <button
                      onClick={clearFilters}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
                    >
                      {language === 'bn' ? 'সব মুছুন' : 'Clear all'}
                    </button>
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
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
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
                  className="text-center py-20"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-inner">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-foreground text-xl font-semibold mb-2">
                    {language === 'bn'
                      ? 'কোনো প্রোডাক্ট পাওয়া যায়নি'
                      : 'No products found'}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mb-6 max-w-sm mx-auto">
                    {language === 'bn'
                      ? 'আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'
                      : 'Try adjusting your filters or search terms'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-xl gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
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
