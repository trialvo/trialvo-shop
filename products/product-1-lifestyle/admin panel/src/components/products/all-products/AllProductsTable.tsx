"use client";

import type { TFunction } from "i18next";
import { Copy, PackageSearch, Pencil, Plus, Star, Trash2 } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import type { Product } from "./types";

import StatusToggle from "@/components/ui/button/StatusToggle";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  products: Product[];
  onStockPlus: (productId: string) => void;
  onToggleStatus: (productId: string, next: Product["status"]) => void;
  onToggleSinglePage: (productId: string) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
};

type RowActionHandlers = Pick<Props, "onStockPlus" | "onToggleStatus" | "onToggleSinglePage" | "onEdit" | "onDelete">;
type TranslationProps = { t: TFunction };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMoney = (n: number): string => (Number.isFinite(n) ? n : 0).toFixed(2);
const isLowStock  = (qty: number): boolean => qty <= 10;

// ─── Shell / sticky classes ───────────────────────────────────────────────────

/**
 * Shell matches SectionCard:
 *   shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)]
 */
const tableShellClass = cn(
  "w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white",
  "border border-gray-100",
  "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)]",
  "transition-shadow duration-300 ease-out",
  "dark:border-gray-800 dark:bg-gray-900",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]",
);

// Header: stronger bg + text so columns are immediately scannable
const headerCellBaseClass =
  "px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400";

const stickyActionHeaderClass = cn(
  "sticky right-0 z-40",  // z-40 > thead z-30 > body action z-20
  "w-[1%] whitespace-nowrap",
  // Fully solid — no transparency so it always sits above row content
  "border-l border-gray-200 bg-gray-100",
  "shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.08)]",
  "dark:border-gray-700 dark:bg-gray-800",
  "dark:shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.4)]",
);

const stickyActionCellClass = cn(
  "sticky right-0 z-20",
  "w-[1%] whitespace-nowrap",
  // Solid, never transparent — consistent with the header column
  "border-l border-gray-100 bg-white",
  "group-hover:bg-gray-50",
  "transition-colors duration-150",
  "dark:border-gray-800 dark:bg-gray-900 dark:group-hover:bg-gray-800/80",
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadges({ product }: Readonly<{ product: Product }>) {
  const { category, subCategory, childCategory } = product.categoryPath;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Main category */}
      <span className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium",
        "border border-gray-200 bg-gray-50 text-gray-600",
        "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
      )}>
        {category}
      </span>

      {subCategory ? (
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5",
          "text-xs font-medium",
          "border border-brand-100 bg-brand-50/60 text-brand-700",
          "dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300",
        )}>
          {subCategory}
        </span>
      ) : null}

      {childCategory ? (
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5",
          "text-xs font-medium",
          "border border-teal-100 bg-teal-50/60 text-teal-700",
          "dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300",
        )}>
          {childCategory}
        </span>
      ) : null}
    </div>
  );
}

