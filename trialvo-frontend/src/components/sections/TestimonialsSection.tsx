import React from 'react';
import { Star, Quote, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTestimonials } from '@/hooks/useTestimonials';

const TestimonialsSection: React.FC = () => {
  const { language } = useLanguage();
  const { data: testimonials, isLoading } = useTestimonials();

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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Testimonials Grid */
          <motion.div
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials?.map((testimonial, index) => (
              <motion.div
                key={testimonial.id || index}
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
                      {testimonial.avatar ? (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name[language]}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                          <span className="text-primary font-semibold text-lg">
                            {testimonial.name[language].charAt(0)}
                          </span>
                        </div>
                      )}
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
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
