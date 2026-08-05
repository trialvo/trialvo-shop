"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiSliders,
  FiTag,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
import { cn, toPublicUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CategoryAllocationRow from "./CategoryAllocationRow";
import type { AllocationRowData } from "./CategoryAllocationRow";
import PlanSummaryBar from "./PlanSummaryBar";
import QuickAddModal from "@/components/modals/quick-add/QuickAddModal";

/* ─── Hooks ───────────────────────────────────────────────── */

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

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
    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
      <FiLayers size={10} className="shrink-0" />
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
        className="flex items-center gap-1 text-[11px] font-semibold text-black transition-colors hover:opacity-60"
      >
        {item.bulk_rules.length} bulk{" "}
        {item.bulk_rules.length === 1 ? "tier" : "tiers"}
        {open ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.bulk_rules.map((r, i) => (
            <span
              key={i}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold",
                item.pricing.bulk_discount_applied?.min_qty === r.min_qty
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700",
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
    <p className="text-[10px] text-gray-400">
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
  const img = toPublicUrl(item.thumbnail);
  const p = item.pricing;
  const a = item.affordability;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-black/[0.06] bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)] transition-colors hover:border-black/10">
      <div
        className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center text-xs font-black text-white ${
          rank === 1
            ? "bg-black"
            : rank === 2
              ? "bg-gray-600"
              : rank === 3
                ? "bg-gray-400"
                : "bg-gray-300"
        }`}
      >
        #{rank}
      </div>

      <div className="flex gap-3 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-black/[0.04] bg-gray-50">
          {img ? (
            <Image
              src={img}
              alt={item.product_name}
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FiShoppingBag className="h-7 w-7 text-gray-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pr-8">
          <Link
            href={`/products/${encodeURIComponent(item.product_slug)}/${item.product_id}`}
            target="_blank"
            className="line-clamp-2 block text-sm font-semibold leading-snug text-black transition-colors hover:opacity-60"
          >
            {item.product_name}
          </Link>
          {/* Show variant info or merged badge */}
          {item.merged_variants ? (
            <VariantBadge merged={item.merged_variants} />
          ) : (
            (item.color_name || item.variant_name) && (
              <p className="mt-0.5 text-xs text-gray-400">
                {[item.color_name, item.variant_name].filter(Boolean).join(" · ")}
              </p>
            )
          )}
          {item.category_name && (
            <p className="text-[10px] text-gray-400">{item.category_name}</p>
          )}
        </div>
      </div>

      <div className="border-t border-black/[0.04] bg-gray-50/50 text-xs">
        <div className="flex items-center justify-between border-b border-black/[0.04] px-3 py-2">
          <span className="text-gray-500">Original price</span>
          <span className="font-medium text-black">
            ৳{p.original_price.toLocaleString()}
          </span>
        </div>

        {p.item_discount > 0 && (
          <div className="flex items-center justify-between border-b border-black/[0.04] px-3 py-2">
            <span className="text-red-500">Item discount</span>
            <span className="font-semibold text-red-500">
              -৳{p.item_discount.toLocaleString()}
            </span>
          </div>
        )}

        {p.bulk_discount_applied && (
          <div className="flex items-center justify-between border-b border-black/[0.04] px-3 py-2">
            <span className="text-black">
              Bulk ({p.bulk_discount_applied.min_qty}+ pcs)
            </span>
            <span className="font-semibold text-black">
              {p.bulk_discount_applied.discount_label}
            </span>
          </div>
        )}

        {p.coupon_discount_per_unit > 0 && (
          <div className="flex items-center justify-between border-b border-black/[0.04] px-3 py-2">
            <span className="text-emerald-600">Coupon (per unit)</span>
            <span className="font-semibold text-emerald-600">
              -৳{p.coupon_discount_per_unit.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between bg-white px-3 py-2">
          <span className="font-semibold text-black">Final per unit</span>
          <span className="font-bold text-black">
            ৳{p.effective_price_per_unit.toLocaleString()}
          </span>
        </div>
        <PriceRange merged={item.merged_variants} />
      </div>

      <div className="px-4">
        <BulkTiersBadge item={item} />
      </div>

      <div className="mt-auto border-t border-black/[0.04] bg-black px-4 py-3 text-white">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              You can buy
            </p>
            <p className="text-3xl font-black leading-none">
              {a.qty_affordable}{" "}
              <span className="text-base font-semibold opacity-80">pcs</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-80">Total spend</p>
            <p className="text-sm font-bold">
              ৳{a.total_spend.toLocaleString()}
            </p>
            {a.total_saved > 0 && (
              <p className="text-[10px] font-semibold text-emerald-300">
                Save ৳{a.total_saved.toLocaleString()}
              </p>
            )}
            {a.change > 0 && (
              <p className="text-[10px] opacity-80">
                Change: ৳{a.change.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {item.free_delivery && (
          <p className="mt-1 text-[10px] font-semibold text-emerald-300">
            Free Delivery
          </p>
        )}
      </div>

      {/* Add to Cart button */}
      {onQuickAdd && (
        <button
          type="button"
          onClick={() => onQuickAdd(item.product_id, item.affordability.qty_affordable)}
          className="flex items-center justify-center gap-2 border-t border-white/20 bg-black py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
        >
          <FiShoppingCart size={13} />
          Select Variation & Add to Cart
        </button>
      )}
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
  const img = toPublicUrl(item.thumbnail);
  const p = item.pricing;

  return (
    <div
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden border text-left transition-all",
        selected
          ? "border-black shadow-[0px_0px_10px_rgba(0,0,0,0.12)]"
          : "border-black/[0.06] bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.04)] hover:border-black/10",
      )}
    >
      {/* Rank badge */}
      <div
        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-[9px] font-black text-white ${
          rank === 1 ? "bg-black" : "bg-gray-400"
        }`}
      >
        {rank}
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center bg-black">
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Clickable content area for selection */}
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col text-left"
      >
        <div className="flex gap-2 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-black/[0.04] bg-gray-50">
            {img ? (
              <Image
                src={img}
                alt={item.product_name}
                fill
                className="object-contain p-1"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiShoppingBag className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-5">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-black">
              {item.product_name}
            </p>
            {item.merged_variants && item.merged_variants.total_variants > 1 && (
              <VariantBadge merged={item.merged_variants} />
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-black/[0.04] bg-gray-50/50 px-3 py-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Per unit</span>
            <span className="font-bold text-black">
              ৳{p.effective_price_per_unit.toLocaleString()}
            </span>
          </div>
          {p.item_discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-red-400">Discount</span>
              <span className="font-medium text-red-500">-৳{p.item_discount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className={cn(
          "px-3 py-2 text-xs transition-colors",
          selected ? "bg-black text-white" : "bg-gray-100 text-black",
        )}>
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">
              {requestedQty} pcs × ৳{p.effective_price_per_unit.toLocaleString()}
            </span>
            <span className="font-black">
              ৳{item.total_for_qty.toLocaleString()}
            </span>
          </div>
        </div>
      </button>

      {/* Add to Cart button */}
      {onQuickAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(item.product_id, requestedQty);
          }}
          className="flex items-center justify-center gap-1.5 border-t border-black/[0.06] bg-white py-2 text-[10px] font-semibold text-black transition-colors hover:bg-black hover:text-white"
        >
          <FiShoppingCart size={11} />
          Add to Cart
        </button>
      )}
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

  // Advanced mode state
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [allocations, setAllocations] = React.useState<AllocationRowData[]>([]);
  const [categories, setCategories] = React.useState<MainCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = React.useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<
    Record<number, number>
  >({}); // child_category_id → product_id of selected suggestion

  // Quick Add modal state
  const [quickAddProductId, setQuickAddProductId] = React.useState<number>(0);
  const [quickAddQty, setQuickAddQty] = React.useState<number>(1);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [quickAddKey, setQuickAddKey] = React.useState(0);

  const handleQuickAdd = React.useCallback((productId: number, suggestedQty: number = 1) => {
    setQuickAddProductId(productId);
    setQuickAddQty(suggestedQty);
    // Increment counter to force fresh QuickAddModal mount
    setQuickAddKey((k) => k + 1);
    setQuickAddOpen(true);
  }, []);

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
      }).catch(() => {});
    }
  }, [advancedOpen, categoriesLoaded]);

  const fetchPlan = React.useCallback(
    async (params: {
      budget: number;
      coupon?: string;
      search?: string;
      allocations?: AllocationRowData[];
    }) => {
      if (params.budget <= 0) return;

      setLoading(true);
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

        const res = await productService.budgetPlan({
          budget: params.budget,
          coupon: params.coupon?.trim().toUpperCase() || undefined,
          search: params.search?.trim() || undefined,
          customer_id: user?.id,
          limit: 48,
          merge_skus: true,
          category_allocations: hasAllocations
            ? categoryAllocations
            : undefined,
        });
        setResponse(res);
      } catch {
        setResponse(null);
      } finally {
        setLoading(false);
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
    <div className="space-y-3">
      {/* ─── Input panel ─────────────────────────────────────── */}
      <div className="space-y-4 bg-white p-5 shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
        <div>
          <h3 className="text-sm font-bold text-black">
            Set Budget & Filters
          </h3>
          <p className="text-xs text-gray-400">
            Server-side calculation with item discount, bulk tier, and coupon
            stacking.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Budget (BDT)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black">
                ৳
              </span>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000"
                min={0}
                className="rounded-none pl-8 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Coupon Code (optional)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <FiTag
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(e.target.value.toUpperCase())
                  }
                  placeholder="SAVE20"
                  className="rounded-none pl-9 font-mono font-semibold"
                />
              </div>

              {meta?.coupon_applied ? (
                <Button
                  variant="outline"
                  onClick={handleClearCoupon}
                  className="h-9 rounded-none border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 sm:min-w-[96px]"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponCode.trim() || !budgetNum}
                  className="h-9 rounded-none sm:min-w-[96px]"
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
              <p className="text-xs font-medium text-emerald-600">
                &quot;{meta.coupon_title}&quot; applied
              </p>
            )}
            {meta?.coupon_error && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <FiAlertCircle size={11} /> {meta.coupon_error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Search Products</Label>
            <div className="relative">
              <FiSearch
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="shirt, pant, dress..."
                className="rounded-none pl-9"
              />
              {loading && (
                <Loader2
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-black"
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── Advanced: Category Plan ─────────────────────── */}
        <div className="border-t border-black/[0.04] pt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-black">
              <FiSliders size={13} />
              Build Shopping List
              {allocations.filter((a) => a.childCategoryId).length > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center bg-black px-1 text-[9px] font-bold text-white">
                  {allocations.filter((a) => a.childCategoryId).length}
                </span>
              )}
            </span>
            {advancedOpen ? (
              <FiChevronUp size={14} className="text-gray-400" />
            ) : (
              <FiChevronDown size={14} className="text-gray-400" />
            )}
          </button>

          {advancedOpen && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-gray-400">
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
                  className="h-8 gap-1.5 rounded-none text-xs"
                >
                  <FiPlus size={12} />
                  Add Category
                </Button>

                {allocations.some((a) => a.childCategoryId) && (
                  <Button
                    size="sm"
                    onClick={handleSearchPlan}
                    disabled={loading || !budgetNum}
                    className="h-8 gap-1.5 rounded-none text-xs"
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
              <div className="bg-white px-5 py-3 shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-black">
                      {loading
                        ? "Calculating best options..."
                        : flatItems.length > 0
                          ? `${meta?.total_matches ?? flatItems.length} product${(meta?.total_matches ?? flatItems.length) !== 1 ? "s" : ""} affordable within ৳${budgetNum.toLocaleString()}`
                          : search
                            ? `No results for "${search}" within ৳${budgetNum.toLocaleString()}`
                            : `No products found within ৳${budgetNum.toLocaleString()}`}
                    </h4>
                    {meta && !loading && (
                      <p className="text-xs text-gray-400">
                        Showing {meta.returned} results after discount, bulk tiers,
                        and coupon calculations
                        {meta.merged && " · grouped by product"}
                      </p>
                    )}
                  </div>

                  {meta?.coupon_applied && (
                    <span className="inline-flex items-center border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {couponCode} active
                    </span>
                  )}
                </div>
              </div>

              {!loading && flatItems.length === 0 && (
                <div className="flex flex-col items-center justify-center bg-white py-16 text-center shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
                  <div className="flex h-14 w-14 items-center justify-center bg-black/[0.03]">
                    <FiShoppingBag className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-black">
                    Nothing in this budget yet
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Try increasing budget or broadening search.
                  </p>
                </div>
              )}

              {loading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse space-y-3 border border-black/[0.04] bg-white p-4"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 bg-gray-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-gray-100" />
                          <div className="h-3 w-1/2 bg-gray-100" />
                        </div>
                      </div>
                      <div className="h-24 bg-gray-50" />
                      <div className="h-16 bg-gray-100" />
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
        <div className="flex flex-col items-center justify-center bg-white py-20 text-center shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
          <div className="flex h-14 w-14 items-center justify-center bg-black/[0.03]">
            <FiShoppingBag className="h-7 w-7 text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-bold text-black">
            Enter your budget to start planning
          </p>
          <p className="mt-1 max-w-md text-xs text-gray-400">
            We calculate quantities and final payable totals using all available
            discounts and coupon effects.
          </p>
        </div>
      )}

      {/* ─── Quick Add Modal ─────────────────────────────── */}
      {quickAddProductId > 0 && (
        <QuickAddModal
          key={quickAddKey}
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          id={quickAddProductId}
          initialQty={quickAddQty}
          isTop
          zIndex={70}
        />
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
      <div className="flex items-center justify-between bg-white px-5 py-3 shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center bg-black text-xs font-black text-white">
            {group.requested_qty}
          </span>
          <div>
            <h4 className="text-sm font-bold text-black">
              {group.child_category_name || "Category"}{" "}
              <span className="font-normal text-gray-400">
                × {group.requested_qty} pcs
              </span>
            </h4>
            <p className="text-[11px] text-gray-400">
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
        <div className="flex items-center justify-center bg-white py-8 text-center shadow-[0px_0px_10px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-400">
            No products match this category within your budget.
          </p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse space-y-2 border border-black/[0.04] bg-white p-3"
            >
              <div className="flex gap-2">
                <div className="h-14 w-14 shrink-0 bg-gray-100" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 bg-gray-100" />
                  <div className="h-2 w-1/2 bg-gray-100" />
                </div>
              </div>
              <div className="h-8 bg-gray-50" />
              <div className="h-6 bg-gray-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