function TableHeadRow({ t }: Readonly<TranslationProps>) {
  return (
    // Solid, visually distinct header row — strong bg + bottom divider + sticky shadow
    <TableRow className="border-b-2 border-gray-200 bg-gray-100 shadow-[0_2px_8px_-2px_rgba(16,24,40,0.10)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]">
      <TableCell isHeader className={cn(headerCellBaseClass, "w-[52px] text-center")}>
        {t("products.table.sl")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[300px]")}>
        {t("products.table.product")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[120px]")}>
        {t("products.table.position")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[320px]")}>
        {t("products.table.category")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[200px]")}>
        {t("products.table.stock")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[200px]")}>
        {t("products.table.price")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[120px]")}>
        Rating
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[120px]")}>
        {t("products.table.status")}
      </TableCell>
      <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[140px]")}>
        Single Page
      </TableCell>
      <TableCell
        isHeader
        className={cn(
          stickyActionHeaderClass,
          headerCellBaseClass,
          "min-w-[120px] text-right",
        )}
      >
        {t("products.table.action")}
      </TableCell>
    </TableRow>
  );
}

function ProductIdentityCell({ product }: Readonly<{ product: Product }>) {
  const fallback = imageFallbackSvgDataUri(product.name);
  const imageSrc = product.imageUrl ? toPublicUrl(product.imageUrl) : fallback;

  return (
    <TableCell className="px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        {/* Image */}
        <div className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center",
          "overflow-hidden rounded-xl",
          "border border-gray-200/80 bg-gray-100",
          "shadow-[0_1px_3px_rgba(0,0,0,0.07)]",
          "dark:border-gray-700/60 dark:bg-gray-800",
        )}>
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-opacity duration-200"
            loading="lazy"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.src !== fallback) t.src = fallback;
            }}
          />
        </div>

        {/* Text */}
        <div className="min-w-0">
          <div className="max-w-[260px] truncate text-sm font-semibold text-gray-900 dark:text-white">
            {product.name}
          </div>
          {product.name_bd ? (
            <div className="max-w-[260px] truncate text-xs text-brand-500 dark:text-brand-400">
              {product.name_bd}
            </div>
          ) : null}
          <div className="mt-0.5 truncate font-mono text-[11px] text-gray-400 dark:text-gray-500">
            {product.sku}
          </div>
        </div>
      </div>
    </TableCell>
  );
}

function StockInfoCell({
  product,
  t,
  onStockPlus,
}: Readonly<{
  product: Product;
  t: TFunction;
  onStockPlus: (productId: string) => void;
}>) {
  const lowStock = isLowStock(product.stockQty);

  return (
    <TableCell className="px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col leading-snug">
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            lowStock ? "text-error-500 dark:text-error-400" : "text-gray-900 dark:text-white",
          )}>
            {t("products.table.totalLabel", { count: product.stockQty })}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {t("products.table.variantsLabel", { count: product.variantCount })}
          </span>
        </div>

        {/* Stock update button */}
        <button
          type="button"
          onClick={() => onStockPlus(product.id)}
          aria-label="Update stock"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            "border border-brand-200/60 bg-brand-50/60 text-brand-600",
            "hover:bg-brand-100 hover:border-brand-300",
            "transition-all duration-150",
            "dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400",
            "dark:hover:bg-brand-500/20",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {/* Low stock badge */}
        {lowStock ? (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
            "text-[10px] font-semibold",
            "border border-error-100 bg-error-50 text-error-600",
            "dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400",
          )}>
            {/* Pulsing dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-error-500" />
            </span>
            {t("products.table.low")}
          </span>
        ) : null}
      </div>
    </TableCell>
  );
}

function PriceInfoCell({ product, t }: Readonly<{ product: Product; t: TFunction }>) {
  const hasDiscount = (product.discount ?? 0) > 0;

  return (
    <TableCell className="px-4 py-3.5">
      <div className="leading-snug">
        <div className="whitespace-nowrap text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
          ৳{formatMoney(product.price)}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
          {hasDiscount ? (
            <span className={cn(
              "rounded-full px-1.5 py-0.5",
              "border border-success-100 bg-success-50 text-success-700 font-medium",
              "dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400",
            )}>
              -{product.discount}%
            </span>
          ) : null}
          <span className="text-gray-400 dark:text-gray-500">
            {t("products.table.sale", { value: formatMoney(product.salePrice ?? product.price) })}
          </span>
        </div>
      </div>
    </TableCell>
  );
}

function RowActionCell({
  product,
  onEdit,
  onDelete,
}: Readonly<{
  product: Product;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}>) {
  return (
    <TableCell className={cn(stickyActionCellClass, "px-4 py-3.5")}>
      <div className="inline-flex items-center justify-end gap-1.5">
        {/* Edit — solid surface, never transparent */}
        <button
          type="button"
          onClick={() => onEdit(product.id)}
          aria-label="Edit product"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "border border-gray-200 bg-gray-50 text-gray-600",
            "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600",
            "active:scale-95 transition-all duration-150",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
            "dark:hover:border-brand-500/50 dark:hover:bg-brand-500/15 dark:hover:text-brand-300",
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {/* Delete — solid surface, never transparent */}
        <button
          type="button"
          onClick={() => onDelete(product.id)}
          aria-label="Delete product"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "border border-error-100 bg-error-50 text-error-500",
            "hover:border-error-300 hover:bg-error-100 hover:text-error-700",
            "active:scale-95 transition-all duration-150",
            "dark:border-error-500/25 dark:bg-error-500/10 dark:text-error-400",
            "dark:hover:border-error-500/50 dark:hover:bg-error-500/20 dark:hover:text-error-300",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </TableCell>
  );
}

type ProductDataRowProps = {
  product: Product;
  index: number;
  t: TFunction;
} & RowActionHandlers;

