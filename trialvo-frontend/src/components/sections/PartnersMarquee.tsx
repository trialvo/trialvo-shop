import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const logos = [
 { name: 'bKash', color: '#E2136E' },
 { name: 'Nagad', color: '#F6921E' },
 { name: 'Rocket', color: '#8B2887' },
 { name: 'Visa', color: '#1A1F71' },
 { name: 'Mastercard', color: '#EB001B' },
 { name: 'SSL Commerce', color: '#2D4BC1' },
 { name: 'React', color: '#61DAFB' },
 { name: 'Node.js', color: '#339933' },
 { name: 'MongoDB', color: '#47A248' },
 { name: 'Tailwind', color: '#06B6D4' },
];

const PartnersMarquee: React.FC = () => {
 const { language } = useLanguage();

 return (
  <section className="py-12 border-y border-border/50 bg-muted/20 overflow-hidden">
   <div className="container-custom mb-6">
    <p className="text-center text-sm text-muted-foreground font-medium">
     {language === 'bn'
      ? 'আমাদের বিশ্বস্ত টেকনোলজি ও পেমেন্ট পার্টনার'
      : 'Our Trusted Technology & Payment Partners'}
    </p>
   </div>

   {/* Marquee */}
   <div className="relative">
    {/* Gradient masks */}
    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

    <motion.div
     className="flex gap-12 items-center"
     animate={{ x: ['0%', '-50%'] }}
     transition={{
      x: { duration: 25, repeat: Infinity, ease: 'linear' },
     }}
    >
     {/* Double the items for seamless loop */}
     {[...logos, ...logos].map((logo, index) => (
      <div
       key={index}
       className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-card border border-border/50 rounded-xl hover:border-primary/20 hover:shadow-sm transition-all"
      >
       <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: logo.color }}
       >
        {logo.name.charAt(0)}
       </div>
       <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {logo.name}
       </span>
      </div>
     ))}
    </motion.div>
   </div>
  </section>
 );
};

export default PartnersMarquee;
