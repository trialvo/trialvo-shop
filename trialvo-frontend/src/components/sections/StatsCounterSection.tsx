import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface CounterProps {
 end: number;
 suffix?: string;
 prefix?: string;
 duration?: number;
}

const AnimatedCounter: React.FC<CounterProps> = ({ end, suffix = '', prefix = '', duration = 2 }) => {
 const [count, setCount] = useState(0);
 const ref = useRef<HTMLDivElement>(null);
 const hasAnimated = useRef(false);

 useEffect(() => {
  const observer = new IntersectionObserver(
   (entries) => {
    if (entries[0].isIntersecting && !hasAnimated.current) {
     hasAnimated.current = true;
     const startTime = performance.now();
     const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
       requestAnimationFrame(animate);
      }
     };
     requestAnimationFrame(animate);
    }
   },
   { threshold: 0.5 }
  );
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
 }, [end, duration]);

 return (
  <div ref={ref} className="text-4xl md:text-5xl font-bold text-primary">
   {prefix}{count.toLocaleString()}{suffix}
  </div>
 );
};

const StatsCounterSection: React.FC = () => {
 const { language } = useLanguage();

 const stats = [
  {
   end: 500,
   suffix: '+',
   label: language === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Happy Customers',
   description: language === 'bn' ? 'সফল ডেলিভারি সম্পন্ন' : 'Successful deliveries completed',
  },
  {
   end: 50,
   suffix: '+',
   label: language === 'bn' ? 'রেডিমেড সলিউশন' : 'Ready Solutions',
   description: language === 'bn' ? 'বিভিন্ন ক্যাটাগরির প্রোডাক্ট' : 'Products across categories',
  },
  {
   end: 24,
   suffix: '/7',
   label: language === 'bn' ? 'সাপোর্ট সেবা' : 'Support Service',
   description: language === 'bn' ? 'যেকোনো সময় সহায়তা' : 'Help whenever you need',
  },
  {
   end: 99,
   suffix: '%',
   label: language === 'bn' ? 'গ্রাহক সন্তুষ্টি' : 'Satisfaction Rate',
   description: language === 'bn' ? 'পজিটিভ রিভিউ পেয়েছি' : 'Positive reviews received',
  },
 ];

 return (
  <section className="py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
   {/* Background decorations */}
   <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
   </div>

   <div className="container-custom relative z-10">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
     {stats.map((stat, index) => (
      <motion.div
       key={index}
       className="text-center"
       initial={{ opacity: 0, y: 30 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
       transition={{ delay: index * 0.1, duration: 0.5 }}
      >
       <AnimatedCounter
        end={stat.end}
        suffix={stat.suffix}
       />
       <h3 className="text-lg font-semibold mt-2 mb-1">{stat.label}</h3>
       <p className="text-sm text-primary-foreground/60">{stat.description}</p>
      </motion.div>
     ))}
    </div>
   </div>
  </section>
 );
};

export default StatsCounterSection;
