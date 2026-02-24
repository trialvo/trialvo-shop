import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { products as allProducts } from '@/data/products';

const SearchBar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
 const [query, setQuery] = useState('');
 const [isOpen, setIsOpen] = useState(false);
 const [results, setResults] = useState<typeof allProducts>([]);
 const inputRef = useRef<HTMLInputElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const navigate = useNavigate();
 const { language } = useLanguage();

 // Search logic
 const handleSearch = useCallback((searchQuery: string) => {
  if (!searchQuery.trim()) {
   setResults([]);
   return;
  }
  const q = searchQuery.toLowerCase();
  const filtered = allProducts.filter(p =>
   p.name[language].toLowerCase().includes(q) ||
   p.shortDescription[language].toLowerCase().includes(q) ||
   p.category.toLowerCase().includes(q)
  ).slice(0, 5);
  setResults(filtered);
 }, [language]);

 useEffect(() => {
  const debounce = setTimeout(() => handleSearch(query), 200);
  return () => clearTimeout(debounce);
 }, [query, handleSearch]);

 // Focus input on mount
 useEffect(() => {
  inputRef.current?.focus();
 }, []);

 // Close on click outside
 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
    setIsOpen(false);
    onClose?.();
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [onClose]);

 // Keyboard navigation
 const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
   setIsOpen(false);
   onClose?.();
  }
  if (e.key === 'Enter' && query.trim()) {
   navigate(`/products?search=${encodeURIComponent(query)}`);
   setIsOpen(false);
   onClose?.();
  }
 };

 const goToProduct = (slug: string) => {
  navigate(`/products/${slug}`);
  setIsOpen(false);
  onClose?.();
 };

 return (
  <div ref={containerRef} className="relative w-full max-w-lg">
   {/* Search Input */}
   <div className="relative">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <input
     ref={inputRef}
     type="text"
     value={query}
     onChange={(e) => {
      setQuery(e.target.value);
      setIsOpen(true);
     }}
     onFocus={() => setIsOpen(true)}
     onKeyDown={handleKeyDown}
     placeholder={language === 'bn' ? 'প্রোডাক্ট খুঁজুন...' : 'Search products...'}
     className="w-full h-10 pl-10 pr-10 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
    />
    {query && (
     <button
      onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
     >
      <X className="w-4 h-4" />
     </button>
    )}
   </div>

   {/* Results Dropdown */}
   <AnimatePresence>
    {isOpen && query.trim() && (
     <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
     >
      {results.length > 0 ? (
       <div className="py-2">
        {results.map((product) => (
         <button
          key={product.id}
          onClick={() => goToProduct(product.slug)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
         >
          <img
           src={product.thumbnail}
           alt={product.name[language]}
           className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
           <p className="text-sm font-medium text-foreground truncate">
            {product.name[language]}
           </p>
           <p className="text-xs text-muted-foreground">
            ৳{product.priceBDT.toLocaleString()}
           </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
         </button>
        ))}
        <div className="border-t border-border mt-1 pt-1">
         <button
          onClick={() => {
           navigate(`/products?search=${encodeURIComponent(query)}`);
           setIsOpen(false);
           onClose?.();
          }}
          className="w-full px-4 py-2.5 text-sm text-primary font-medium hover:bg-muted/50 transition-colors text-left flex items-center gap-2"
         >
          <Search className="w-3.5 h-3.5" />
          {language === 'bn' ? `"${query}" এর সব ফলাফল দেখুন` : `See all results for "${query}"`}
         </button>
        </div>
       </div>
      ) : (
       <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
         {language === 'bn' ? 'কোনো প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}
        </p>
       </div>
      )}
     </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
};

export default SearchBar;
