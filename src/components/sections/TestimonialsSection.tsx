import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Testimonial {
 name: { bn: string; en: string };
 role: { bn: string; en: string };
 content: { bn: string; en: string };
 rating: number;
 avatar: string;
}

const testimonials: Testimonial[] = [
 {
  name: { bn: 'রাকিব হাসান', en: 'Rakib Hasan' },
  role: { bn: 'ফ্যাশন স্টোর মালিক', en: 'Fashion Store Owner' },
  content: {
   bn: 'ইশপ মার্কেট থেকে ওয়েবসাইট কেনার পর আমার বিজনেজ ২০০% বেড়ে গেছে। এডমিন প্যানেল খুবই সহজ, যে কেউ ব্যবহার করতে পারবে।',
   en: 'After buying from eShop Market, my business grew 200%. The admin panel is so easy, anyone can use it.',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
 },
 {
  name: { bn: 'ফারিহা আক্তার', en: 'Fariha Akter' },
  role: { bn: 'গিফট শপ মালিক', en: 'Gift Shop Owner' },
  content: {
   bn: 'সাপোর্ট টিম অসাধারণ! যেকোনো সমস্যায় তারা দ্রুত সাহায্য করে। ওয়েবসাইটের ডিজাইনও প্রফেশনাল।',
   en: 'Support team is amazing! They help quickly with any issue. Website design is very professional too.',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
 },
 {
  name: { bn: 'মাহমুদ আলী', en: 'Mahmud Ali' },
  role: { bn: 'টেক গ্যাজেট বিক্রেতা', en: 'Tech Gadget Seller' },
  content: {
   bn: 'পেমেন্ট গেটওয়ে ইন্টিগ্রেশন সহ রেডিমেড ওয়েবসাইট পেয়ে খুব খুশি। bKash ও Nagad সাপোর্ট থাকায় কাস্টমারদের সুবিধা হয়েছে।',
   en: 'Very happy with the ready-made website including payment gateway. bKash and Nagad support made it convenient for customers.',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
 },
];

const TestimonialsSection: React.FC = () => {
 const { language } = useLanguage();

 const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
   opacity: 1,
   transition: { staggerChildren: 0.15 },
  },
 };

 const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
 };

 return (
  <section className="section-padding bg-muted/30" aria-labelledby="testimonials-title">
   <div className="container-custom">
    {/* Section Header */}
    <div className="text-center mb-14">
     <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4"
     >
      {language === 'bn' ? 'গ্রাহকদের মতামত' : 'Customer Reviews'}
     </motion.span>
     <motion.h2
      id="testimonials-title"
      className="text-3xl md:text-4xl font-bold mb-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
     >
      {language === 'bn'
       ? 'আমাদের গ্রাহকরা কী বলছেন'
       : 'What Our Customers Say'}
     </motion.h2>
     <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-muted-foreground text-lg max-w-2xl mx-auto"
     >
      {language === 'bn'
       ? 'আমাদের সন্তুষ্ট গ্রাহকদের অভিজ্ঞতা জানুন'
       : 'Learn from the experiences of our satisfied customers'}
     </motion.p>
    </div>

    {/* Testimonials Grid */}
    <motion.div
     className="grid md:grid-cols-3 gap-6 lg:gap-8"
     variants={containerVariants}
     initial="hidden"
     whileInView="visible"
     viewport={{ once: true }}
    >
     {testimonials.map((testimonial, index) => (
      <motion.div
       key={index}
       variants={itemVariants}
       className="group relative"
      >
       <div className="relative bg-card border border-border rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 overflow-hidden">
        {/* Gradient Background on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quote Icon */}
        <div className="relative z-10">
         <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
          <Quote className="w-5 h-5 text-accent" />
         </div>

         {/* Rating Stars */}
         <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
           <Star key={i} className="w-4 h-4 fill-accent text-accent" />
          ))}
         </div>

         {/* Content */}
         <p className="text-foreground/80 leading-relaxed mb-6 text-[0.95rem]">
          "{testimonial.content[language]}"
         </p>

         {/* Author */}
         <div className="flex items-center gap-3 pt-4 border-t border-border">
          <img
           src={testimonial.avatar}
           alt={testimonial.name[language]}
           className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
           loading="lazy"
          />
          <div>
           <p className="font-semibold text-sm">{testimonial.name[language]}</p>
           <p className="text-xs text-muted-foreground">{testimonial.role[language]}</p>
          </div>
         </div>
        </div>
       </div>
      </motion.div>
     ))}
    </motion.div>
   </div>
  </section>
 );
};

export default TestimonialsSection;
