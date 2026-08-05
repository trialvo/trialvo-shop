"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { NavMainCategory } from "@/lib/adapters/navCategory";
import type { Brand } from "@/lib/api/brand/service";
import { AppButton } from "@/components/shared/AppButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopCheckboxFilter } from "@/components/shop/ShopCheckboxFilter";
import { ShopPriceFilter } from "@/components/shop/ShopPriceFilter";
import { sanitizeCategorySlug } from "@/lib/shop/categoryRoutes";
import { SHOP_DEFAULT_MAX_PRICE } from "@/lib/shop/shopFilters";
import { cn } from "@/lib/utils";

export type ShopPriceRange = readonly [number, number];

type ShopFiltersPanelProps = Readonly<{
  navCategories: NavMainCategory[];
  categoriesLoading?: boolean;
  categorySlug: string;
  priceRange: ShopPriceRange;
  onPriceRangeChange: (range: [number, number]) => void;
  brands: Brand[];
  brandsLoading?: boolean;
  selectedBrandIds: number[];
  onToggleBrand: (brandId: number) => void;
  freeDelivery: boolean;
  onFreeDeliveryChange: (value: boolean) => void;
  inStock: boolean;
  onInStockChange: (value: boolean) => void;
  onClear: () => void;
  compact?: boolean;
}>;

