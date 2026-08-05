"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useBudgetQuickAdd } from "@/hooks/useBudgetQuickAdd";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  Truck,
} from "lucide-react";
import { productService } from "@/lib/api/product/service";
import { categoryService } from "@/lib/api/category/service";
import type {
  BudgetPlanItem,
  BudgetPlanResponse,
  AllocationResponse,
  AllocationGroup,
  AllocationSuggestion,
  MergedVariants,
} from "@/lib/api/product/service";
import type { MainCategory } from "@/lib/api/category/service";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media/url";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CategoryAllocationRow from "@/components/compare/CategoryAllocationRow";
import type { AllocationRowData } from "@/components/compare/CategoryAllocationRow";
import PlanSummaryBar from "@/components/compare/PlanSummaryBar";
import { CompareAlert } from "@/components/compare/shared/CompareAlert";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/* ─── Hooks ───────────────────────────────────────────────── */

let _rowId = 0;
function genId() {
  return `alloc-${++_rowId}-${Date.now()}`;
}

/* ─── Variant summary badge ────────────────────────────────── */

function VariantBadge({ merged }: { merged: MergedVariants }) {
  if (merged.total_variants <= 1) return null;

  const parts: string[] = [];
  if (merged.colors.length > 0) {
    parts.push(
      merged.colors.length <= 2
        ? merged.colors.join(" · ")
        : `${merged.colors.length} colors`,
    );
  }
  if (merged.sizes.length > 0) {
    parts.push(
      merged.sizes.length <= 3
        ? merged.sizes.join(" · ")
        : `${merged.sizes.length} sizes`,
    );
  }

  return (
    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
      <Layers size={10} className="shrink-0" />
      {parts.length > 0 ? parts.join(" • ") : `${merged.total_variants} variants`}
    </span>
  );
}

/* ─── Bulk tier badges ─────────────────────────────────────── */

