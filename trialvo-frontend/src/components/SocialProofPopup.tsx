import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';

const names = {
 bn: ['রাহুল', 'তানভীর', 'সাকিব', 'নাফিসা', 'আরিফা', 'মাহমুদ', 'রাশেদ', 'ফাতেমা', 'তাসনিম', 'ইমরান'],
 en: ['Rahul', 'Tanvir', 'Sakib', 'Nafisa', 'Arifa', 'Mahmud', 'Rashed', 'Fatema', 'Tasnim', 'Imran'],
};

const cities = {
 bn: ['ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ'],
 en: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'],
};

const timeAgo = {
 bn: ['২ মিনিট আগে', '৫ মিনিট আগে', '১২ মিনিট আগে', '২০ মিনিট আগে', '১ ঘণ্টা আগে'],
 en: ['2 min ago', '5 min ago', '12 min ago', '20 min ago', '1 hour ago'],
};

const SocialProofPopup: React.FC = () => {
 const [show, setShow] = useState(false);
 const [enabled, setEnabled] = useState<boolean | null>(null);
 const [data, setData] = useState({ name: '', city: '', time: '' });
 const { language } = useLanguage();

 // Check if social proof is enabled from backend
 useEffect(() => {
  api.get<{ social_proof_enabled: boolean }>('/settings/features')
   .then((res) => setEnabled(res.social_proof_enabled))
   .catch(() => setEnabled(true)); // Default to showing if API fails
 }, []);

 const generateData = useCallback(() => {
  const lang = language as 'bn' | 'en';
  return {
   name: names[lang][Math.floor(Math.random() * names[lang].length)],
   city: cities[lang][Math.floor(Math.random() * cities[lang].length)],
   time: timeAgo[lang][Math.floor(Math.random() * timeAgo[lang].length)],
  };
 }, [language]);

 useEffect(() => {
  // Don't run if not enabled or still loading
  if (enabled !== true) return;

  // Show first popup after 15 seconds
  const initialTimeout = setTimeout(() => {
   setData(generateData());
   setShow(true);
  }, 15000);

  // Show subsequent popups every 30-60 seconds
  const interval = setInterval(() => {
   setData(generateData());
   setShow(true);
  }, 30000 + Math.random() * 30000);

  return () => {
   clearTimeout(initialTimeout);
   clearInterval(interval);
  };
 }, [generateData, enabled]);

 // Auto-hide after 5 seconds
 useEffect(() => {
  if (show) {
   const timeout = setTimeout(() => setShow(false), 5000);
   return () => clearTimeout(timeout);
  }
 }, [show, data]);

 // Don't render anything if disabled
 if (enabled === false || enabled === null) return null;

 return (
  <AnimatePresence>
   {show && (
    <motion.div
     initial={{ opacity: 0, x: -100, y: 0 }}
     animate={{ opacity: 1, x: 0, y: 0 }}
     exit={{ opacity: 0, x: -100 }}
     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
     className="fixed bottom-24 left-6 z-40 max-w-xs"
    >
     <div className="bg-card border border-border rounded-xl shadow-xl p-4 flex items-start gap-3 relative group">
      {/* Close button */}
      <button
       onClick={() => setShow(false)}
       className="absolute top-2 right-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
       aria-label="Close"
      >
       <X className="w-3.5 h-3.5" />
      </button>

      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
       <ShoppingBag className="w-5 h-5 text-emerald-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
       <p className="text-sm font-medium text-foreground">
        <span className="font-semibold">{data.name}</span>
        {' '}
        {language === 'bn' ? 'থেকে' : 'from'}
        {' '}
        <span className="text-primary">{data.city}</span>
       </p>
       <p className="text-xs text-muted-foreground mt-0.5">
        {language === 'bn' ? 'একটি ইকমার্স সলিউশন কিনেছেন' : 'purchased an ecommerce solution'}
       </p>
       <p className="text-[10px] text-muted-foreground/70 mt-1">
        {data.time}
       </p>
      </div>

      {/* Verified badge */}
      <div className="flex-shrink-0 mt-1">
       <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-medium">
        ✓ {language === 'bn' ? 'ভেরিফাইড' : 'Verified'}
       </span>
      </div>
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 );
};

export default SocialProofPopup;
