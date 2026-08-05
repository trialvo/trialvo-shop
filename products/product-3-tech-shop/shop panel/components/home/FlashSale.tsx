"use client";

import { useState, useEffect, useMemo } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";
import { Zap } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { toUIProduct } from "@/lib/adapters/product";
import type { Product } from "@/data/products";
import { SectionHeader } from "@/components/shared/SectionHeader";

const FLASH_SKELETON_COUNT = 4;

const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 23,
    seconds: 47,
  });

  const { products: apiProducts, productsLoading } = useProducts({
    limit: 12,
    best_deal: true,
    status: true,
    in_stock: true,
  });

  const flashProducts: Product[] = useMemo(() => {
    return apiProducts
      .map((p) => toUIProduct(p, { forceBadge: "sale" }))
      .filter((p) => (p.discount ?? 0) >= 10)
      .slice(0, 4);
  }, [apiProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) return { hours: 23, minutes: 59, seconds: 59 };
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!productsLoading && flashProducts.length === 0) return null;

  return (
    <section className="container py-12 md:py-16">
      <SectionHeader
        title="Flash Sale"
        subtitle="Grab the deals before they're gone!"
        icon={<Zap />}
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Ends in:</span>
            {[
              { value: timeLeft.hours, label: "HRS" },
              { value: timeLeft.minutes, label: "MIN" },
              { value: timeLeft.seconds, label: "SEC" },
            ].map((t, i) => (
              <div key={t.label} className="flex items-center gap-1.5">
                <div className="gradient-primary text-primary-foreground w-10 h-10 rounded-sm flex flex-col items-center justify-center">
                  <span className="text-base font-bold font-heading leading-none tabular-nums">
                    {String(t.value).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] opacity-70">{t.label}</span>
                </div>
                {i < 2 ? (
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                ) : null}
              </div>
            ))}
          </div>
        }
      />
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        aria-busy={productsLoading || undefined}
        aria-label={productsLoading ? "Loading flash sale products" : undefined}
      >
        {productsLoading
          ? Array.from({ length: FLASH_SKELETON_COUNT }, (_, index) => (
              <ProductCardSkeleton key={`flash-skeleton-${index}`} />
            ))
          : flashProducts.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
};

export default FlashSale;