function BulkTiersBadge({ item }: { item: BudgetPlanItem }) {
  const [open, setOpen] = React.useState(false);

  if (!item.bulk_rules.length) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] font-semibold text-foreground transition-colors hover:opacity-60"
      >
        {item.bulk_rules.length} bulk{" "}
        {item.bulk_rules.length === 1 ? "tier" : "tiers"}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.bulk_rules.map((r, i) => (
            <span
              key={i}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold",
                item.pricing.bulk_discount_applied?.min_qty === r.min_qty
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground",
              )}
            >
              {r.min_qty}+ pcs: {r.discount_label} → ৳
              {r.effective_price.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Price range display ──────────────────────────────────── */

function PriceRange({ merged }: { merged?: MergedVariants }) {
  if (
    !merged ||
    merged.total_variants <= 1 ||
    merged.price_range.min === merged.price_range.max
  )
    return null;

  return (
    <p className="text-[10px] text-muted-foreground">
      Range: ৳{merged.price_range.min.toLocaleString()} – ৳
      {merged.price_range.max.toLocaleString()}
    </p>
  );
}

/* ─── Simple mode result card ──────────────────────────────── */

function ResultCard({
  item,
  rank,
  onQuickAdd,
}: {
  item: BudgetPlanItem;
  rank: number;
  onQuickAdd?: (productId: number, suggestedQty: number) => void;
}) {
  const img = resolveMediaUrl(item.thumbnail);
  const p = item.pricing;
  const a = item.affordability;
  const qtyLabel = a.qty_affordable === 1 ? "piece" : "pieces";

  return (
    <article className="group flex h-full flex-col rounded-sm border border-border bg-card shadow-product transition-shadow duration-300 hover:shadow-product-hover">
      <div className="flex gap-3 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/40">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={item.product_name}
              className="absolute inset-0 h-full w-full object-contain p-1.5"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}
          <span
            className={cn(
              "absolute left-1 top-1 rounded-sm px-1.5 py-0.5 font-heading text-[10px] font-bold text-primary-foreground",
              rank === 1 ? "bg-primary" : "bg-foreground/70",
            )}
          >
            #{rank}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {item.category_name ? (
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.category_name}
            </p>
          ) : null}
          <Link
            href={`/product/${encodeURIComponent(item.product_slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 block text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
          >
            {item.product_name}
          </Link>
          {item.merged_variants ? (
            <VariantBadge merged={item.merged_variants} />
          ) : (
            (item.color_name || item.variant_name) && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[item.color_name, item.variant_name].filter(Boolean).join(" · ")}
              </p>
            )
          )}
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <p className="font-heading text-lg font-bold text-primary">
              ৳{p.effective_price_per_unit.toLocaleString()}
            </p>
            {p.original_price > p.effective_price_per_unit ? (
              <p className="text-xs text-muted-foreground line-through">
                ৳{p.original_price.toLocaleString()}
              </p>
            ) : null}
            <span className="text-[11px] text-muted-foreground">per unit</span>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-3 space-y-0 divide-y divide-border rounded-sm border border-border text-xs">
        {p.item_discount > 0 ? (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-muted-foreground">Item discount</span>
            <span className="font-semibold text-destructive">
              −৳{p.item_discount.toLocaleString()}
            </span>
          </div>
        ) : null}
        {p.bulk_discount_applied ? (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-muted-foreground">
              Bulk deal ({p.bulk_discount_applied.min_qty}+ pcs)
            </span>
            <span className="font-semibold text-foreground">
              {p.bulk_discount_applied.discount_label}
            </span>
          </div>
        ) : null}
        {p.coupon_discount_per_unit > 0 ? (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-muted-foreground">Coupon savings</span>
            <span className="font-semibold text-success">
              −৳{p.coupon_discount_per_unit.toLocaleString()}/unit
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between bg-secondary/40 px-3 py-2.5">
          <span className="font-medium text-foreground">Fits your budget</span>
          <span className="font-heading text-sm font-bold text-primary">
            {a.qty_affordable} {qtyLabel}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground">Estimated total</span>
          <span className="font-semibold text-foreground">
            ৳{a.total_spend.toLocaleString()}
          </span>
        </div>
        {a.total_saved > 0 ? (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-muted-foreground">You save</span>
            <span className="font-semibold text-success">
              ৳{a.total_saved.toLocaleString()}
            </span>
          </div>
        ) : null}
        {a.change > 0 ? (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-muted-foreground">Budget left</span>
            <span className="font-medium text-foreground">
              ৳{a.change.toLocaleString()}
            </span>
          </div>
        ) : null}
        {item.free_delivery ? (
          <div className="flex items-center gap-1.5 px-3 py-2 text-success">
            <Truck className="h-3 w-3" aria-hidden />
            <span className="font-medium">Free delivery included</span>
          </div>
        ) : null}
      </div>

      <div className="px-4">
        <BulkTiersBadge item={item} />
        <PriceRange merged={item.merged_variants} />
      </div>

      {onQuickAdd ? (
        <div className="mt-auto border-t border-border p-3">
          <button
            type="button"
            onClick={() =>
              onQuickAdd(item.product_id, item.affordability.qty_affordable)
            }
            className="group/cart flex w-full items-center justify-center gap-2 rounded-sm border border-primary bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:gap-3 hover:opacity-90"
          >
            <ShoppingCart
              size={14}
              className="transition-transform duration-200 group-hover/cart:-translate-x-0.5"
            />
            <span>Add {a.qty_affordable} to Cart</span>
            <ArrowRight
              size={14}
              className="opacity-70 transition-all duration-200 group-hover/cart:translate-x-1 group-hover/cart:opacity-100"
            />
          </button>
        </div>
      ) : null}
    </article>
  );
}

/* ─── Allocation suggestion card (compact) ─────────────────── */

function SuggestionCard({
  item,
  requestedQty,
  rank,
  selected,
  onSelect,
  onQuickAdd,
}: {
  item: AllocationSuggestion;
  requestedQty: number;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  onQuickAdd?: (productId: number, suggestedQty: number) => void;
}) {
  const img = resolveMediaUrl(item.thumbnail);
  const p = item.pricing;

  return (
    <div
      className={cn(
        "group relative flex h-full w-full flex-col rounded-sm border text-left transition-shadow duration-300",
        selected
          ? "border-primary shadow-product-hover ring-1 ring-primary/25"
          : "border-border bg-card shadow-product hover:shadow-product-hover",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col text-left"
      >
        <div className="flex gap-2.5 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/40">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={item.product_name}
                className="absolute inset-0 h-full w-full object-contain p-1"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
            <span
              className={cn(
                "absolute left-0.5 top-0.5 rounded-sm px-1 text-[9px] font-bold text-primary-foreground",
                rank === 1 ? "bg-primary" : "bg-muted-foreground",
              )}
            >
              #{rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                {item.product_name}
              </p>
              {selected ? (
                <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                  Selected
                </span>
              ) : null}
            </div>
            {item.merged_variants && item.merged_variants.total_variants > 1 ? (
              <VariantBadge merged={item.merged_variants} />
            ) : null}
            <p className="mt-1.5 font-heading text-sm font-bold text-primary">
              ৳{p.effective_price_per_unit.toLocaleString()}
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                / unit
              </span>
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-1 border-t border-border px-3 py-2.5 text-[11px]">
          {p.item_discount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-destructive">
                −৳{p.item_discount.toLocaleString()}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {requestedQty} × ৳{p.effective_price_per_unit.toLocaleString()}
            </span>
            <span className="font-heading font-bold text-foreground">
              ৳{item.total_for_qty.toLocaleString()}
            </span>
          </div>
          <p className="pt-0.5 text-[10px] text-muted-foreground">
            {selected ? "Included in your shopping plan" : "Tap card to choose this option"}
          </p>
        </div>
      </button>

      {onQuickAdd ? (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item.product_id, requestedQty);
            }}
            className="group/cart flex w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-card px-2 py-2 text-[11px] font-semibold text-primary transition-all duration-200 hover:gap-2.5 hover:border-primary"
          >
            <ShoppingCart
              size={12}
              className="transition-transform duration-200 group-hover/cart:-translate-x-0.5"
            />
            <span>Add {requestedQty} to Cart</span>
            <ArrowRight
              size={12}
              className="opacity-0 transition-all duration-200 group-hover/cart:translate-x-0.5 group-hover/cart:opacity-100"
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */

export default function BudgetPlanner() {
  const { user } = useAuth();
  const [budget, setBudget] = React.useState<string>("");
  const [couponCode, setCouponCode] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [response, setResponse] = React.useState<BudgetPlanResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Advanced mode state
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [allocations, setAllocations] = React.useState<AllocationRowData[]>([]);
  const [categories, setCategories] = React.useState<MainCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = React.useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<
    Record<number, number>
  >({}); // child_category_id → product_id of selected suggestion

  const { quickAdd } = useBudgetQuickAdd();
  // Maps product_id → last budget line used for quick-add (sku + pricing)
  const itemByProductId = React.useRef<Map<number, BudgetPlanItem | AllocationSuggestion>>(new Map());

  const handleQuickAdd = React.useCallback(
    (productId: number, suggestedQty: number = 1) => {
      const item = itemByProductId.current.get(productId);
      if (!item) {
        return;
      }
      quickAdd(
        {
          product_id: item.product_id,
          product_name: item.product_name,
          product_slug: item.product_slug,
          sku_id: item.sku_id,
          thumbnail: item.thumbnail,
          color_name: item.color_name,
          effective_price: item.pricing.effective_price_per_unit,
          original_price: item.pricing.original_price,
        },
        suggestedQty,
      );
    },
    [quickAdd],
  );

  const debouncedSearch = useDebouncedValue(search, 500);
  const debouncedBudget = useDebouncedValue(budget, 600);

  const budgetNum = React.useMemo(() => {
    const n = parseFloat(budget.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [budget]);

  const isAdvancedMode = advancedOpen && allocations.some((a) => a.childCategoryId);

  // Load categories when advanced panel opens
  React.useEffect(() => {
    if (advancedOpen && !categoriesLoaded) {
      categoryService.getMainCategories({ status: true }).then((res) => {
        setCategories(res.data ?? []);
        setCategoriesLoaded(true);
      }).catch(() => {
        setCategories([]);
        setCategoriesLoaded(true);
      });
    }
  }, [advancedOpen, categoriesLoaded]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const fetchPlan = React.useCallback(
    async (params: {
      budget: number;
      coupon?: string;
      search?: string;
      allocations?: AllocationRowData[];
    }) => {
      if (params.budget <= 0) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        // Build category_allocations if in advanced mode
        const categoryAllocations =
          params.allocations
            ?.filter((a) => a.childCategoryId)
            .map((a) => ({
              child_category_id: Number(a.childCategoryId),
              qty: a.qty,
            })) ?? undefined;

        const hasAllocations =
          categoryAllocations && categoryAllocations.length > 0;

        const res = await productService.budgetPlan(
          {
            budget: params.budget,
            coupon: params.coupon?.trim().toUpperCase() || undefined,
            search: params.search?.trim() || undefined,
            customer_id: user?.id,
            limit: 48,
            merge_skus: true,
            category_allocations: hasAllocations
              ? categoryAllocations
              : undefined,
          },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setResponse(res);
        const map = new Map<number, BudgetPlanItem | AllocationSuggestion>();
        if (Array.isArray(res.data)) {
          for (const row of res.data) map.set(row.product_id, row);
        } else if (res.data && "allocations" in res.data) {
          for (const group of res.data.allocations) {
            for (const row of group.suggestions) map.set(row.product_id, row);
          }
        }
        itemByProductId.current = map;
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code?: string }).code === "ERR_CANCELED"
        ) {
          return;
        }
        setResponse(null);
        setError(
          e instanceof Error ? e.message : "Failed to calculate budget plan.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [user?.id],
  );

  // Auto-fetch on debounced inputs (simple mode)
  React.useEffect(() => {
    const n = parseFloat(debouncedBudget.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return;
    fetchPlan({
      budget: n,
      search: debouncedSearch,
      coupon: couponCode,
      allocations: isAdvancedMode ? allocations : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBudget, debouncedSearch]);

  const handleApplyCoupon = () => {
    if (!budgetNum || !couponCode.trim()) return;
    fetchPlan({
      budget: budgetNum,
      search: debouncedSearch,
      coupon: couponCode,
      allocations: isAdvancedMode ? allocations : undefined,
    });
  };

  const handleClearCoupon = () => {
    setCouponCode("");
    if (budgetNum)
      fetchPlan({
        budget: budgetNum,
        search: debouncedSearch,
        allocations: isAdvancedMode ? allocations : undefined,
      });
  };

  const handleSearchPlan = () => {
    if (!budgetNum) return;
    fetchPlan({
      budget: budgetNum,
      search: debouncedSearch,
      coupon: couponCode,
      allocations: isAdvancedMode ? allocations : undefined,
    });
  };

  // Allocation row handlers
  const addAllocation = () => {
    setAllocations((prev) => [
      ...prev,
      {
        id: genId(),
        mainCategoryId: "",
        subCategoryId: "",
        childCategoryId: "",
        qty: 1,
      },
    ]);
  };

  const updateAllocation = (index: number, data: AllocationRowData) => {
    setAllocations((prev) => prev.map((a, i) => (i === index ? data : a)));
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  // Determine response shape
  const meta = response?.meta;

  const isAllocationResponse = (
    data: unknown,
  ): data is AllocationResponse => {
    return !!data && typeof data === "object" && "allocations" in (data as Record<string, unknown>);
  };

  const flatItems: BudgetPlanItem[] =
    response && Array.isArray(response.data) ? response.data : [];

  const allocationData: AllocationResponse | null =
    response && isAllocationResponse(response.data) ? response.data : null;

  // Compute plan summary for advanced mode
  const planSummary = React.useMemo(() => {
    if (!allocationData) return null;

    let totalSpend = 0;
    let totalItems = 0;

    for (const group of allocationData.allocations) {
      const selectedPid = selectedSuggestions[group.child_category_id];
      if (selectedPid) {
        const match = group.suggestions.find((s) => s.product_id === selectedPid);
        if (match) {
          totalSpend += match.total_for_qty;
          totalItems += group.requested_qty;
        }
      }
    }

    return {
      totalSpend,
      totalItems,
      remaining: budgetNum - totalSpend,
      overBudget: totalSpend > budgetNum,
    };
  }, [allocationData, selectedSuggestions, budgetNum]);

  return (
    <div className="space-y-4 animate-compare-pop">
      {/* ─── Input panel ─────────────────────────────────────── */}
      <div className="relative space-y-4 overflow-hidden rounded-sm border border-border compare-stage p-5 shadow-product sm:p-6">
        <div
          aria-hidden
          className="compare-grid-mask pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-primary"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-product">
            <Tag className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Set your budget
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              We stack item discounts, bulk tiers, and coupons so you see real
              affordability.
            </p>
          </div>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Budget (BDT)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">
                ৳
              </span>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000"
                min={0}
                className="h-11 rounded-sm border-border bg-card pl-8 font-semibold focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Coupon Code (optional)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Tag
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(e.target.value.toUpperCase())
                  }
                  placeholder="SAVE20"
                  className="rounded-sm pl-9 font-mono font-semibold"
                />
              </div>

              {meta?.coupon_applied ? (
                <Button
                  variant="outline"
                  onClick={handleClearCoupon}
                  className="h-9 rounded-sm border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive sm:min-w-[96px]"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponCode.trim() || !budgetNum}
                  className="h-9 rounded-sm sm:min-w-[96px]"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              )}
            </div>

            {meta?.coupon_applied && meta.coupon_title && (
              <p className="text-xs font-medium text-success">
                &quot;{meta.coupon_title}&quot; applied
              </p>
            )}
            {meta?.coupon_error && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle size={11} /> {meta.coupon_error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Search Products</Label>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="shirt, pant, dress..."
                className="rounded-sm pl-9"
              />
              {loading && (
                <Loader2
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground"
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── Advanced: Category Plan ─────────────────────── */}
        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-foreground">
              <SlidersHorizontal size={13} />
              Build Shopping List
              {allocations.filter((a) => a.childCategoryId).length > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {allocations.filter((a) => a.childCategoryId).length}
                </span>
              )}
            </span>
            {advancedOpen ? (
              <ChevronUp size={14} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={14} className="text-muted-foreground" />
            )}
          </button>

          {advancedOpen && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Tell us what you want to buy — for example, 2 Jeans Pants and 3
                Polo Shirts — and we&apos;ll find the best options that fit your
                budget.
              </p>

              {allocations.map((alloc, i) => (
                <CategoryAllocationRow
                  key={alloc.id}
                  data={alloc}
                  categories={categories}
                  onChange={(d) => updateAllocation(i, d)}
                  onRemove={() => removeAllocation(i)}
                  index={i}
                />
              ))}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAllocation}
                  disabled={allocations.length >= 10}
                  className="h-8 gap-1.5 rounded-sm text-xs"
                >
                  <Plus size={12} />
                  Add Category
                </Button>

                {allocations.some((a) => a.childCategoryId) && (
                  <Button
                    size="sm"
                    onClick={handleSearchPlan}
                    disabled={loading || !budgetNum}
                    className="h-8 gap-1.5 rounded-sm text-xs"
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Find Products"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error ? <CompareAlert>{error}</CompareAlert> : null}

      {/* ─── Results ─────────────────────────────────────────── */}

      {budgetNum > 0 && (
        <>
          {/* ═══ Allocation results (advanced mode) ═══ */}
          {allocationData && (
            <>
              {allocationData.allocations.map((group) => (
                <AllocationCategorySection
                  key={group.child_category_id}
                  group={group}
                  loading={loading}
                  selectedProductId={selectedSuggestions[group.child_category_id]}
                  onSelect={(productId) =>
                    setSelectedSuggestions((prev) => ({
                      ...prev,
                      [group.child_category_id]: productId,
                    }))
                  }
                  onQuickAdd={handleQuickAdd}
                />
              ))}

              {planSummary && planSummary.totalItems > 0 && (
                <PlanSummaryBar
                  budget={budgetNum}
                  totalSpend={planSummary.totalSpend}
                  totalItems={planSummary.totalItems}
                  remaining={planSummary.remaining}
                  overBudget={planSummary.overBudget}
                />
              )}
            </>
          )}

          {/* ═══ Simple flat results ═══ */}
          {!allocationData && (
            <>
              <div className="bg-card px-5 py-3 shadow-product">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {loading
                        ? "Calculating best options..."
                        : flatItems.length > 0
                          ? `${meta?.total_matches ?? flatItems.length} product${(meta?.total_matches ?? flatItems.length) !== 1 ? "s" : ""} affordable within ৳${budgetNum.toLocaleString()}`
                          : search
                            ? `No results for "${search}" within ৳${budgetNum.toLocaleString()}`
                            : `No products found within ৳${budgetNum.toLocaleString()}`}
                    </h4>
                    {meta && !loading && (
                      <p className="text-xs text-muted-foreground">
                        Showing {meta.returned} results after discount, bulk tiers,
                        and coupon calculations
                        {meta.merged && " · grouped by product"}
                      </p>
                    )}
                  </div>

                  {meta?.coupon_applied && (
                    <span className="inline-flex items-center border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                      {couponCode} active
                    </span>
                  )}
                </div>
              </div>

              {!loading && flatItems.length === 0 && (
                <div className="flex flex-col items-center justify-center bg-card py-16 text-center shadow-product">
                  <div className="flex h-14 w-14 items-center justify-center bg-secondary">
                    <ShoppingBag className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-foreground">
                    Nothing in this budget yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try increasing budget or broadening search.
                  </p>
                </div>
              )}

              {loading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse space-y-3 border border-border bg-card p-4"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 bg-secondary" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-secondary" />
                          <div className="h-3 w-1/2 bg-secondary" />
                        </div>
                      </div>
                      <div className="h-24 bg-secondary/40" />
                      <div className="h-16 bg-secondary" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && flatItems.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {flatItems.map((item, i) => (
                    <ResultCard
                      key={`${item.product_id}-${item.sku_id}`}
                      item={item}
                      rank={i + 1}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!budgetNum && (
        <div className="flex flex-col items-center justify-center bg-card py-20 text-center shadow-product">
          <div className="flex h-14 w-14 items-center justify-center bg-secondary">
            <ShoppingBag className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">
            Enter your budget to start planning
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            We calculate quantities and final payable totals using all available
            discounts and coupon effects.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Allocation category section ──────────────────────────── */

function AllocationCategorySection({
  group,
  loading,
  selectedProductId,
  onSelect,
  onQuickAdd,
}: {
  group: AllocationGroup;
  loading: boolean;
  selectedProductId?: number;
  onSelect: (productId: number) => void;
  onQuickAdd?: (productId: number, suggestedQty: number) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between bg-card px-5 py-3 shadow-product">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center bg-primary text-xs font-black text-primary-foreground">
            {group.requested_qty}
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {group.child_category_name || "Category"}{" "}
              <span className="font-normal text-muted-foreground">
                × {group.requested_qty} pcs
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {loading
                ? "Finding best options..."
                : group.suggestions.length > 0
                  ? `${group.suggestions.length} product${group.suggestions.length !== 1 ? "s" : ""} available`
                  : "No products found in this category"}
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions grid */}
      {!loading && group.suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {group.suggestions.map((item, i) => (
            <SuggestionCard
              key={`${item.product_id}-${item.sku_id}`}
              item={item}
              requestedQty={group.requested_qty}
              rank={i + 1}
              selected={selectedProductId === item.product_id}
              onSelect={() => onSelect(item.product_id)}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      )}

      {!loading && group.suggestions.length === 0 && (
        <div className="flex items-center justify-center bg-card py-8 text-center shadow-product">
          <p className="text-xs text-muted-foreground">
            No products match this category within your budget.
          </p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse space-y-2 border border-border bg-card p-3"
            >
              <div className="flex gap-2">
                <div className="h-14 w-14 shrink-0 bg-secondary" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 bg-secondary" />
                  <div className="h-2 w-1/2 bg-secondary" />
                </div>
              </div>
              <div className="h-8 bg-secondary/40" />
              <div className="h-6 bg-secondary" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
