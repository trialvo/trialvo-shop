"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  "New Arrivals", "Men's Clothing", "Women's Clothing", "Kids' Wear",
  "Footwear", "Fragrance", "Accessories", "Bags & Wallets", "Watches",
];

const slides = [
  { image: "/images/banners/hero-1.jpg", title: "Spring Collection 2026", subtitle: "Discover timeless elegance with our new arrivals", cta: "Shop Now" },
  { image: "/images/banners/hero-2.jpg", title: "Premium Fragrances", subtitle: "Exquisite scents for every occasion", cta: "Explore" },
];

const promoCards = [
  { image: "/images/banners/promo-accessories.jpg", title: "Accessories", subtitle: "Up to 40% off", href: "/shop?category=Accessories" },
  { image: "/images/banners/promo-shoes.jpg", title: "Footwear", subtitle: "New Season", href: "/shop?category=Footwear" },
];

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (dir: number) => {
    setCurrentSlide((prev) => (prev + dir + slides.length) % slides.length);
  };

  return (
    <section className="w-full bg-secondary">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex gap-4 lg:gap-5">
          {/* Left: Category Sidebar */}
          <div className="hidden lg:block w-[220px] shrink-0 bg-background rounded-lg border border-border overflow-hidden">
            <div className="py-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={cat === "New Arrivals" ? "/mega-sale" : `/shop?category=${encodeURIComponent(cat)}`}
                  className="flex items-center px-5 py-2.5 text-[13px] text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors font-body"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>


          {/* Center: Main Carousel */}
          <div className="flex-1 relative rounded-lg overflow-hidden group min-h-[280px] md:min-h-[380px] lg:min-h-[420px]">
            {slides.map((slide, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 lg:px-16">
                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-primary-foreground tracking-wider uppercase mb-3 drop-shadow-lg">{slide.title}</h2>
                  <p className="text-primary-foreground/80 text-sm md:text-base font-light tracking-wide max-w-md mb-6 drop-shadow">{slide.subtitle}</p>
                  <div>
                    <Link
                      href="/shop"
                      className="inline-block bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium transition-colors rounded"
                    >
                      {slide.cta}
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => goTo(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            <button onClick={() => goTo(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
              <ChevronRight size={18} className="text-foreground" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-accent w-6" : "bg-primary-foreground/50"}`} />
              ))}
            </div>
          </div>

          {/* Right: Promo Cards */}
          <div className="hidden xl:flex flex-col gap-4 w-[200px] shrink-0">
            {promoCards.map((card) => (
              <Link key={card.title} href={card.href} className="flex-1 relative rounded-lg overflow-hidden group/card">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-primary-foreground text-xs font-semibold tracking-wider uppercase">{card.title}</p>
                  <p className="text-primary-foreground/70 text-[11px] tracking-wide mt-0.5">{card.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
