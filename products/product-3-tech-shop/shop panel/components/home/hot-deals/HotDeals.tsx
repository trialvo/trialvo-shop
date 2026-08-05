"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Flame } from "lucide-react";
import { useMegaSale } from "@/hooks/useMegaSale";
import { useProducts } from "@/hooks/useProducts";
import { earliestEndAt } from "@/lib/time/countdown";
import {
  defaultHotDealEndAt,
  hotDealsFromListProducts,
} from "@/lib/adapters/megaSale";
import { HotDealsCountdown } from "./HotDealsCountdown";
import { HotDealFeaturedCard } from "./HotDealFeaturedCard";
import { HotDealSideCard } from "./HotDealSideCard";
import { HotDealsSkeleton } from "./HotDealsSkeleton";

/**
 * Unique Hot Deals arena.
 * Prefers mega-sale API; falls back to best_deal products so the section
 * never silently disappears when mega-sale is inactive.
 */
export default function HotDeals() {
  const { viewModel: megaView, isLoading: megaLoading } = useMegaSale({
    limit: 16,
    stock_filter: "in_stock",
    sort_by: "serial",
  });

  const needsFallback = !megaLoading && (!megaView.isActive || !megaView.featured);

  const { products: fallbackProducts, productsLoading: fallbackLoading } =
    useProducts(
      {
        limit: 12,
        best_deal: true,
        status: true,
        in_stock: true,
      },
      { enabled: needsFallback },
    );

  const fallbackView = useMemo(
    () =>
      hotDealsFromListProducts(fallbackProducts, {
        campaignEndAt: defaultHotDealEndAt(),
        sideLimit: 3,
      }),
    [fallbackProducts],
  );

  const isLoading = megaLoading || (needsFallback && fallbackLoading);
  const viewModel =
    megaView.isActive && megaView.featured ? megaView : fallbackView;

  if (isLoading) return <HotDealsSkeleton />;

  const { featured, sideDeals, campaignEndAt, totalDeals } = viewModel;
  if (!featured) return null;

  const countdownEndAt =
    earliestEndAt(campaignEndAt, featured.endAt) ?? defaultHotDealEndAt();

  return (
    <section className="py-12 md:py-16" data-section="hot-deals-arena">
      <div className="container">
        <div className="h-1 w-full gradient-accent rounded-t-sm" />

        <div className="hot-deals-stage hot-deals-glow rounded-b-sm overflow-hidden relative isolate border border-primary/20 border-t-0">
          <div
            className="absolute inset-0 hot-deals-grid pointer-events-none opacity-40"
            aria-hidden
          />

          <div className="relative border-b border-primary-foreground/10 bg-foreground/20 backdrop-blur-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-sm gradient-accent text-accent-foreground flex items-center justify-center shrink-0 animate-hot-pulse">
                  <Flame className="h-5 w-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-accent text-[10px] font-bold uppercase tracking-[0.2em]">
                    {megaView.isActive ? "Live mega sale" : "Today's hot picks"}
                  </p>
                  <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground truncate">
                    Hot Deals Arena
                  </h2>
                </div>
              </div>
              <HotDealsCountdown endAt={countdownEndAt} />
            </div>
          </div>

          <div className="relative p-4 sm:p-5 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
              <div className="lg:col-span-7 xl:col-span-8">
                <HotDealFeaturedCard deal={featured} />
              </div>

              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-primary-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Quick tickets
                  </p>
                  <span className="text-accent text-[10px] font-bold">
                    {Math.max(totalDeals, sideDeals.length + 1)} live
                  </span>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                  {sideDeals.length > 0 ? (
                    sideDeals.map((deal, index) => (
                      <HotDealSideCard
                        key={`${deal.productId}-${deal.skuId}`}
                        deal={deal}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="flex-1 rounded-sm border border-dashed border-primary-foreground/15 p-6 text-center text-primary-foreground/40 text-sm">
                      More tickets dropping soon
                    </div>
                  )}
                </div>

                <Link
                  href="/shop?badge=sale"
                  className="mt-1 group flex items-center justify-between gap-3 rounded-sm gradient-accent text-accent-foreground px-4 py-3.5 font-semibold text-sm hover:opacity-95 transition-opacity"
                >
                  <span>Browse all hot deals</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
