import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const ScrollToTopButton: React.FC = () => {
 const [show, setShow] = useState(false);

 useEffect(() => {
  const handleScroll = () => {
   setShow(window.scrollY > 500);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 return (
  <AnimatePresence>
   {show && (
    <motion.button
     initial={{ opacity: 0, scale: 0.5 }}
     animate={{ opacity: 1, scale: 1 }}
     exit={{ opacity: 0, scale: 0.5 }}
     whileHover={{ scale: 1.1 }}
     whileTap={{ scale: 0.9 }}
     onClick={scrollToTop}
     className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 flex items-center justify-center hover:shadow-xl transition-shadow"
     aria-label="Scroll to top"
    >
     <ArrowUp className="w-5 h-5" />
    </motion.button>
   )}
  </AnimatePresence>
 );
};

export default ScrollToTopButton;
