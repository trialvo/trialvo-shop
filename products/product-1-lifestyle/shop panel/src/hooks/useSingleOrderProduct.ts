"use client";

/**
 * hooks/useSingleOrderProduct.ts — Fetches product data for the SOP
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { singleOrderService, sopKeys } from "@/lib/api/single-order/service";
import type {
  SOPProduct,
  SOPProductImage,
  SOPVariation,
  SOPBulkOffer,
} from "@/types/single-order";
import { IMAGE_URL } from "@/config/env";

// ── Image URL Helper ─────────────────────────────────────────────────────────

export function toSOPImageUrl(path?: string | null): string {
  if (!path) return "/placeholder.webp";
  if (/^https?:\/\//i.test(path)) return path;
  return `${IMAGE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export type UseSingleOrderProductResult = {
  product: SOPProduct | null;
  isLoading: boolean;
  error: string | null;
  /** Currently selected SKU based on color + variant selections */
  selectedSku: SOPVariation | null;
  /** Images filtered by selected color */
  filteredImages: SOPProductImage[];
  /** Bulk offers filtered by selected SKU */
  skuBulkOffers: SOPBulkOffer[];
  /** Computed unit price for selected SKU */
  unitPrice: number;
  /** Active image index */
  activeImageIndex: number;
  /** Color selection */
  selectedColorId: number | null;
  /** Variant selection */
  selectedVariantId: number | null;
};

export function useSingleOrderProduct(
  productId: number,
  selectedColorId: number | null,
  selectedVariantId: number | null,
) {
  const query = useQuery<SOPProduct>({
    queryKey: sopKeys.product(productId),
    enabled: productId > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await singleOrderService.getProduct(productId);
      if (!res.success || !res.product) {
        throw new Error(res.message || "Product not available");
      }
      return res.product;
    },
  });

  const product = query.data ?? null;

  const selectedSku = useMemo<SOPVariation | null>(() => {
    if (!product) return null;
    return (
      product.variations.find(
        (v) =>
          (selectedColorId === null || v.color?.id === selectedColorId) &&
          (selectedVariantId === null || v.variant?.id === selectedVariantId),
      ) ??
      product.variations[0] ??
      null
    );
  }, [product, selectedColorId, selectedVariantId]);

  const unitPrice = useMemo(
    () => selectedSku?.final_price ?? 0,
    [selectedSku],
  );

  const skuBulkOffers = useMemo<SOPBulkOffer[]>(() => {
    if (!product || !selectedSku) return [];
    return product.bulk_offers
      .filter((b) => b.product_sku_id === selectedSku.id)
      .sort((a, b) => a.min_qty - b.min_qty);
  }, [product, selectedSku]);

  const filteredImages = useMemo<SOPProductImage[]>(() => {
    if (!product) return [];
    if (selectedColorId) {
      const colorImgs = product.images.filter(
        (img) => img.sku_color_id === selectedColorId,
      );
      if (colorImgs.length > 0) return colorImgs;
    }
    return product.images;
  }, [product, selectedColorId]);

  return {
    product,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    selectedSku,
    filteredImages,
    skuBulkOffers,
    unitPrice,
  };
}
