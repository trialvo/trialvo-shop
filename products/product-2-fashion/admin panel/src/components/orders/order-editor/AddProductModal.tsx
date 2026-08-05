// src/components/orders/order-editor/AddProductModal.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ArrowLeft,
  Package,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import {
  getProducts,
  getProduct,
  type ProductEntity,
  type ProductSingleVariation,
  type ProductSingleResponseEntity,
} from "@/api/products.api";
import { toPublicUrl } from "@/utils/toPublicUrl";
import type { OrderProductLine } from "./types";

/* ─── Types ─────────────────────────────────────────────── */

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (line: OrderProductLine) => void;
}

const formatBDT = (v: number) =>
  v.toLocaleString(undefined, { maximumFractionDigits: 0 });

/* ─── Component ─────────────────────────────────────────── */

const AddProductModal: React.FC<AddProductModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  // ── State ──────────────────────────────────────────────
  const [step, setStep] = useState<"search" | "variation">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(
    null,
  );
  const [qty, setQty] = useState(1);

  // ── Reset on open/close ────────────────────────────────
  useEffect(() => {
    if (open) {
      setStep("search");
      setSearchTerm("");
      setDebouncedSearch("");
      setPage(1);
      setSelectedProductId(null);
      setSelectedVariationId(null);
      setQty(1);
    }
  }, [open]);

  // ── Debounce search (reset page on new search) ─────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Fetch product list ─────────────────────────────────
  const listQuery = useQuery({
    queryKey: ["order-editor-product-list", debouncedSearch, page],
    queryFn: () =>
      getProducts({
        search: debouncedSearch || undefined,
        status: true,
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
      }),
    enabled: open && step === "search",
    staleTime: 30_000,
  });

  const products: ProductEntity[] = useMemo(
    () => listQuery.data?.products ?? [],
    [listQuery.data],
  );
  const totalProducts = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));

  // ── Fetch single product detail ────────────────────────
  const detailQuery = useQuery({
    queryKey: ["order-editor-product-detail", selectedProductId],
    queryFn: () => getProduct(selectedProductId!),
    enabled: !!selectedProductId && step === "variation",
    staleTime: 60_000,
  });

  const detail: ProductSingleResponseEntity | undefined =
    detailQuery.data?.product;

  // ── Derived: available colors & variants ────────────────
  const availableColors = useMemo(() => {
    if (!detail?.variations) return [];
    const map = new Map<number, { id: number; name: string; hex: string | null }>();
    for (const v of detail.variations) {
      if (v.color && !map.has(v.color.id)) {
        map.set(v.color.id, {
          id: v.color.id,
          name: v.color.name,
          hex: v.color.hex ?? null,
        });
      }
    }
    return Array.from(map.values());
  }, [detail]);

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);

  // Auto-select first color when product loads
  useEffect(() => {
    if (availableColors.length > 0 && selectedColorId === null) {
      setSelectedColorId(availableColors[0].id);
    }
  }, [availableColors, selectedColorId]);

  const availableVariants = useMemo(() => {
    if (!detail?.variations || selectedColorId === null) return [];
    const map = new Map<number, { id: number; name: string }>();
    for (const v of detail.variations) {
      if (v.color?.id === selectedColorId && v.variant && !map.has(v.variant.id)) {
        map.set(v.variant.id, { id: v.variant.id, name: v.variant.name });
      }
    }
    return Array.from(map.values());
  }, [detail, selectedColorId]);

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // Auto-select first variant when color changes
  useEffect(() => {
    if (availableVariants.length > 0) {
      setSelectedVariantId(availableVariants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [availableVariants]);

  // ── Selected variation ─────────────────────────────────
  const selectedVariation: ProductSingleVariation | undefined = useMemo(() => {
    if (!detail?.variations) return undefined;
    return detail.variations.find(
      (v) =>
        v.color?.id === selectedColorId && v.variant?.id === selectedVariantId,
    );
  }, [detail, selectedColorId, selectedVariantId]);

  // Keep selectedVariationId in sync
  useEffect(() => {
    setSelectedVariationId(selectedVariation?.id ?? null);
  }, [selectedVariation]);

  // ── Handlers ───────────────────────────────────────────
  const handleSelectProduct = useCallback((productId: number) => {
    setSelectedProductId(productId);
    setSelectedColorId(null);
    setSelectedVariantId(null);
    setSelectedVariationId(null);
    setQty(1);
    setStep("variation");
  }, []);

  const handleBack = useCallback(() => {
    setStep("search");
    setSelectedProductId(null);
    setSelectedColorId(null);
    setSelectedVariantId(null);
    setSelectedVariationId(null);
  }, []);

  const handleAddToOrder = useCallback(() => {
    if (!detail || !selectedVariation) return;

    const imgUrl =
      detail.images?.[0]?.path
        ? toPublicUrl(detail.images[0].path)
        : undefined;

    const line: OrderProductLine = {
      id: `line-${Date.now()}`,
      sku: selectedVariation.sku || `#${selectedVariation.id}`,
      serialNo: detail.brand?.name ?? detail.name,
      name: detail.name,
      imageUrl: imgUrl ?? undefined,
      color: selectedVariation.color?.name ?? "",
      size: selectedVariation.variant?.name ?? "",
      discount: selectedVariation.discount ?? 0,
      unitPrice: selectedVariation.selling_price,
      quantity: qty,
      productId: detail.id,
      productSkuId: selectedVariation.id,
      colorId: selectedVariation.color?.id ?? null,
      variantId: selectedVariation.variant?.id ?? null,
      attributeId: detail.attribute?.id ?? null,
      colorHex: selectedVariation.color?.hex ?? null,
    };

    onAdd(line);
    onClose();
  }, [detail, selectedVariation, qty, onAdd, onClose]);

  // ── Render ─────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "search" ? "Add Product" : "Select Variation"}
      description={
        step === "search"
          ? "Search and select a product to add to this order"
          : detail?.name ?? "Choose color, size & quantity"
      }
      size="lg"
      bodyClassName="p-0"
      footer={
        step === "variation" ? (
          <>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
            <Button
              size="sm"
              disabled={!selectedVariation}
              onClick={handleAddToOrder}
              startIcon={<ShoppingCart size={14} />}
            >
              Add to Order
            </Button>
          </>
        ) : undefined
      }
    >
      {step === "search" ? (
        <SearchStep
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          products={products}
          isLoading={listQuery.isLoading}
          onSelect={handleSelectProduct}
          page={page}
          totalPages={totalPages}
          totalProducts={totalProducts}
          onPageChange={setPage}
        />
      ) : (
        <VariationStep
          detail={detail}
          isLoading={detailQuery.isLoading}
          availableColors={availableColors}
          selectedColorId={selectedColorId}
          onSelectColor={setSelectedColorId}
          availableVariants={availableVariants}
          selectedVariantId={selectedVariantId}
          onSelectVariant={setSelectedVariantId}
          selectedVariation={selectedVariation}
          qty={qty}
          onQtyChange={setQty}
        />
      )}
    </Modal>
  );
};

/* ─── Step 1: Search ────────────────────────────────────── */

interface SearchStepProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  products: ProductEntity[];
  isLoading: boolean;
  onSelect: (id: number) => void;
  page: number;
  totalPages: number;
  totalProducts: number;
  onPageChange: (p: number) => void;
}

