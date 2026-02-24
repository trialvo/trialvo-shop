import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WhatsAppWidget: React.FC = () => {
 const [isOpen, setIsOpen] = useState(false);
 const { language } = useLanguage();

 const phoneNumber = '8801700000000';
 const defaultMessage = language === 'bn'
  ? 'হ্যালো! আমি আপনাদের ইকমার্স সলিউশন সম্পর্কে জানতে চাই।'
  : 'Hello! I want to know about your ecommerce solutions.';

 const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

 return (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
   {/* Chat Popup */}
   <AnimatePresence>
    {isOpen && (
     <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
     >
      {/* Header */}
      <div className="bg-[#25D366] p-4 flex items-center gap-3">
       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
       </div>
       <div className="flex-1">
        <p className="text-white font-semibold text-sm">
         {language === 'bn' ? 'ইশপ মার্কেট' : 'eShop Market'}
        </p>
        <p className="text-white/80 text-xs">
         {language === 'bn' ? 'সাধারণত কিছু মিনিটের মধ্যে রিপ্লাই দিই' : 'Typically replies within minutes'}
        </p>
       </div>
       <button
        onClick={() => setIsOpen(false)}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="Close"
       >
        <X className="w-5 h-5" />
       </button>
      </div>

      {/* Body */}
      <div className="p-4 bg-[#ECE5DD] dark:bg-muted/50 min-h-[100px]">
       <div className="bg-white dark:bg-card rounded-lg p-3 shadow-sm max-w-[85%] relative">
        <div className="absolute top-0 -left-2 w-0 h-0 border-t-8 border-t-white dark:border-t-card border-r-8 border-r-transparent" />
        <p className="text-sm text-foreground">
         {language === 'bn'
          ? '👋 আসসালামু আলাইকুম! আমাদের ইকমার্স সলিউশন সম্পর্কে কোনো প্রশ্ন থাকলে জানাবেন।'
          : '👋 Hi there! Let us know if you have any questions about our ecommerce solutions.'}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">
         {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
       </div>
      </div>

      {/* Footer - Start Chat */}
      <div className="p-3 bg-card border-t border-border">
       <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl font-medium text-sm transition-colors"
       >
        <MessageCircle className="w-4 h-4" />
        {language === 'bn' ? 'চ্যাট শুরু করুন' : 'Start Chat'}
       </a>
      </div>
     </motion.div>
    )}
   </AnimatePresence>

   {/* Main WhatsApp Button */}
   <motion.button
    onClick={() => setIsOpen(!isOpen)}
    className="w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg shadow-[#25D366]/30 flex items-center justify-center transition-colors relative"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    aria-label="WhatsApp Chat"
   >
    {/* Ping animation */}
    <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
    <svg className="w-7 h-7 relative z-10" fill="currentColor" viewBox="0 0 24 24">
     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
   </motion.button>
  </div>
 );
};

export default WhatsAppWidget;
