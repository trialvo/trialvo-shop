// src/components/products/product-create/ProductEditModal.tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import ProductForm from "./ProductForm";
import { assignImageSku, getProduct, type ProductEntity, type ProductSingleResponseEntity, type ProductSingleVariation } from "@/api/products.api";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

type Props = {
  open: boolean;
  productId: number | null;
  onClose: () => void;
  onUpdated?: () => void;
};

const toProductEntity = (product: ProductSingleResponseEntity) => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    main_category_id: product.main_category?.id ?? 0,
    sub_category_id: product.sub_category?.id ?? 0,
    child_category_id: product.child_category?.id ?? 0,
    brand_id: product.brand?.id ?? 0,
    status: product.status,
    featured: product.featured,
    best_deal: product.best_deal,
    free_delivery: product.free_delivery,
    attribute_id: product.attribute?.id,
    video_path: product.video_path ?? null,
    short_description: product.short_description ?? null,
    long_description: product.long_description ?? null,
    meta_title: product.meta_title ?? null,
    meta_description: product.meta_description ?? null,
    meta_keywords: product.meta_keywords ?? null,
    canonical_url: product.canonical_url ?? null,
    og_title: product.og_title ?? null,
    og_description: product.og_description ?? null,
    robots: product.robots ?? null,
    created_at: product.created_at,
    updated_at: product.updated_at,
    images: product.images ?? [],
    product_images: product.images ?? [],
    // Pass real variations so ProductForm can derive productSkus for the image SKU picker
    variations: (product.variations ?? []) as any,
  };
};

export default function ProductEditModal({ open, productId, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const enabled = open && Boolean(productId);
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId as number),
    enabled,
    staleTime: 0,
    retry: 1,
  });

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-full max-w-[1100px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{t("products.categories.editProductTitle")}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t("products.categories.editProductDesc")}
            </p>
          </div>

          <button
            type="button"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
              "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]",
            )}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
            </div>
          ) : (
            <ProductForm
              mode="edit"
              productId={productId as number}
              initialProduct={data?.product ? toProductEntity(data.product) : null}
              productVariations={data?.product?.variations ?? []}
              onSkuAssign={async (imageId, sku_id) => {
                try { await assignImageSku(imageId, sku_id); } catch (e) { console.error(e); }
              }}
              onClose={onClose}
              onSuccess={() => onUpdated?.()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
