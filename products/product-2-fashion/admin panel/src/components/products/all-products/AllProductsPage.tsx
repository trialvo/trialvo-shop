// src/components/products/all-products/AllProductsPage.tsx
"use client";

import React from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";

import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Pagination from "@/components/ui/pagination/Pagination";
import SectionCard from "@/components/ui/layout/SectionCard";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";

import AllProductsTable from "./AllProductsTable";
import AllProductsSearchBar from "./AllProductsSearchBar";
import type { Product, ProductListFilters } from "./types";
import { toUiProduct } from "./utils";

import {
  deleteProduct,
  getProducts,
  toggleSingleProductPage,
  updateProductStatus,
  type ProductsListParams,
  type ProductsListResponse,
} from "@/api/products.api";
import { getChildCategories, getMainCategories, getSubCategories } from "@/api/categories.api";
import type { ChildCategory, MainCategory, SubCategory } from "@/components/products/product-category/types";

import EditProductModal from "./EditProductModal";
import StockVariantsModal from "./StockVariantsModal";

type Option = { value: string; label: string };
type ApiErrorResponse = { error?: string; message?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.rows)) return payload.rows as T[];

  return [];
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function parseProductId(productId: string): number | null {
  const parsed = Number(productId);
  return Number.isFinite(parsed) ? parsed : null;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(err)) {
    const msg = err.response?.data?.error ?? err.response?.data?.message;
    if (typeof msg === "string" && msg.trim().length > 0) return msg;
  }

  if (err instanceof Error && err.message.trim().length > 0) return err.message;
  return fallback;
}

const AllProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const navigate = useNavigate();

  const [filters, setFilters] = React.useState<ProductListFilters>({
    q: "",
    mainCategoryId: undefined,
    subCategoryId: undefined,
    childCategoryId: undefined,
    brandId: undefined,
    status: undefined,
    featured: undefined,
    bestDeal: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    limit: 20,
    offset: 0,
  });

  const [showLowStock, setShowLowStock] = React.useState(false);

  const debouncedQ = useDebouncedValue(filters.q, 450);

  const { data: mainRes } = useQuery({
    queryKey: ["mainCategories-all"],
    queryFn: () => getMainCategories(),
    staleTime: 60_000,
  });

  const { data: subRes } = useQuery({
    queryKey: ["subCategories-all"],
    queryFn: () => getSubCategories(),
    staleTime: 60_000,
  });

  const { data: childRes } = useQuery({
    queryKey: ["childCategories-all"],
    queryFn: () => getChildCategories(),
    staleTime: 60_000,
  });

  const mains = React.useMemo(() => unwrapList<MainCategory>(mainRes), [mainRes]);
  const subs = React.useMemo(() => unwrapList<SubCategory>(subRes), [subRes]);
  const childs = React.useMemo(() => unwrapList<ChildCategory>(childRes), [childRes]);

  const mainNameById = React.useMemo(
    () => new Map(mains.map((c) => [c.id, c.name])),
    [mains],
  );
  const subNameById = React.useMemo(
    () => new Map(subs.map((c) => [c.id, c.name])),
    [subs],
  );
  const childNameById = React.useMemo(
    () => new Map(childs.map((c) => [c.id, c.name])),
    [childs],
  );

  const mainOptions: Option[] = React.useMemo(
    () => [{ value: "", label: "All Categories" }, ...mains.map((c) => ({ value: String(c.id), label: c.name }))],
    [mains],
  );

  const availableSubs = React.useMemo(() => {
    if (!filters.mainCategoryId) return subs;
    return subs.filter((s) => s.main_category_id === filters.mainCategoryId);
  }, [subs, filters.mainCategoryId]);

  const subOptions: Option[] = React.useMemo(
    () => [{ value: "", label: "All Sub Categories" }, ...availableSubs.map((c) => ({ value: String(c.id), label: c.name }))],
    [availableSubs],
  );

  const availableChild = React.useMemo(() => {
    if (!filters.subCategoryId) return childs;
    return childs.filter((c) => c.sub_category_id === filters.subCategoryId);
  }, [childs, filters.subCategoryId]);

  const childOptions: Option[] = React.useMemo(
    () => [{ value: "", label: "All Child Categories" }, ...availableChild.map((c) => ({ value: String(c.id), label: c.name }))],
    [availableChild],
  );

  // ✅ initial request => only ?limit=20 (no offset=0, no search=on)
  const productsQuery = useQuery({
    queryKey: ["products", { ...filters, q: debouncedQ, showLowStock }],
    queryFn: () => {
      const params: ProductsListParams = { limit: filters.limit };
      const search = debouncedQ.trim();

      if (filters.offset > 0) params.offset = filters.offset;
      if (search.length > 0) params.search = search;

      if (filters.mainCategoryId !== undefined) params.main_category_id = filters.mainCategoryId;
      if (filters.subCategoryId !== undefined) params.sub_category_id = filters.subCategoryId;
      if (filters.childCategoryId !== undefined) params.child_category_id = filters.childCategoryId;
      if (filters.brandId !== undefined) params.brand_id = filters.brandId;

      if (filters.status !== undefined) params.status = filters.status;
      if (filters.featured !== undefined) params.featured = filters.featured;
      if (filters.bestDeal !== undefined) params.best_deal = filters.bestDeal;

      if (filters.minPrice !== undefined) params.min_price = filters.minPrice;
      if (filters.maxPrice !== undefined) params.max_price = filters.maxPrice;

      // Low-stock filter: show only out-of-stock or near-zero stock products
      if (showLowStock) params.in_stock = false;

      return getProducts(params);
    },
    staleTime: 0,
    retry: 1,
  });

  const uiProducts: Product[] = React.useMemo(() => {
    const list = productsQuery.data?.products ?? [];
    return list.map((p) => toUiProduct(p, { mainNameById, subNameById, childNameById }));
  }, [productsQuery.data, mainNameById, subNameById, childNameById]);

  // -----------------------
  // ✅ Stock modal state
  // -----------------------
  const [stockOpen, setStockOpen] = React.useState(false);
  const [stockProductId, setStockProductId] = React.useState<number | null>(null);
  const stockProductName = React.useMemo(() => {
    if (stockProductId === null) return undefined;
    const p = productsQuery.data?.products?.find((x) => x.id === stockProductId);
    return p?.name;
  }, [productsQuery.data, stockProductId]);

  const onStockPlus = (productId: string) => {
    const id = parseProductId(productId);
    if (id === null) return;
    setStockProductId(id);
    setStockOpen(true);
  };

  // -----------------------
  // ✅ Edit/Delete modals
  // -----------------------
  const [editOpen, setEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const deleteName = React.useMemo(() => {
    const p = productsQuery.data?.products?.find((x) => x.id === deleteId);
    return p?.name;
  }, [productsQuery.data, deleteId]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      toast.success(t("products.productDeleted"));
      setDeleteOpen(false);
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t("products.failedDeleteProduct")));
    },
  });

  const onEdit = (productId: string) => {
    const id = parseProductId(productId);
    if (id === null) return;
    setEditId(id);
    setEditOpen(true);
  };

  const onDelete = (productId: string) => {
    const id = parseProductId(productId);
    if (id === null) return;
    setDeleteId(id);
    setDeleteOpen(true);
  };

  // -----------------------
  // ✅ Status toggle API
  // -----------------------
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: boolean }) => updateProductStatus(id, status),
    onSuccess: () => {
      toast.success(t("products.statusUpdated"));
      qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t("products.failedUpdateStatus")));
      qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined);
    },
  });

  const onToggleStatus = (id: string, next: Product["status"]) => {
    const pid = parseProductId(id);
    if (pid === null) return;
    const nextBool = next === "active";

    // optimistic cache update
    qc.setQueriesData<ProductsListResponse>({ queryKey: ["products"] }, (old) => {
      if (!old?.products) return old;
      return {
        ...old,
        products: old.products.map((p) => (p.id === pid ? { ...p, status: nextBool } : p)),
      };
    });

    statusMutation.mutate({ id: pid, status: nextBool });
  };

  // -----------------------
  // ✅ Single Page toggle API
  // -----------------------
  const singlePageMutation = useMutation({
    mutationFn: (id: number) => toggleSingleProductPage(id),
    onSuccess: () => {
      toast.success("Single page toggle updated");
      qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to toggle single page"));
      qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined);
    },
  });

  const onToggleSinglePage = (productId: string) => {
    const pid = parseProductId(productId);
    if (pid === null) return;

    // optimistic cache update
    qc.setQueriesData<ProductsListResponse>({ queryKey: ["products"] }, (old) => {
      if (!old?.products) return old;
      return {
        ...old,
        products: old.products.map((p) =>
          p.id === pid ? { ...p, has_single_product_page: !p.has_single_product_page } : p
        ),
      };
    });

    singlePageMutation.mutate(pid);
  };

  const lowStockCount = uiProducts.filter((p) => p.stockQty <= 10).length;

  const total = productsQuery.data?.total ?? 0;
  const limit = filters.limit;
  const offset = filters.offset;

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Toolbar */}
      <SectionCard noPadding className="overflow-visible">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <AllProductsSearchBar
              value={filters.q}
              placeholder={t("products.searchPlaceholder")}
              onValueChange={(value) => setFilters((p) => ({ ...p, q: value, offset: 0 }))}
              onSearch={() => productsQuery.refetch()}
              onClear={() => setFilters((p) => ({ ...p, q: "", offset: 0 }))}
              searchAriaLabel={t("common.search", "Search")}
              clearAriaLabel={t("common.clear", "Clear search")}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                className="h-11"
                startIcon={<Download className="h-4 w-4" />}
                onClick={() => console.log("export")}
                type="button"
              >
                Export
              </Button>

              <Button
                variant={showLowStock ? "primary" : "outline"}
                className={`h-11 ${showLowStock ? "bg-orange-600 hover:bg-orange-700" : "border-orange-400 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400"}`}
                onClick={() => {
                  setShowLowStock((prev) => !prev);
                  setFilters((p) => ({ ...p, offset: 0 }));
                }}
                type="button"
              >
                {showLowStock
                  ? t("products.showAll", "Show All")
                  : t("products.lowStockList", { count: lowStockCount })}
              </Button>

              <Button
                variant="primary"
                className="h-11 bg-teal-700 hover:bg-teal-800"
                onClick={() => navigate("/create-product")}
                type="button"
              >
                {t("products.newProductRequest")}
              </Button>
            </div>
          </div>

          {/* Filters row */}
          <div className="rounded-[6px] border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
            <div className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">{t("products.categoryFilter")}</div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Select
                key={`main-${filters.mainCategoryId ?? ""}`}
                options={mainOptions}
                placeholder={t("products.allCategories")}
                defaultValue={filters.mainCategoryId ? String(filters.mainCategoryId) : ""}
                onChange={(v) => {
                  const id = v ? Number(v) : undefined;
                  setFilters((p) => ({
                    ...p,
                    mainCategoryId: id,
                    subCategoryId: undefined,
                    childCategoryId: undefined,
                    offset: 0,
                  }));
                }}
              />

              <Select
                key={`sub-${filters.mainCategoryId ?? ""}-${filters.subCategoryId ?? ""}`}
                options={subOptions}
                placeholder={t("products.allSubCategories")}
                defaultValue={filters.subCategoryId ? String(filters.subCategoryId) : ""}
                onChange={(v) => {
                  const id = v ? Number(v) : undefined;
                  setFilters((p) => ({
                    ...p,
                    subCategoryId: id,
                    childCategoryId: undefined,
                    offset: 0,
                  }));
                }}
              />

              <Select
                key={`child-${filters.subCategoryId ?? ""}-${filters.childCategoryId ?? ""}`}
                options={childOptions}
                placeholder={t("products.allChildCategories")}
                defaultValue={filters.childCategoryId ? String(filters.childCategoryId) : ""}
                onChange={(v) => {
                  const id = v ? Number(v) : undefined;
                  setFilters((p) => ({ ...p, childCategoryId: id, offset: 0 }));
                }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Table */}
      <div className="w-full min-w-0">
        <AllProductsTable
          products={uiProducts}
          onStockPlus={onStockPlus}
          onToggleStatus={onToggleStatus}
          onToggleSinglePage={onToggleSinglePage}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Pagination */}
      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        onPageChange={(nextOffset) =>
          setFilters((p) => ({ ...p, offset: nextOffset }))
        }
      />

      {/* ✅ Stock modal (variations) */}
      <StockVariantsModal
        open={stockOpen}
        productId={stockProductId}
        productName={stockProductName}
        onClose={() => {
          setStockOpen(false);
          setStockProductId(null);
        }}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined)}
      />

      {/* Edit */}
      <EditProductModal
        open={editOpen}
        productId={editId}
        onClose={() => setEditOpen(false)}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["products"] }).catch(() => undefined)}
      />

      {/* Delete */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId === null) return;
          deleteMutation.mutate(deleteId);
        }}
        loading={deleteMutation.isPending}
        title={t("products.confirmDelete.title")}
        subtitle={t("products.confirmDelete.subtitle")}
        message={deleteName ? `"${deleteName}"` : undefined}
        consequenceLines={[
          t("products.confirmDelete.effects.productRemoved"),
          t("products.confirmDelete.effects.variantsRemoved"),
          t("products.confirmDelete.effects.cannotRecover"),
        ]}
        confirmLabel={t("products.confirmDelete.confirm")}
      />
    </div>
  );
};

export default AllProductsPage;
