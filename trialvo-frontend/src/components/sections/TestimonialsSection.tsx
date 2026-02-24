import React, { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare, Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTestimonials, Testimonial } from '@/hooks/useTestimonials';
import { TestimonialSkeleton } from '@/components/ui/skeleton-card';

const StarRating: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted-foreground/10 text-muted-foreground/10'
          }`}
      />
    ))}
  </div>
);

// Featured / highlighted card (first testimonial)
const FeaturedCard: React.FC<{ testimonial: Testimonial; language: 'bn' | 'en' }> = ({ testimonial, language }) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="relative group"
  >
    {/* Gradient border effect */}
    <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/40 via-accent/30 to-primary/20 rounded-3xl opacity-70 group-hover:opacity-100 transition-opacity blur-[0.5px]" />

    <div className="relative bg-card rounded-3xl p-8 md:p-10 h-full overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.04),transparent_50%)]" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-accent/[0.05] to-transparent rounded-bl-full" />

      {/* Large decorative quote */}
      <div className="absolute -top-4 -left-2 pointer-events-none">
        <Quote className="w-24 h-24 text-primary/[0.06] rotate-180" />
      </div>

      <div className="relative z-10">
        {/* Featured badge */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            <Sparkles className="w-3 h-3" />
            {language === 'bn' ? 'সেরা রিভিউ' : 'Top Review'}
          </span>
          <StarRating rating={testimonial.rating} size="w-5 h-5" />
        </div>

        {/* Content */}
        <p className="text-foreground text-lg md:text-xl leading-relaxed mb-6 font-medium">
          "{testimonial.content[language]}"
        </p>

        {/* Review Images */}
        {testimonial.images && testimonial.images.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {testimonial.images.map((img, i) => (
              <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img
                  src={img}
                  alt={`Review ${i + 1}`}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover ring-1 ring-border hover:ring-primary/40 transition-all hover:scale-105 cursor-pointer"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-4">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name[language]}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/15 shadow-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/15 shadow-lg">
              <span className="text-white font-bold text-xl">
                {testimonial.name[language].charAt(0)}
              </span>
            </div>
          )}
          <div>
            <p className="font-bold text-base">{testimonial.name[language]}</p>
            <p className="text-sm text-muted-foreground">{testimonial.role[language]}</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Regular testimonial card
const TestimonialCard: React.FC<{
  testimonial: Testimonial;
  language: 'bn' | 'en';
  index: number;
}> = ({ testimonial, language, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="group"
  >
    <div className="relative bg-card border border-border rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:border-primary/25 hover:-translate-y-1.5 overflow-hidden">
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Quote watermark */}
      <div className="absolute -bottom-3 -right-3 pointer-events-none">
        <Quote className="w-20 h-20 text-primary/[0.04]" />
      </div>

      <div className="relative z-10">
        {/* Stars */}
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>

        {/* Content */}
        <p className="text-foreground/80 leading-relaxed mb-4 text-[0.92rem] line-clamp-4">
          "{testimonial.content[language]}"
        </p>

        {/* Review Images */}
        {testimonial.images && testimonial.images.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {testimonial.images.slice(0, 3).map((img, i) => (
              <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                <img
                  src={img}
                  alt={`Review ${i + 1}`}
                  className="w-12 h-12 rounded-lg object-cover ring-1 ring-border hover:ring-primary/40 transition-all"
                  loading="lazy"
                />
              </a>
            ))}
            {testimonial.images.length > 3 && (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                +{testimonial.images.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name[language]}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-border"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-border">
              <span className="text-primary font-bold">
                {testimonial.name[language].charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{testimonial.name[language]}</p>
            <p className="text-xs text-muted-foreground truncate">{testimonial.role[language]}</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection: React.FC = () => {
  const { language } = useLanguage();
  const { data: testimonials, isLoading } = useTestimonials();
  const [page, setPage] = useState(0);

  const featured = testimonials?.[0];
  const rest = testimonials?.slice(1) || [];
  const perPage = 3;
  const totalPages = Math.ceil(rest.length / perPage);
  const visibleRest = rest.slice(page * perPage, page * perPage + perPage);

  // Auto-advance
  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalPages]);

  const goToPrev = useCallback(() => setPage((p) => (p - 1 + totalPages) % totalPages), [totalPages]);
  const goToNext = useCallback(() => setPage((p) => (p + 1) % totalPages), [totalPages]);

  // Aggregate rating
  const avgRating = testimonials?.length
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '5.0';

  return (
    <section className="section-padding relative overflow-hidden" aria-labelledby="testimonials-title">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/20" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.1), transparent 70%)' }} />

      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {language === 'bn' ? 'গ্রাহকদের মতামত' : 'Customer Reviews'}
          </motion.span>
          <motion.h2
            id="testimonials-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {language === 'bn' ? (
              <>আমাদের গ্রাহকরা <span className="text-primary">কী বলছেন</span></>
            ) : (
              <>What Our Customers <span className="text-primary">Say</span></>
            )}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            {language === 'bn'
              ? 'আমাদের সন্তুষ্ট গ্রাহকদের অভিজ্ঞতা জানুন'
              : 'Hear from our satisfied customers about their experience'}
          </motion.p>

          {/* Aggregate rating */}
          {testimonials && testimonials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-3 mt-6"
            >
              <div className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-full shadow-sm">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold">{avgRating}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({testimonials.length} {language === 'bn' ? 'রিভিউ' : 'reviews'})
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <TestimonialSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {/* Layout: Featured + Grid */}
            <div className="grid lg:grid-cols-5 gap-6 mb-8">
              {/* Featured - takes 2 cols */}
              {featured && (
                <div className="lg:col-span-2">
                  <FeaturedCard testimonial={featured} language={language} />
                </div>
              )}

              {/* Regular cards - takes 3 cols */}
              <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence mode="wait">
                  {visibleRest.map((testimonial, index) => (
                    <TestimonialCard
                      key={testimonial.id || `t-${page}-${index}`}
                      testimonial={testimonial}
                      language={language}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom bar: Pagination dots + arrows */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-center gap-6"
              >
                <button
                  onClick={goToPrev}
                  className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center transition-all hover:border-primary/30 hover:bg-primary/5 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dots */}
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === page
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                        }`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNext}
                  className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center transition-all hover:border-primary/30 hover:bg-primary/5 hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
