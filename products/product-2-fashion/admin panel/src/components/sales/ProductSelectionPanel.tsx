import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LayoutGrid, Layers, Package, Search, ShoppingBag, Zap } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

import ProductAddModal from "@/components/sales/ProductAddModal";
import ProductCard from "@/components/sales/ProductCard";
import BulkDealCard from "@/components/sales/BulkDealCard";
import ComboDealCard from "@/components/sales/ComboDealCard";
import SalePanelShell from "@/components/sales/SalePanelShell";
import type {
  CartItem,
  SaleChildCategory,
  SaleProduct,
  SaleSubCategory,
} from "@/components/sales/types";
import ImageSelectDropdown, {
  type ImageSelectOption,
} from "@/components/ui/dropdown/ImageSelectDropdown";

import { getChildCategories, getSubCategories } from "@/api/categories.api";
import { getProducts } from "@/api/products.api";
import { fetchPublicBulkRules, fetchPublicComboRules } from "@/api/cart-discounts.api";
import Pagination from "./Pagination";

function unwrapList<T>(payload: any, key?: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (key && Array.isArray(payload?.[key])) return payload[key] as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.rows)) return payload.rows as T[];
  return [];
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function formatBdt(n: number) {
  return `৳${Number.isFinite(n) ? Math.round(n).toLocaleString("en-BD") : "0"}`;
}

type TabType = "products" | "bulk" | "combos";

type Props = {
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
};

const DEFAULT_LIMIT = 9;

// -- Bulk Deals Tab -------------------------------------------------------