function ProductDataRow({
  product,
  index,
  t,
  onStockPlus,
  onToggleStatus,
  onToggleSinglePage,
  onEdit,
  onDelete,
}: ProductDataRowProps) {
  return (
    <TableRow
      className={cn(
        "group border-b border-gray-100/80",
        "transition-colors duration-150",
        "hover:bg-gray-50/60",
        "dark:border-gray-800/80 dark:hover:bg-white/[0.02]",
      )}
    >
      {/* Serial */}
      <TableCell className="px-4 py-3.5 text-center">
        <span className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-md",
          "text-xs font-semibold",
          "bg-gray-100 text-gray-500",
          "dark:bg-gray-800 dark:text-gray-400",
        )}>
          {index + 1}
        </span>
      </TableCell>

      <ProductIdentityCell product={product} />

      {/* Position */}
      <TableCell className="px-4 py-3.5">
        <span className={cn(
          "inline-flex items-center rounded-lg px-2.5 py-1",
          "text-xs font-semibold tabular-nums",
          "bg-gray-100 text-gray-700",
          "dark:bg-gray-800 dark:text-gray-300",
        )}>
          #{product.positionNumber}
        </span>
      </TableCell>

      {/* Category breadcrumb */}
      <TableCell className="px-4 py-3.5">
        <CategoryBadges product={product} />
      </TableCell>

      <StockInfoCell product={product} t={t} onStockPlus={onStockPlus} />
      <PriceInfoCell product={product} t={t} />

      {/* Rating */}
      <TableCell className="px-4 py-3.5">
        {product.reviewCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {product.avgRating.toFixed(1)}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        )}
      </TableCell>

      {/* Status toggle */}
      <TableCell className="px-4 py-3.5">
        <StatusToggle
          value={product.status}
          onChange={(next) => onToggleStatus(product.id, next)}
        />
      </TableCell>

      {/* Single Page toggle */}
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSinglePage(product.id)}
            aria-label="Toggle single product page"
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
              "border-2 border-transparent transition-colors duration-200 ease-in-out",
              product.hasSingleProductPage
                ? "bg-purple-500"
                : "bg-gray-200 dark:bg-gray-700",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm",
                "transform transition-transform duration-200 ease-in-out",
                product.hasSingleProductPage ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </button>
          {product.hasSingleProductPage && (
            <button
              type="button"
              onClick={() => {
                const shopUrl = import.meta.env.VITE_SHOP_URL || 'http://localhost:3000';
                const url = `${shopUrl}/single-order-page/${product.slug}/${product.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  toast.success('Page URL copied!');
                }).catch(() => {
                  toast.error('Failed to copy URL');
                });
              }}
              aria-label="Copy single page URL"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md",
                "border border-purple-200 bg-purple-50 text-purple-600",
                "hover:bg-purple-100 hover:border-purple-300",
                "transition-all duration-150",
                "dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400",
                "dark:hover:bg-purple-500/20",
              )}
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      </TableCell>

      <RowActionCell product={product} onEdit={onEdit} onDelete={onDelete} />
    </TableRow>
  );
}

function EmptyStateRow({ t }: Readonly<TranslationProps>) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={10} className="px-4 py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Illustration circle */}
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl",
            "bg-gray-100 dark:bg-gray-800",
          )}>
            <PackageSearch className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {t("products.table.noProducts")}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Try adjusting your filters or add a new product.
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const AllProductsTable: React.FC<Props> = ({
  products,
  onStockPlus,
  onToggleStatus,
  onToggleSinglePage,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className={tableShellClass}>
      {/*
        overflow-x/y-auto enables both axes as needed.
        max-h constrains the table so sticky <thead> pins within this box.
        No overscroll containment: at inner scroll limits, outer page scroll continues.
      */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <Table className="min-w-[1080px] border-collapse">
          <TableHeader>
            <TableHeadRow t={t} />
          </TableHeader>

          <TableBody>
            {products.length === 0 ? (
              <EmptyStateRow t={t} />
            ) : (
              products.map((product, index) => (
                <ProductDataRow
                  key={product.id}
                  product={product}
                  index={index}
                  t={t}
                  onStockPlus={onStockPlus}
                  onToggleStatus={onToggleStatus}
                  onToggleSinglePage={onToggleSinglePage}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AllProductsTable;
