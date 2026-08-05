"use client";

import Link from "next/link";
import { ArrowRight, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_CLASSES, CARD_HOVER_CLASSES } from "@/lib/theme";
import { useState, useEffect } from "react";

const flashDeals = [
  { id: 1, image: "/images/banners/side-banner-1.jpg", name: "Smart Watch Pro",     price: 89,  oldPrice: 149, category: "Accessories", badge: "52% OFF", href: "/shop?category=Accessories" },
  { id: 2, image: "/images/banners/side-banner-2.jpg", name: "Leather Backpack",    price: 59,  oldPrice: 99,  category: "Bags",        badge: "40% OFF", href: "/shop?category=Accessories" },
  { id: 3, image: "/images/banners/side-banner-3.jpg", name: "Grooming Kit Deluxe", price: 39,  oldPrice: 75,  category: "Grooming",    badge: "48% OFF", href: "/mega-sale" },
  { id: 4, image: "/images/banners/side-banner-4.jpg", name: "Luggage Set Premium", price: 119, oldPrice: 199, category: "Travel",      badge: "40% OFF", href: "/shop?category=Accessories" },
];

function useCountdown(endHours: number): { h: string; m: string; s: string } {
  const target = Date.now() + endHours * 3600 * 1000;
  const [remaining, setRemaining] = useState<number>(target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const h = String(Math.floor(remaining / 3600000)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  return { h, m, s };
}

const FlashDeals = () => {
  const { h, m, s } = useCountdown(5.5);

  return (
    <section className="w-full bg-foreground/[0.02] border-y border-border/60 py-6 sm:py-8 lg:py-10">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-sale text-sale-foreground px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm shadow-sale/25">
              <Zap size={13} className="fill-white" />
              <span className="text-[11px] sm:text-[12px] font-bold tracking-wide uppercase">Flash Deals</span>
            </div>
            {/* Countdown timer */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-foreground/70">
              <Clock size={12} className="text-sale hidden xs:block" />
              <span className="text-[10px] sm:text-[11px] tracking-wide text-muted-foreground hidden sm:inline">Ends in</span>
              {[h, m, s].map((unit, i) => (
                <span key={i} className="flex items-center gap-0.5 sm:gap-1">
                  <span className="bg-foreground text-background text-[11px] sm:text-[12px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded min-w-[1.75rem] sm:min-w-[2rem] text-center">
                    {unit}
                  </span>
                  {i < 2 && <span className="text-foreground/40 font-bold text-xs sm:text-sm">:</span>}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/mega-sale"
            className="flex items-center gap-1 text-[10px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.15em] uppercase text-sale hover:text-sale/80 font-semibold transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">See All</span> Deals <ArrowRight size={10} />
          </Link>
        </div>

        {/* Deal cards — xs: 2-col, md: 4-col */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
          {flashDeals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.href}
              className={cn("group relative flex flex-col cursor-pointer", CARD_CLASSES, CARD_HOVER_CLASSES, "hover:border-sale/20")}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={deal.image}
                  alt={deal.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 bg-sale text-sale-foreground text-[9px] sm:text-[10px] font-bold tracking-wide px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                  {deal.badge}
                </span>
              </div>

              {/* Info */}
              <div className="p-2.5 sm:p-3">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground tracking-wide uppercase mb-0.5 truncate">{deal.category}</p>
                <h3 className="text-[12px] sm:text-[13px] font-semibold text-foreground leading-snug group-hover:text-sale transition-colors truncate">
                  {deal.name}
                </h3>
                <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5">
                  <span className="text-sm sm:text-base font-bold text-foreground">${deal.price}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground line-through">${deal.oldPrice}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-sale rounded-full"
                      style={{ width: `${Math.round((1 - deal.price / deal.oldPrice) * 100) - 5}%` }}
                    />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-sale font-medium mt-0.5 tracking-wide">Selling fast!</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FlashDeals;