function BulkDealsTab({ cart, onAddToCart }: { cart: CartItem[]; onAddToCart: (item: CartItem) => void }) {
  const { t } = useTranslation();

  const { data: bulkRules = [], isLoading } = useQuery({
    queryKey: ["admin-sale-bulk-rules-public"],
    queryFn: fetchPublicBulkRules,
    staleTime: 60_000,
  });

  const activeRules = bulkRules.filter(r => r.status);

  // Group rules by SKU + free_delivery so that tiers for the same product are
  // separated when they differ in delivery type (e.g. tier-A = Free, tier-B = Paid).
  // This prevents mixing delivery types within a single card which would be misleading.
  const ruleGroups = React.useMemo(() => {
    const groups: Record<string, typeof activeRules> = {};
    for (const rule of activeRules) {
      // Composite key: skuId|freeDelivery  (e.g. "1859|true" vs "1859|false")
      const key = `${rule.product_sku_id}|${!!rule.free_delivery}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(rule);
    }
    // Sort tiers within each group by ascending min_quantity
    return Object.values(groups).map(g =>
      [...g].sort((a, b) => a.min_quantity - b.min_quantity)
    );
  }, [activeRules]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-xs text-gray-400">{t("sales.loading")}</p>
      </div>
    );
  }

  if (!ruleGroups.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <Zap className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-500">{t("sales.noBulkRules")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {ruleGroups.map((group) => {
        const rep = group[0]; // representative rule for product metadata
        const skuId = rep.product_sku_id;
        const groupFreeDelivery = !!rep.free_delivery; // consistent across this group
        const cardKey = `${skuId}|${groupFreeDelivery}`; // unique per card
        const currentQty = cart.find(c => c.key === cardKey)?.qty ?? 0;

        // Which tier is currently qualified (highest matching)
        const qualifyingTier = [...group].reverse().find(r => currentQty >= r.min_quantity);
        const anyQualifies = !!qualifyingTier;

        // Stock checks (use the shared stock from the representative rule)
        const stock = rep.stock ?? 0;
        const inStock = stock > 0;
        const lowestMinQty = group[0].min_quantity; // smallest tier threshold
        const stockIssue = !inStock || stock < lowestMinQty;

        // Per-unit SKU discount for the product (from product_skus.discount / discount_type).
        // This is separate from the bulk deal's own discount_value.
        const sellingPrice = rep.selling_price ?? 0;
        const rawSkuDisc = rep.sku_discount ?? 0;
        const skuDiscAmt = (rep.sku_discount_type === 1)
          ? (sellingPrice * rawSkuDisc) / 100   // percentage
          : rawSkuDisc;                           // flat
        // unitPrice shown to user = selling_price - sku discount (like ProductAddModal)
        const bulkUnitPrice = Math.max(0, sellingPrice - skuDiscAmt);

        const buildCartItem = (qty: number) => ({
          key: cardKey,
          productId: skuId,
          productVariationId: skuId,
          title: rep.product_name ?? rep.name,
          sku: rep.sku ?? String(skuId),
          image: rep.product_image ?? "",
          unitPrice: bulkUnitPrice,
          originalPrice: sellingPrice,
          discount: skuDiscAmt || undefined,
          freeDelivery: groupFreeDelivery,
          colorName: rep.color_name,
          variantName: rep.variant_name,
          qty,
        });

        const activeDiscountLabel = qualifyingTier
          ? qualifyingTier.discount_type === 1
            ? `${qualifyingTier.discount_value}% off`
            : `${formatBdt(qualifyingTier.discount_value)} off/unit`
          : null;

        return (
          <BulkDealCard
            key={cardKey}
            title={rep.product_name ?? rep.name}
            image={rep.product_image}
            meta={[rep.color_name, rep.variant_name].filter(Boolean).join(" / ") || undefined}
            skuLabel={`SKU ${rep.sku ?? skuId}`}
            priceLabel={sellingPrice ? formatBdt(sellingPrice) : undefined}
            freeDelivery={groupFreeDelivery}
            stock={stock}
            stockIssue={stockIssue}
            outOfStock={!inStock}
            lowestMinQty={lowestMinQty}
            currentQty={currentQty}
            activeDiscountLabel={anyQualifies ? activeDiscountLabel : null}
            tiers={group.map((rule) => {
              const qualifies = currentQty >= rule.min_quantity;
              const isActive = qualifyingTier?.id === rule.id;
              const tierHasStock = stock >= rule.min_quantity;
              const progress = rule.min_quantity > 0 ? Math.min(1, currentQty / rule.min_quantity) : 1;
              const tierUnavailable = !inStock || !tierHasStock;
              return {
                id: rule.id,
                minQty: rule.min_quantity,
                discountLabel:
                  rule.discount_type === 1
                    ? `${rule.discount_value}% off`
                    : `${formatBdt(rule.discount_value)} off/unit`,
                freeDelivery: !!rule.free_delivery,
                qualifies,
                isActive,
                unavailable: tierUnavailable,
                progress,
                currentQty,
              };
            })}
            onAdd={() => onAddToCart(buildCartItem(lowestMinQty))}
            onRemove={() => {
              const existing = cart.find(c => c.productVariationId === skuId && c.key === cardKey);
              if (existing) onAddToCart({ ...existing, qty: -lowestMinQty });
            }}
            canAddMore={currentQty + lowestMinQty <= stock}
          />
        );
      })}
    </div>
  );
}

// ── Combos Tab ────────────────────────────────────────────────────────────────

function CombosTab({ cart, onAddToCart }: { cart: CartItem[]; onAddToCart: (item: CartItem) => void }) {
  const { t } = useTranslation();

  const { data: comboRules = [], isLoading } = useQuery({
    queryKey: ["admin-sale-combo-rules-public"],
    queryFn: fetchPublicComboRules,
    staleTime: 60_000,
  });

  const activeRules = comboRules.filter(r => r.status);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-xs text-gray-400">{t("sales.loading")}</p>
      </div>
    );
  }

  if (!activeRules.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <Layers className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-500">{t("sales.noComboRules")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {activeRules.map((rule) => {
        const qtyMap: Record<number, number> = {};
        for (const c of cart) {
          if (c.productVariationId != null) {
            qtyMap[c.productVariationId] = (qtyMap[c.productVariationId] ?? 0) + c.qty;
          }
        }

        const topTier = rule.tiers[0];
        const items = topTier?.items ?? [];

        const completeSets =
          items.length
            ? Math.min(...items.map(i => Math.floor((qtyMap[i.product_sku_id] ?? 0) / i.required_qty)))
            : 0;

        const addOneRound = () => {
          if (!topTier) return;
          topTier.items.forEach(item => {
            const itemSellingPrice = item.selling_price ?? 0;
            const itemRawDisc = (item as any).sku_discount ?? 0;
            const itemDiscAmt = ((item as any).sku_discount_type === 1)
              ? (itemSellingPrice * itemRawDisc) / 100
              : itemRawDisc;
            const itemUnitPrice = Math.max(0, itemSellingPrice - itemDiscAmt);

            onAddToCart({
              key: `sku-${item.product_sku_id}`,
              productId: item.product_sku_id,
              productVariationId: item.product_sku_id,
              title: item.product_name ?? `SKU #${item.product_sku_id}`,
              sku: item.sku ?? String(item.product_sku_id),
              image: item.product_image ?? "",
              unitPrice: itemUnitPrice,
              originalPrice: itemSellingPrice,
              discount: itemDiscAmt || undefined,
              freeDelivery: rule.free_delivery,
              colorName: item.color_name,
              variantName: item.variant_name,
              qty: item.required_qty,
            });
          });
        };

        const removeOneRound = () => {
          if (!topTier || completeSets <= 0) return;
          topTier.items.forEach(item => {
            const existing = cart.find(c => c.productVariationId === item.product_sku_id);
            if (existing) onAddToCart({ ...existing, qty: -item.required_qty });
          });
        };

        const insufficientItems = items.filter(i => (i.stock ?? Infinity) < i.required_qty);
        const comboAvailable = insufficientItems.length === 0;

        const discountLabel = topTier
          ? topTier.discount_type === 1
            ? `Save ${topTier.discount_value}%`
            : `Save ${formatBdt(topTier.discount_value)}`
          : null;

        return (
          <ComboDealCard
            key={rule.id}
            name={rule.name ?? "Combo Deal"}
            discountLabel={discountLabel}
            freeDelivery={Boolean(rule.free_delivery)}
            itemCount={items.length}
            items={items.map((item) => ({
              id: item.product_sku_id,
              name: item.product_name ?? item.sku ?? `SKU #${item.product_sku_id}`,
              image: item.product_image,
              meta: [item.color_name, item.variant_name].filter(Boolean).join(" / ") || undefined,
              priceLabel:
                item.selling_price != null ? formatBdt(item.selling_price) : undefined,
              have: qtyMap[item.product_sku_id] ?? 0,
              need: item.required_qty,
              stockLow: (item.stock ?? Infinity) < item.required_qty,
            }))}
            completeSets={completeSets}
            comboAvailable={comboAvailable}
            insufficientCount={insufficientItems.length}
            onAdd={addOneRound}
            onRemove={removeOneRound}
          />
        );
      })}
    </div>
  );
}

