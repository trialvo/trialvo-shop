"use client";

import { ArrowRight, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

export function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-sale/10 dark:bg-sale/10 flex items-center justify-center mx-auto">
          <Heart size={32} className="text-sale" />
        </div>
        <span className="absolute -top-1 -right-1 text-lg">✨</span>
      </div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        Your wishlist is empty
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        Save items you love by clicking the heart icon on any product. They'll all appear here.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-[12px] font-semibold tracking-wide transition-colors shadow-sm hover:shadow-md hover:shadow-accent/20 cursor-pointer"
      >
        <Sparkles size={13} /> Start Shopping <ArrowRight size={13} />
      </Link>
    </div>
  );
}
