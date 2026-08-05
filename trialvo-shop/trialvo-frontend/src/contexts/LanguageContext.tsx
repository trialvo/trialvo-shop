import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Navigation
    'nav.home': 'হোম',
    'nav.products': 'প্রোডাক্ট',
    'nav.about': 'আমাদের সম্পর্কে',
    'nav.contact': 'যোগাযোগ',
    'nav.terms': 'শর্তাবলী',
    'nav.privacy': 'গোপনীয়তা নীতি',
    
    // Hero Section
    'hero.title': 'রেডিমেড ইকমার্স ওয়েবসাইট',
    'hero.subtitle': 'এডমিন প্যানেল সহ সম্পূর্ণ ইকমার্স সলিউশন',
    'hero.description': 'আপনার ব্যবসার জন্য প্রফেশনাল ইকমার্স ওয়েবসাইট কিনুন। এডমিন প্যানেল + শপ ওয়েবসাইট - সবকিছু একসাথে।',
    'hero.cta.products': 'প্রোডাক্ট দেখুন',
    'hero.cta.contact': 'যোগাযোগ করুন',
    
    // Our Goal Section
    'goal.title': 'আমাদের লক্ষ্য',
    'goal.description': 'বাংলাদেশের উদ্যোক্তাদের জন্য সাশ্রয়ী মূল্যে প্রফেশনাল ইকমার্স সলিউশন সরবরাহ করা। আমরা বিশ্বাস করি প্রতিটি ব্যবসার অনলাইন উপস্থিতি থাকা উচিত।',
    
    // Categories
    'categories.title': 'ক্যাটাগরি',
    'categories.subtitle': 'আপনার ব্যবসার জন্য সঠিক সলিউশন খুঁজুন',
    'category.ecommerce': 'ইকমার্স',
    'category.fashion': 'ফ্যাশন',
    'category.gift': 'গিফট শপ',
    'category.accessories': 'একসেসরিজ',
    'category.tech': 'টেক প্রোডাক্ট',
    
    // Featured Products
    'featured.title': 'জনপ্রিয় প্রোডাক্ট',
    'featured.subtitle': 'আমাদের বেস্ট সেলিং ইকমার্স সলিউশন',
    
    // How It Works
    'howItWorks.title': 'কিভাবে কাজ করে?',
    'howItWorks.step1.title': 'প্রোডাক্ট বাছাই করুন',
    'howItWorks.step1.description': 'আপনার ব্যবসার জন্য সঠিক ইকমার্স সলিউশন বাছাই করুন',
    'howItWorks.step2.title': 'পেমেন্ট করুন',
    'howItWorks.step2.description': 'নিরাপদ পেমেন্ট গেটওয়ে দিয়ে পেমেন্ট সম্পন্ন করুন',
    'howItWorks.step3.title': 'এক্সেস পান',
    'howItWorks.step3.description': 'ইমেইলে সোর্স কোড ও ডকুমেন্টেশন পেয়ে যান',
    'howItWorks.step4.title': 'ডিপ্লয় করুন',
    'howItWorks.step4.description': 'আপনার হোস্টিং-এ সাইট ডিপ্লয় করে ব্যবসা শুরু করুন',
    
    // Trust Section
    'trust.title': 'কেন আমাদের বেছে নেবেন?',
    'trust.support.title': '২৪/৭ সাপোর্ট',
    'trust.support.description': 'যেকোনো সমস্যায় আমরা সবসময় আছি',
    'trust.secure.title': 'নিরাপদ পেমেন্ট',
    'trust.secure.description': 'SSL সুরক্ষিত পেমেন্ট গেটওয়ে',
    'trust.fast.title': 'দ্রুত সেটআপ',
    'trust.fast.description': '২৪ ঘন্টার মধ্যে ডেলিভারি',
    
    // Product Details
    'product.features': 'ফিচার সমূহ',
    'product.facilities': 'সুবিধা সমূহ',
    'product.screenshots.admin': 'এডমিন স্ক্রিনশট',
    'product.screenshots.shop': 'শপ স্ক্রিনশট',
    'product.demo': 'ডেমো দেখুন',
    'product.demoAccess': 'ডেমো এক্সেস',
    'product.demoNote': 'ডেমো ক্রেডেনশিয়াল শুধুমাত্র প্রিভিউ এর জন্য। সেটিংস পরিবর্তন করবেন না।',
    'product.adminPanel': 'এডমিন প্যানেল',
    'product.shopWebsite': 'শপ ওয়েবসাইট',
    'product.username': 'ইউজারনেম',
    'product.password': 'পাসওয়ার্ড',
    'product.copy': 'কপি',
    'product.copied': 'কপি হয়েছে!',
    'product.faq': 'সাধারণ প্রশ্নাবলী',
    'product.related': 'সম্পর্কিত প্রোডাক্ট',
    'product.buyNow': 'এখনই কিনুন',
    'product.viewDetails': 'বিস্তারিত দেখুন',
    'product.viewDemo': 'ডেমো দেখুন',
    'product.price': 'মূল্য',
    'product.introVideo': 'পরিচিতি ভিডিও',
    
    // Checkout
    'checkout.title': 'চেকআউট',
    'checkout.orderSummary': 'অর্ডার সামারি',
    'checkout.customerInfo': 'আপনার তথ্য',
    'checkout.name': 'নাম',
    'checkout.email': 'ইমেইল',
    'checkout.phone': 'ফোন নম্বর',
    'checkout.company': 'কোম্পানি (ঐচ্ছিক)',
    'checkout.hosting': 'হোস্টিং/ডোমেইন প্রয়োজন?',
    'checkout.notes': 'অতিরিক্ত মন্তব্য',
    'checkout.paymentMethod': 'পেমেন্ট মাধ্যম',
    'checkout.placeOrder': 'অর্ডার সম্পন্ন করুন',
    'checkout.processing': 'প্রসেসিং...',
    
    // Order Success
    'orderSuccess.title': 'অর্ডার সম্পন্ন হয়েছে!',
    'orderSuccess.thankYou': 'আপনার অর্ডারের জন্য ধন্যবাদ',
    'orderSuccess.orderId': 'অর্ডার আইডি',
    'orderSuccess.message': 'আপনার ইমেইলে অর্ডার কনফার্মেশন ও পরবর্তী নির্দেশনা পাঠানো হয়েছে।',
    'orderSuccess.instructions': 'পরবর্তী পদক্ষেপ',
    'orderSuccess.step1': 'আপনার ইমেইল চেক করুন',
    'orderSuccess.step2': 'সোর্স কোড ডাউনলোড করুন',
    'orderSuccess.step3': 'ডকুমেন্টেশন পড়ুন',
    'orderSuccess.step4': 'আপনার সার্ভারে ডিপ্লয় করুন',
    'orderSuccess.backHome': 'হোমে ফিরুন',
    
    // About
    'about.title': 'আমাদের সম্পর্কে',
    'about.mission.title': 'আমাদের মিশন',
    'about.mission.description': 'বাংলাদেশের প্রতিটি ব্যবসাকে ডিজিটাল করতে সাহায্য করা। আমরা বিশ্বাস করি প্রফেশনাল ওয়েবসাইট সবার জন্য সহজলভ্য হওয়া উচিত।',
    'about.vision.title': 'আমাদের ভিশন',
    'about.vision.description': 'বাংলাদেশে ইকমার্স সলিউশনের সবচেয়ে বিশ্বস্ত প্রোভাইডার হওয়া।',
    
    // Contact
    'contact.title': 'যোগাযোগ করুন',
    'contact.subtitle': 'আমাদের সাথে কথা বলুন',
    'contact.form.name': 'আপনার নাম',
    'contact.form.email': 'ইমেইল',
    'contact.form.subject': 'বিষয়',
    'contact.form.message': 'বার্তা',
    'contact.form.submit': 'পাঠান',
    'contact.info.title': 'যোগাযোগের তথ্য',
    'contact.info.email': 'ইমেইল',
    'contact.info.phone': 'ফোন',
    'contact.info.address': 'ঠিকানা',
    
    // Footer
    'footer.description': 'বাংলাদেশের সেরা রেডিমেড ইকমার্স সলিউশন প্রোভাইডার',
    'footer.quickLinks': 'দ্রুত লিংক',
    'footer.support': 'সাপোর্ট',
    'footer.legal': 'আইনি',
    'footer.copyright': '© ২০২৫ সর্বস্বত্ব সংরক্ষিত',
    
    // Common
    'common.bdt': '৳',
    'common.usd': '$',
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'একটি ত্রুটি হয়েছে',
    'common.readMore': 'আরো পড়ুন',
    'common.seeAll': 'সব দেখুন',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.terms': 'Terms & Conditions',
    'nav.privacy': 'Privacy Policy',
    
    // Hero Section
    'hero.title': 'Ready-Made Ecommerce Websites',
    'hero.subtitle': 'Complete Ecommerce Solution with Admin Panel',
    'hero.description': 'Buy professional ecommerce websites for your business. Admin Panel + Shop Website - everything included.',
    'hero.cta.products': 'View Products',
    'hero.cta.contact': 'Contact Sales',
    
    // Our Goal Section
    'goal.title': 'Our Goal',
    'goal.description': 'To provide affordable professional ecommerce solutions for entrepreneurs in Bangladesh. We believe every business deserves an online presence.',
    
    // Categories
    'categories.title': 'Categories',
    'categories.subtitle': 'Find the right solution for your business',
    'category.ecommerce': 'Ecommerce',
    'category.fashion': 'Fashion',
    'category.gift': 'Gift Shop',
    'category.accessories': 'Accessories',
    'category.tech': 'Tech Products',
    
    // Featured Products
    'featured.title': 'Featured Products',
    'featured.subtitle': 'Our best-selling ecommerce solutions',
    
    // How It Works
    'howItWorks.title': 'How It Works?',
    'howItWorks.step1.title': 'Choose Product',
    'howItWorks.step1.description': 'Select the right ecommerce solution for your business',
    'howItWorks.step2.title': 'Make Payment',
    'howItWorks.step2.description': 'Complete payment through secure payment gateway',
    'howItWorks.step3.title': 'Get Access',
    'howItWorks.step3.description': 'Receive source code and documentation via email',
    'howItWorks.step4.title': 'Deploy',
    'howItWorks.step4.description': 'Deploy to your hosting and start your business',
    
    // Trust Section
    'trust.title': 'Why Choose Us?',
    'trust.support.title': '24/7 Support',
    'trust.support.description': 'We are always here to help you',
    'trust.secure.title': 'Secure Payment',
    'trust.secure.description': 'SSL secured payment gateway',
    'trust.fast.title': 'Fast Setup',
    'trust.fast.description': 'Delivery within 24 hours',
    
    // Product Details
    'product.features': 'Features',
    'product.facilities': 'Facilities',
    'product.screenshots.admin': 'Admin Screenshots',
    'product.screenshots.shop': 'Shop Screenshots',
    'product.demo': 'View Demo',
    'product.demoAccess': 'Demo Access',
    'product.demoNote': 'Demo credentials are for preview only. Do not change settings.',
    'product.adminPanel': 'Admin Panel',
    'product.shopWebsite': 'Shop Website',
    'product.username': 'Username',
    'product.password': 'Password',
    'product.copy': 'Copy',
    'product.copied': 'Copied!',
    'product.faq': 'Frequently Asked Questions',
    'product.related': 'Related Products',
    'product.buyNow': 'Buy Now',
    'product.viewDetails': 'View Details',
    'product.viewDemo': 'View Demo',
    'product.price': 'Price',
    'product.introVideo': 'Introduction Video',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.orderSummary': 'Order Summary',
    'checkout.customerInfo': 'Your Information',
    'checkout.name': 'Name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone Number',
    'checkout.company': 'Company (Optional)',
    'checkout.hosting': 'Need Hosting/Domain?',
    'checkout.notes': 'Additional Notes',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.placeOrder': 'Place Order',
    'checkout.processing': 'Processing...',
    
    // Order Success
    'orderSuccess.title': 'Order Successful!',
    'orderSuccess.thankYou': 'Thank you for your order',
    'orderSuccess.orderId': 'Order ID',
    'orderSuccess.message': 'Order confirmation and next steps have been sent to your email.',
    'orderSuccess.instructions': 'Next Steps',
    'orderSuccess.step1': 'Check your email',
    'orderSuccess.step2': 'Download source code',
    'orderSuccess.step3': 'Read documentation',
    'orderSuccess.step4': 'Deploy to your server',
    'orderSuccess.backHome': 'Back to Home',
    
    // About
    'about.title': 'About Us',
    'about.mission.title': 'Our Mission',
    'about.mission.description': 'To help every business in Bangladesh go digital. We believe professional websites should be accessible to everyone.',
    'about.vision.title': 'Our Vision',
    'about.vision.description': 'To become the most trusted ecommerce solution provider in Bangladesh.',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Get in touch with us',
    'contact.form.name': 'Your Name',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.submit': 'Send',
    'contact.info.title': 'Contact Information',
    'contact.info.email': 'Email',
    'contact.info.phone': 'Phone',
    'contact.info.address': 'Address',
    
    // Footer
    'footer.description': 'Best ready-made ecommerce solution provider in Bangladesh',
    'footer.quickLinks': 'Quick Links',
    'footer.support': 'Support',
    'footer.legal': 'Legal',
    'footer.copyright': '© 2025 All Rights Reserved',
    
    // Common
    'common.bdt': '৳',
    'common.usd': '$',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.readMore': 'Read More',
    'common.seeAll': 'See All',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    // Check URL for language preference
    const path = window.location.pathname;
    if (path.startsWith('/en')) {
      setLanguageState('en');
    } else {
      // Default to Bengali or check localStorage
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang && (savedLang === 'bn' || savedLang === 'en')) {
        setLanguageState(savedLang);
      }
    }
  }, []);

  useEffect(() => {
    // Update body class for font family
    document.body.classList.remove('lang-bn', 'lang-en');
    document.body.classList.add(`lang-${language}`);
    
    // Update document language
    document.documentElement.lang = language;
    
    // Save to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