// -- Main ProductSelectionPanel ------------------------------------------

const ProductSelectionPanel: React.FC<Props> = ({ cart, onAddToCart }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<TabType>("products");
  const [subCategoryId, setSubCategoryId] = React.useState<string>("all");
  const [childCategoryId, setChildCategoryId] = React.useState<string>("all");
  const [q, setQ] = React.useState<string>("");

  const [page, setPage] = React.useState(1);
  const limit = DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const debouncedQ = useDebouncedValue(q, 450);

  const { data: subRes, isLoading: subLoading } = useQuery({
    queryKey: ["sale-subCategories"],
    queryFn: () => getSubCategories(),
    staleTime: 60_000,
  });

  const subCategories = React.useMemo(
    () => unwrapList<SaleSubCategory>(subRes),
    [subRes]
  );

  const subIdNum = React.useMemo(() => {
    const n = Number(subCategoryId);
    return Number.isFinite(n) ? n : null;
  }, [subCategoryId]);

  const { data: childRes, isLoading: childLoading } = useQuery({
    queryKey: ["sale-childCategories", { subCategoryId }],
    queryFn: () => {
      if (subCategoryId === "all" || subIdNum === null)
        return getChildCategories();
      return getChildCategories({ sub_category_id: subIdNum } as any);
    },
    staleTime: 60_000,
  });

  const childCategories = React.useMemo(
    () => unwrapList<SaleChildCategory>(childRes),
    [childRes]
  );

  const filteredChildCategories = React.useMemo(() => {
    if (subCategoryId === "all" || subIdNum === null) return childCategories;
    return childCategories.filter(
      (c) => Number(c.sub_category_id) === subIdNum
    );
  }, [childCategories, subCategoryId, subIdNum]);

  React.useEffect(() => {
    setChildCategoryId("all");
  }, [subCategoryId]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQ, subCategoryId, childCategoryId]);

  const productsQuery = useQuery({
    queryKey: [
      "sale-products",
      {
        search: debouncedQ.trim(),
        subCategoryId,
        childCategoryId,
        limit,
        offset,
      },
    ],
    queryFn: async () => {
      const params: any = { limit, offset };

      if (subCategoryId !== "all" && subIdNum !== null) {
        params.sub_category_id = subIdNum;
      }

      const childIdNum = Number.isFinite(Number(childCategoryId))
        ? Number(childCategoryId)
        : null;
      if (childCategoryId !== "all" && childIdNum !== null) {
        params.child_category_id = childIdNum;
      }

      const text = debouncedQ.trim();
      if (text) {
        params.search = text;
      }

      return getProducts(params);
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const products = React.useMemo(() => {
    const list = unwrapList<SaleProduct>(productsQuery.data, "products");
    if (list.length) return list;
    return Array.isArray((productsQuery.data as any)?.products)
      ? ((productsQuery.data as any).products as SaleProduct[])
      : [];
  }, [productsQuery.data]);

  const total = React.useMemo(() => {
    const raw = productsQuery.data as any;
    const v = Number(raw?.total ?? raw?.count ?? raw?.pagination?.total ?? 0);
    return Number.isFinite(v) ? v : 0;
  }, [productsQuery.data]);

  const subOptions = React.useMemo<ImageSelectOption[]>(() => {
    return [
      { id: "all", label: t("sales.allSubCategories") },
      ...subCategories.map((c) => ({
        id: String(c.id),
        label: c.name,
        image: c.img_path ? toPublicUrl(c.img_path) : undefined,
      })),
    ];
  }, [subCategories, t]);

  const childOptions = React.useMemo<ImageSelectOption[]>(() => {
    return [
      { id: "all", label: t("sales.allChildCategories") },
      ...filteredChildCategories.map((c) => ({
        id: String(c.id),
        label: c.name,
        image: c.img_path ? toPublicUrl(c.img_path) : undefined,
      })),
    ];
  }, [filteredChildCategories, t]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<SaleProduct | null>(null);

  const loading = subLoading || childLoading || productsQuery.isLoading;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "products", label: t("sales.products"), icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    { id: "bulk", label: "Bulk Deals", icon: <Zap className="h-3.5 w-3.5" /> },
    { id: "combos", label: "Combos", icon: <Layers className="h-3.5 w-3.5" /> },
  ];

  return (
    <SalePanelShell
      icon={<Package className="h-4 w-4" />}
      title={t("sales.products")}
      subtitle={t("sales.browseAndAdd")}
      badge={
        total > 0 && activeTab === "products" ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {total} {t("sales.items")}
          </span>
        ) : null
      }
      footer={
        activeTab === "products" ? (
          <div className="px-3 py-2.5">
            <Pagination
              page={page}
              pageSize={limit}
              total={total}
              onPageChange={setPage}
            />
          </div>
        ) : null
      }
    >
      <div className="shrink-0 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
        <div className="inline-flex w-full rounded-xl bg-gray-100 p-1 dark:bg-white/[0.04] sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:flex-none",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
        {activeTab === "bulk" ? (
          <BulkDealsTab cart={cart} onAddToCart={onAddToCart} />
        ) : activeTab === "combos" ? (
          <CombosTab cart={cart} onAddToCart={onAddToCart} />
        ) : (
          <>
            <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 p-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-12 md:col-span-6">
                  <ImageSelectDropdown
                    value={subCategoryId}
                    onChange={(v) => {
                      setSubCategoryId(v);
                      setChildCategoryId("all");
                    }}
                    options={subOptions}
                    placeholder={t("sales.allSubCategories")}
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <ImageSelectDropdown
                    value={childCategoryId}
                    onChange={setChildCategoryId}
                    options={childOptions}
                    placeholder={
                      subCategoryId === "all"
                        ? t("sales.allChildCategories")
                        : t("sales.selectChildCategory")
                    }
                    disabled={childOptions.length <= 1}
                  />
                </div>

                <div className="col-span-12">
                  <div
                    className={cn(
                      "flex h-11 items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 transition",
                      "focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100",
                      "dark:border-gray-700 dark:bg-white/[0.03] dark:focus-within:border-brand-500 dark:focus-within:ring-brand-500/15",
                    )}
                  >
                    <Search size={16} className="flex-shrink-0 text-gray-400" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t("sales.searchProducts")}
                      className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800"
                    >
                      <div className="aspect-[4/3] animate-pulse bg-gray-100 dark:bg-white/[0.04]" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-white/[0.04]" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-white/[0.04]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 py-16 dark:border-gray-700 dark:bg-white/[0.02]">
                  <LayoutGrid className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("sales.noProductsFound")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {t("sales.tryAdjustingFilters")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {products.map((p) => (
                    <ProductCard
                      key={String(p.id)}
                      product={p}
                      onClick={() => {
                        setSelected(p);
                        setModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ProductAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selected}
        onAdd={onAddToCart}
      />
    </SalePanelShell>
  );
};

export default ProductSelectionPanel;

