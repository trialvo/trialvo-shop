"use client";

import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";

const promos = [
  {
    image:    "/images/banners/promo-banner-wide.jpg",
    tag:      "Limited Time",
    title:    "Eid Special",
    subtitle: "Up to 50% off on fashion, fragrance & accessories",
    cta:      "Shop the Sale",
    href:     "/mega-sale",
    accent:   true,
  },
];

const miniPromos = [
  {
    image:    "/images/banners/promo-accessories.jpg",
    tag:      "Trending",
    title:    "Accessories",
    subtitle: "Up to 40% off this season",
    href:     "/shop?category=Accessories",
  },
  {
    image:    "/images/banners/promo-shoes.jpg",
    tag:      "New Season",
    title:    "Footwear",
    subtitle: "Fresh drops every week",
    href:     "/shop?category=Footwear",
  },
];

const PromoBanner = () => {
  return (
    <section className="w-full bg-background py-6 sm:py-8 lg:py-12">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">

        {/* ── Main wide promo ── */}
        {promos.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="group relative flex overflow-hidden rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg hover:shadow-foreground/8 transition-shadow duration-300 cursor-pointer min-h-[130px] sm:min-h-[170px] md:min-h-[200px] lg:min-h-[240px]"
          >
            <img
              src={p.image}
              alt={p.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-foreground/10" />
            <div className="relative z-10 flex flex-col justify-center px-5 sm:px-10 lg:px-14 py-5 sm:py-6">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Tag size={9} className="text-accent" />
                <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-semibold text-accent">
                  {p.tag}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-background tracking-wide uppercase drop-shadow-lg leading-tight mb-1.5 sm:mb-2">
                {p.title}
              </h2>
              <p className="hidden sm:block text-background/70 text-xs sm:text-sm tracking-wide max-w-sm drop-shadow mb-4 sm:mb-6">
                {p.subtitle}
              </p>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 self-start bg-accent hover:bg-accent/90 text-accent-foreground px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold transition-all rounded-full shadow-lg group-hover:gap-2 sm:group-hover:gap-3">
                {p.cta} <ArrowRight size={10} />
              </span>
            </div>
          </Link>
        ))}

        {/* ── Mini promo pair — xs: 1-col, sm+: 2-col ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {miniPromos.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer min-h-[100px] sm:min-h-[130px] md:min-h-[140px]"
            >
              <img
                src={p.image}
                alt={p.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/65 via-foreground/30 to-transparent" />
              <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 py-4 sm:py-5">
                <span className="text-[9px] tracking-[0.25em] uppercase font-semibold text-accent mb-1">
                  {p.tag}
                </span>
                <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-background tracking-wide uppercase drop-shadow-lg">
                  {p.title}
                </h3>
                <p className="hidden sm:block text-background/65 text-xs tracking-wide mt-0.5 drop-shadow">{p.subtitle}</p>
                <span className="hidden sm:flex items-center gap-1 mt-2 text-[10px] tracking-[0.2em] uppercase text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop Now <ArrowRight size={10} />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PromoBanner;