function FilterSectionSkeleton({
  titleWidth = "w-24",
}: Readonly<{ titleWidth?: string }>): ReactElement {
  return (
    <div className="space-y-3">
      <Skeleton className={`h-4 ${titleWidth}`} />
      <Skeleton className="h-9 w-full rounded-sm" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`filter-skel-${i}`} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Polished shop filter sidebar — clear sections, large hit targets, active cues.
 */
export function ShopFiltersPanel({
  navCategories,
  categoriesLoading = false,
  categorySlug,
  priceRange,
  onPriceRangeChange,
  brands,
  brandsLoading = false,
  selectedBrandIds,
  onToggleBrand,
  freeDelivery,
  onFreeDeliveryChange,
  inStock,
  onInStockChange,
  onClear,
  compact = false,
}: ShopFiltersPanelProps): ReactElement {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activeMainId = useMemo(() => {
    for (const main of navCategories) {
      if (main.slug === categorySlug) return main.id;
      for (const sub of main.subs) {
        if (sub.slug === categorySlug) return main.id;
        for (const child of sub.children) {
          if (sanitizeCategorySlug(child.name) === categorySlug) return main.id;
        }
      }
    }
    return null;
  }, [navCategories, categorySlug]);

  useEffect(() => {
    if (!activeMainId) return;
    setExpandedIds((prev) => {
      if (prev.has(activeMainId)) return prev;
      const next = new Set(prev);
      next.add(activeMainId);
      return next;
    });
  }, [activeMainId]);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ id: b.id, name: b.name })),
    [brands],
  );

  const selectedBrandIdSet = useMemo(
    () => new Set(selectedBrandIds.map(String)),
    [selectedBrandIds],
  );

  const activeCount =
    (categorySlug ? 1 : 0) +
    selectedBrandIds.length +
    (priceRange[0] > 0 || priceRange[1] < SHOP_DEFAULT_MAX_PRICE ? 1 : 0) +
    (freeDelivery ? 1 : 0) +
    (inStock ? 1 : 0);

  const hasActiveFilters = activeCount > 0;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-0")}>
      {/* Header */}
      <div
        className={cn(
          "flex items-start justify-between gap-3",
          !compact && "pb-4",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Filters
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Narrow your results
            </p>
          </div>
        </div>
        {hasActiveFilters ? (
          <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </div>

      {!compact ? <Separator className="mb-5" /> : null}

      <div className="space-y-5">
        {/* Availability */}
        <section className="space-y-2.5">
          <h3 className="text-sm font-semibold text-foreground">Availability</h3>
          <div className="space-y-0.5">
            <label
              className={cn(
                "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
                freeDelivery
                  ? "bg-primary/10 font-medium text-foreground"
                  : "hover:bg-secondary/80",
              )}
            >
              <Checkbox
                checked={freeDelivery}
                onCheckedChange={(v) => onFreeDeliveryChange(v === true)}
              />
              <span>Free delivery</span>
            </label>
            <label
              className={cn(
                "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
                inStock
                  ? "bg-primary/10 font-medium text-foreground"
                  : "hover:bg-secondary/80",
              )}
            >
              <Checkbox
                checked={inStock}
                onCheckedChange={(v) => onInStockChange(v === true)}
              />
              <span>In stock only</span>
            </label>
          </div>
        </section>

        <Separator />

        <ShopPriceFilter
          value={{ min: priceRange[0], max: priceRange[1] }}
          onChange={(next) => onPriceRangeChange([next.min, next.max])}
        />

        <Separator />

        {/* Categories */}
        <section className="space-y-2.5">
          <h3 className="text-sm font-semibold text-foreground">Category</h3>

          <Link
            href="/shop"
            className={cn(
              "flex min-h-9 items-center rounded-sm px-2 text-sm transition-colors",
              !categorySlug
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
            )}
          >
            All products
          </Link>

          <div className="space-y-0.5">
            {categoriesLoading ? (
              <FilterSectionSkeleton titleWidth="w-20" />
            ) : navCategories.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No categories available.
              </p>
            ) : (
              navCategories.map((cat) => {
                const isMainActive = categorySlug === cat.slug;
                const isExpanded = expandedIds.has(cat.id) || isMainActive;
                const hasSubs = cat.subs.length > 0;

                return (
                  <div key={cat.id} className="rounded-sm">
                    {hasSubs ? (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpanded(cat.id)}
                        className={cn(
                          "flex min-h-9 w-full items-center gap-1 rounded-sm px-2 py-2 text-left text-sm transition-colors",
                          isMainActive || isExpanded
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground hover:bg-secondary/80",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180 text-primary",
                          )}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <Link
                        href={cat.href}
                        className={cn(
                          "flex min-h-9 items-center rounded-sm px-2 py-2 text-sm transition-colors",
                          isMainActive
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground hover:bg-secondary/80",
                        )}
                      >
                        {cat.name}
                      </Link>
                    )}

                    {hasSubs && isExpanded ? (
                      <div className="ml-2 space-y-0.5 border-l border-border py-1 pl-2">
                        <Link
                          href={cat.href}
                          className={cn(
                            "block truncate rounded-sm px-2 py-1.5 text-[13px] font-medium transition-colors",
                            isMainActive
                              ? "text-primary"
                              : "text-foreground hover:text-primary",
                          )}
                        >
                          Shop all {cat.name}
                        </Link>
                        {cat.subs.map((sub) => {
                          const isSubActive = categorySlug === sub.slug;
                          const hasChildren = sub.children.length > 0;
                          const childActive = sub.children.some(
                            (child) =>
                              sanitizeCategorySlug(child.name) ===
                              categorySlug,
                          );
                          const subExpanded =
                            expandedIds.has(sub.id) ||
                            isSubActive ||
                            childActive;

                          return (
                            <div key={sub.id}>
                              {hasChildren ? (
                                <button
                                  type="button"
                                  aria-expanded={subExpanded}
                                  onClick={() => toggleExpanded(sub.id)}
                                  className={cn(
                                    "flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors",
                                    isSubActive || subExpanded
                                      ? "bg-primary/10 font-semibold text-primary"
                                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                                  )}
                                >
                                  <span className="min-w-0 flex-1 truncate">
                                    {sub.name}
                                  </span>
                                  <ChevronDown
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                                      subExpanded && "rotate-180",
                                    )}
                                    aria-hidden
                                  />
                                </button>
                              ) : (
                                <Link
                                  href={sub.href}
                                  className={cn(
                                    "block truncate rounded-sm px-2 py-1.5 text-[13px] transition-colors",
                                    isSubActive
                                      ? "bg-primary/10 font-semibold text-primary"
                                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                                  )}
                                >
                                  {sub.name}
                                </Link>
                              )}

                              {hasChildren && subExpanded ? (
                                <div className="ml-2 space-y-0.5 border-l border-border/70 pl-2">
                                  <Link
                                    href={sub.href}
                                    className={cn(
                                      "block truncate rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                                      isSubActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-primary",
                                    )}
                                  >
                                    Shop all {sub.name}
                                  </Link>
                                  {sub.children.map((child) => {
                                    const childSlug = sanitizeCategorySlug(
                                      child.name,
                                    );
                                    const isChildActive =
                                      categorySlug === childSlug;
                                    return (
                                      <Link
                                        key={child.id}
                                        href={child.href}
                                        className={cn(
                                          "block truncate rounded-sm px-2 py-1 text-xs transition-colors",
                                          isChildActive
                                            ? "font-semibold text-primary"
                                            : "text-muted-foreground hover:text-foreground",
                                        )}
                                      >
                                        {child.name}
                                      </Link>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <Separator />

        {brandsLoading ? (
          <FilterSectionSkeleton titleWidth="w-16" />
        ) : (
          <ShopCheckboxFilter
            title="Brand"
            options={brandOptions}
            selectedIds={selectedBrandIdSet}
            onToggle={(id) => onToggleBrand(Number(id))}
            searchPlaceholder="Search brands…"
            visibleCount={8}
            emptyTitle="No brands found"
            emptySubtitle={
              brandOptions.length === 0
                ? "Brands will appear here when available."
                : "Try a different keyword."
            }
          />
        )}
      </div>

      {hasActiveFilters ? (
        <div className="mt-5 border-t border-border pt-3">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={onClear}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset all filters
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}

export default ShopFiltersPanel;
