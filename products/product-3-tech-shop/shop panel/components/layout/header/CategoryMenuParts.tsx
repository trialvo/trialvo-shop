"use client";

import { ChevronRight } from "lucide-react";
import type { CategoryRailRow } from "@/lib/adapters/navCategory";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";

type CategoryRailListProps = {
  items: CategoryRailRow[];
  activeId: string | null;
  onHover: (id: string) => void;
  onNavigate: (href: string) => void;
  emptyLabel?: string;
  /** Show compact skeleton rows */
  loading?: boolean;
  skeletonCount?: number;
};

/**
 * Shared rail list — used for Main AND Sub columns (identical pattern).
 */
export function CategoryRailList({
  items,
  activeId,
  onHover,
  onNavigate,
  emptyLabel = "Nothing here yet",
  loading = false,
  skeletonCount = 6,
}: CategoryRailListProps) {
  if (loading) {
    return (
      <div className="p-2 space-y-1" aria-hidden>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm"
          >
            <div className="h-8 w-8 rounded-sm bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 max-w-[120px] rounded-sm bg-muted animate-pulse" />
              <div className="h-2 w-1/2 max-w-[80px] rounded-sm bg-muted/70 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground text-center">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="py-1">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onMouseEnter={() => onHover(item.id)}
            onFocus={() => onHover(item.id)}
            onClick={() => onNavigate(item.href)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm border-l-2 transition-colors ${
              isActive
                ? "border-l-primary bg-primary/10 text-primary"
                : "border-l-transparent text-foreground hover:bg-card hover:text-primary"
            }`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="w-8 h-8 rounded-sm object-cover bg-muted border border-border shrink-0"
                loading="lazy"
              />
            ) : (
              <span
                className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs shrink-0 border border-border ${
                  isActive ? "bg-primary/15" : "bg-card"
                }`}
              >
                📦
              </span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate leading-snug">
                {item.name}
              </span>
              {item.meta ? (
                <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">
                  {item.meta}
                </span>
              ) : null}
            </span>
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 ${
                isActive ? "text-primary" : "text-muted-foreground/45"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

type ChildCategoryGridProps = {
  items: { id: string; name: string; href: string; image: string | null }[];
  title: string;
  viewAllHref: string;
  onNavigate: (href: string) => void;
  loading?: boolean;
};

/**
 * Child categories — Alibaba multi-column layout with the same
 * image + label pattern used by main/sub rails.
 */
export function ChildCategoryGrid({
  items,
  title,
  viewAllHref,
  onNavigate,
  loading = false,
}: ChildCategoryGridProps) {
  if (loading) {
    return (
      <div className="p-5 space-y-4" aria-hidden>
        <div className="h-4 w-40 bg-muted animate-pulse rounded-sm" />
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-2 rounded-sm border border-border/60"
            >
              <div className="h-9 w-9 rounded-sm bg-muted animate-pulse shrink-0" />
              <div className="h-3 flex-1 bg-muted/80 animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[220px] text-center px-6 gap-3">
        <p className="text-sm text-muted-foreground">
          No types listed under{" "}
          <span className="font-medium text-foreground">{title}</span>
        </p>
        <button
          type="button"
          onClick={() => onNavigate(viewAllHref)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Browse {title}
          <RightArrowIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-border">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Shop by type
          </p>
          <h4 className="font-heading text-sm font-bold text-foreground">
            {title}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(viewAllHref)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
        >
          View all
          <RightArrowIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.href)}
            className="group flex items-center gap-2.5 text-left p-2 rounded-sm border border-transparent hover:border-border hover:bg-secondary/80 transition-colors min-w-0"
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="w-9 h-9 rounded-sm object-cover bg-muted border border-border shrink-0"
                loading="lazy"
              />
            ) : (
              <span className="w-9 h-9 rounded-sm flex items-center justify-center text-xs shrink-0 border border-border bg-card text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                📦
              </span>
            )}
            <span className="text-[13px] leading-snug font-medium text-muted-foreground group-hover:text-primary transition-colors line-clamp-2 min-w-0">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => onNavigate(viewAllHref)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          See all in {title}
          <RightArrowIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Full flyout skeleton — 3 columns */
export function CategoryFlyoutSkeleton() {
  return (
    <div
      className="flex min-h-[400px] max-h-[min(76vh,540px)] bg-card border border-border shadow-product-hover rounded-sm overflow-hidden"
      aria-busy
      aria-label="Loading categories"
    >
      {[0, 1].map((col) => (
        <div
          key={col}
          className={`w-[210px] shrink-0 border-r border-border ${
            col === 0 ? "bg-secondary/60" : "bg-secondary/40"
          }`}
        >
          <div className="px-3.5 py-3 border-b border-border space-y-1.5">
            <div className="h-2.5 w-24 bg-muted animate-pulse rounded-sm" />
            <div className="h-3 w-16 bg-muted/70 animate-pulse rounded-sm" />
          </div>
          <div className="p-2 space-y-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                <div className="h-8 w-8 rounded-sm bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded-sm" />
                  <div className="h-2 w-14 bg-muted/60 animate-pulse rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex-1 min-w-[280px] p-5 space-y-4">
        <div className="flex justify-between border-b border-border pb-3">
          <div className="space-y-1.5">
            <div className="h-2.5 w-20 bg-muted animate-pulse rounded-sm" />
            <div className="h-4 w-36 bg-muted animate-pulse rounded-sm" />
          </div>
          <div className="h-3 w-16 bg-muted animate-pulse rounded-sm" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-sm border border-border/50"
            >
              <div className="h-9 w-9 rounded-sm bg-muted animate-pulse shrink-0" />
              <div className="h-3 flex-1 bg-muted/80 animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