const SearchStep: React.FC<SearchStepProps> = ({
  searchTerm,
  onSearchChange,
  products,
  isLoading,
  onSelect,
  page,
  totalPages,
  totalProducts,
  onPageChange,
}) => (
  <div>
    {/* Search bar */}
    <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name..."
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
          autoFocus
        />
      </div>
    </div>

    {/* Results */}
    <div className="max-h-[400px] overflow-y-auto px-5 py-3">
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="ml-2 text-sm">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Package size={28} className="mb-2" />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const img =
              p.images?.[0]?.path ?? p.product_images?.[0]?.path ?? null;
            const imgSrc = img ? toPublicUrl(img) : null;

            const prices = (p.variations ?? []).map((v) => v.selling_price);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
            const totalStock = (p.variations ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
            const variationCount = p.variations?.length ?? 0;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className="group flex w-full items-start gap-3.5 rounded-xl border border-transparent px-3 py-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50/80 hover:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
              >
                {/* Thumbnail */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package size={22} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {p.name}
                  </div>

                  {/* Category pills */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {p.main_category_name && (
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {p.main_category_name}
                      </span>
                    )}
                    {p.sub_category_name && (
                      <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                        {p.sub_category_name}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${totalStock > 0 ? "bg-emerald-500" : "bg-red-400"}`} />
                      {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                    </span>
                    <span>
                      {variationCount} variant{variationCount !== 1 ? "s" : ""}
                    </span>
                    {p.slug && (
                      <span className="hidden truncate text-gray-400 sm:inline dark:text-gray-500">
                        #{p.id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price column */}
                <div className="shrink-0 text-right">
                  {prices.length > 0 && (
                    <>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ৳{formatBDT(minPrice)}
                      </div>
                      {maxPrice !== minPrice && (
                        <div className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                          – ৳{formatBDT(maxPrice)}
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-1">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${totalStock > 10
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : totalStock > 0
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                      }`}>
                      {totalStock > 10 ? "In Stock" : totalStock > 0 ? "Low Stock" : "Out"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && products.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-1 pt-3 dark:border-gray-800">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Showing {products.length} of {totalProducts} products
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-medium text-gray-700 dark:text-gray-300">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

/* ─── Step 2: Variation Picker ──────────────────────────── */

interface VariationStepProps {
  detail: ProductSingleResponseEntity | undefined;
  isLoading: boolean;
  availableColors: Array<{ id: number; name: string; hex: string | null }>;
  selectedColorId: number | null;
  onSelectColor: (id: number) => void;
  availableVariants: Array<{ id: number; name: string }>;
  selectedVariantId: number | null;
  onSelectVariant: (id: number) => void;
  selectedVariation: ProductSingleVariation | undefined;
  qty: number;
  onQtyChange: (v: number) => void;
}

const VariationStep: React.FC<VariationStepProps> = ({
  detail,
  isLoading,
  availableColors,
  selectedColorId,
  onSelectColor,
  availableVariants,
  selectedVariantId,
  onSelectVariant,
  selectedVariation,
  qty,
  onQtyChange,
}) => {
  if (isLoading || !detail) {
    return (
      <div className="flex items-center justify-center px-5 py-16 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="ml-2 text-sm">Loading product details...</span>
      </div>
    );
  }

  const img = detail.images?.[0]?.path ?? null;
  const imgSrc = img ? toPublicUrl(img) : null;

  return (
    <div className="px-5 py-4">
      {/* Product header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={detail.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={22} className="text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-gray-900 dark:text-white">
            {detail.name}
          </div>
          <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {detail.summary?.total_variations ?? detail.variations?.length ?? 0}{" "}
            variations • {detail.summary?.total_stock ?? 0} total stock
          </div>
        </div>
      </div>

      {/* Color selector */}
      {availableColors.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => {
              const active = selectedColorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectColor(c.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 transition-all ${active
                    ? "bg-brand-50 text-brand-700 ring-brand-300 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/40"
                    : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700"
                    }`}
                >
                  {c.hex && (
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-gray-200 dark:ring-gray-600"
                      style={{ backgroundColor: c.hex }}
                    />
                  )}
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Variant / Size selector */}
      {availableVariants.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
            Size / Variant
          </p>
          <div className="flex flex-wrap gap-2">
            {availableVariants.map((v) => {
              const active = selectedVariantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant(v.id)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium ring-1 transition-all ${active
                    ? "bg-brand-50 text-brand-700 ring-brand-300 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/40"
                    : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700"
                    }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected variation info */}
      {selectedVariation ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400">SKU</span>
              <div className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                {selectedVariation.sku || "—"}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Price</span>
              <div className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                ৳{formatBDT(selectedVariation.selling_price)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Discount</span>
              <div className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                ৳{formatBDT(selectedVariation.discount)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Stock</span>
              <div
                className={`mt-0.5 font-semibold ${selectedVariation.stock > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500"
                  }`}
              >
                {selectedVariation.stock}
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Quantity
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQtyChange(Math.max(1, qty - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) =>
                  onQtyChange(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-8 w-16 rounded-lg border border-gray-200 text-center text-sm font-semibold text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => onQtyChange(qty + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Total line */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Total
            </span>
            <span className="text-base font-bold text-brand-600 dark:text-brand-400">
              ৳{formatBDT((selectedVariation.selling_price - selectedVariation.discount) * qty)}
            </span>
          </div>
        </div>
      ) : availableColors.length > 0 || availableVariants.length > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-xs text-gray-400 dark:border-gray-700">
          <AlertCircle size={14} />
          Select a color and size to see pricing & stock
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-xs text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertCircle size={14} />
          This product has no variations configured
        </div>
      )}
    </div>
  );
};

export default AddProductModal;
