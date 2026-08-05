// src/components/products/create-product/DraggableImageGrid.tsx
/**
 * Drag-and-drop + arrow-button + SKU-assignment image grid.
 *
 * Each image card has:
 *  - ⠿ grab handle (free-form drag – fires API only on drop)
 *  - ‹ › arrow buttons (1-slot move, works on small screens)
 *  - ★ Set as Cover (jump to position 1)
 *  - 🎨 SKU badge / dropdown  (assign color+size SKU, or clear to "shared")
 *  - 🗑 Delete toggle
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  GripVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";
import type { ExistingImage } from "./types";

const ITEM_TYPE = "PRODUCT_IMAGE";
type DragItem = { index: number; id: number };

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProductSku = {
  id: number;
  color_id: number;
  color_name: string;
  color_hex: string;
  variant_id: number;
  variant_name: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Single card
// ─────────────────────────────────────────────────────────────────────────────

type ImageCardProps = {
  image: ExistingImage;
  index: number;
  total: number;
  markedForDelete: boolean;
  productSkus: ProductSku[];
  onHoverMove: (from: number, to: number) => void;
  onDropEnd: (finalImages: ExistingImage[]) => void;
  getCurrentImages: () => ExistingImage[];
  onDiscreteMove: (from: number, to: number) => void;
  onToggleDelete: (id: number) => void;
  onSkuAssign: (imageId: number, sku_id: number | null) => void;
};

function ImageCard({
  image,
  index,
  total,
  markedForDelete,
  productSkus,
  onHoverMove,
  onDropEnd,
  getCurrentImages,
  onDiscreteMove,
  onToggleDelete,
  onSkuAssign,
}: ImageCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [skuOpen, setSkuOpen] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type: ITEM_TYPE,
    item: { index, id: image.id },
    collect: (m) => ({ isDragging: m.isDragging() }),
    end: () => onDropEnd(getCurrentImages()),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (m) => ({ isOver: m.isOver() }),
    hover(item) {
      if (item.index === index) return;
      onHoverMove(item.index, index);
      item.index = index;
    },
  });

  drop(preview(ref));

  const isFirst = index === 0;
  const isLast = index === total - 1;

  const assignedSku = productSkus.find((s) => s.id === image.sku_id);

  const badgeLabel = assignedSku
    ? `${assignedSku.color_name} / ${assignedSku.variant_name}`
    : null;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col rounded-lg border bg-white dark:bg-gray-900 transition-all duration-150",
        markedForDelete
          ? "border-error-300 dark:border-error-900/40 opacity-50"
          : isOver
          ? "border-brand-400 ring-2 ring-brand-300/50"
          : "border-gray-200 dark:border-gray-800",
        isDragging ? "opacity-30 scale-95" : "",
      )}
    >
      {/* Serial / Cover badge */}
      {!markedForDelete && (
        <div
          className={cn(
            "absolute top-1 left-1 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold text-white leading-none",
            index === 0 ? "bg-brand-500" : "bg-black/60",
          )}
        >
          {index === 0 ? "Cover" : `#${index + 1}`}
        </div>
      )}

      {/* SKU badge on top-center when assigned */}
      {badgeLabel && !markedForDelete && (
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white leading-none shadow"
          style={{ backgroundColor: assignedSku?.color_hex || "#555" }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full border border-white/50"
            style={{ backgroundColor: assignedSku?.color_hex }}
          />
          {badgeLabel}
        </div>
      )}

      {/* Drag handle */}
      <div
        ref={drag as unknown as React.Ref<HTMLDivElement>}
        className="absolute top-1 right-1 z-10 cursor-grab active:cursor-grabbing rounded bg-black/50 p-0.5 text-white hover:bg-black/80 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </div>

      {/* Image */}
      <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-50 dark:bg-gray-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={toPublicUrl(image.path)}
          alt="product"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* SKU assignment dropdown */}
      {!markedForDelete && productSkus.length > 0 && (
        <div className="relative px-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSkuOpen((p) => !p)}
            className={cn(
              "flex w-full items-center justify-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors truncate",
              assignedSku
                ? "border-transparent text-white"
                : "border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400",
            )}
            style={
              assignedSku
                ? { backgroundColor: assignedSku.color_hex || "#555" }
                : undefined
            }
            title={badgeLabel ?? "Assign to a SKU (color + size)"}
          >
            <Layers size={10} />
            <span className="truncate">
              {badgeLabel ?? "Assign SKU"}
            </span>
          </button>

          {skuOpen && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-lg overflow-auto max-h-48">
              {/* Clear option */}
              <button
                type="button"
                onClick={() => { onSkuAssign(image.id, null); setSkuOpen(false); }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.04] border-b border-gray-100 dark:border-gray-800"
              >
                <X size={10} /> All SKUs (shared)
              </button>

              {productSkus.map((sku) => (
                <button
                  key={sku.id}
                  type="button"
                  onClick={() => { onSkuAssign(image.id, sku.id); setSkuOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]",
                    image.sku_id === sku.id
                      ? "font-bold text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: sku.color_hex }}
                  />
                  <span className="truncate">{sku.color_name} / {sku.variant_name}</span>
                  {image.sku_id === sku.id && (
                    <span className="ml-auto text-brand-500 text-[9px] flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-1 p-1.5 pt-1">
        {/* ← */}
        <button
          type="button"
          title="Move left"
          disabled={isFirst || markedForDelete}
          onClick={() => onDiscreteMove(index, index - 1)}
          className={cn(
            "flex items-center justify-center rounded border p-1 transition-colors text-gray-600 dark:text-gray-300",
            isFirst || markedForDelete
              ? "opacity-30 cursor-not-allowed border-gray-100 dark:border-gray-800"
              : "border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/[0.06]",
          )}
        >
          <ChevronLeft size={13} />
        </button>

        {/* ★ Set Cover */}
        <button
          type="button"
          title="Set as cover"
          disabled={isFirst || markedForDelete}
          onClick={() => onDiscreteMove(index, 0)}
          className={cn(
            "flex flex-1 items-center justify-center rounded border p-1 transition-colors text-[10px] font-semibold gap-0.5",
            isFirst
              ? "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-900/40 dark:bg-brand-500/10 dark:text-brand-300 cursor-default"
              : markedForDelete
              ? "opacity-30 cursor-not-allowed border-gray-100 dark:border-gray-800 text-gray-400"
              : "border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:border-gray-700 dark:text-gray-300",
          )}
        >
          <Star size={10} />
          {isFirst ? "Cover" : "Set cover"}
        </button>

        {/* → */}
        <button
          type="button"
          title="Move right"
          disabled={isLast || markedForDelete}
          onClick={() => onDiscreteMove(index, index + 1)}
          className={cn(
            "flex items-center justify-center rounded border p-1 transition-colors text-gray-600 dark:text-gray-300",
            isLast || markedForDelete
              ? "opacity-30 cursor-not-allowed border-gray-100 dark:border-gray-800"
              : "border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/[0.06]",
          )}
        >
          <ChevronRight size={13} />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onToggleDelete(image.id)}
          title={markedForDelete ? "Undo delete" : "Delete"}
          className={cn(
            "flex items-center justify-center rounded border p-1 transition-colors",
            markedForDelete
              ? "border-error-200 bg-error-50 text-error-600 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300"
              : "border-gray-200 text-gray-500 hover:bg-error-50 hover:text-error-600 hover:border-error-200 dark:border-gray-700 dark:text-gray-400",
          )}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  images: ExistingImage[];
  deleteImageIds: number[];
  /** SKUs (color+size combos) used by this product's variations */
  productSkus?: ProductSku[];
  onReorder: (newImages: ExistingImage[]) => void;
  onToggleDelete: (id: number) => void;
  /** Called when a SKU is assigned or cleared on an image */
  onSkuAssign?: (imageId: number, sku_id: number | null) => void;
};

export default function DraggableImageGrid({
  images,
  deleteImageIds,
  productSkus = [],
  onReorder,
  onToggleDelete,
  onSkuAssign,
}: Props) {
  const [localImages, setLocalImages] = useState<ExistingImage[]>(images);
  const localRef = useRef<ExistingImage[]>(images);

  useEffect(() => {
    setLocalImages(images);
    localRef.current = images;
  }, [images]);

  const handleHoverMove = useCallback((from: number, to: number) => {
    setLocalImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      localRef.current = next;
      return next;
    });
  }, []);

  const handleDropEnd = useCallback(
    (finalImages: ExistingImage[]) => onReorder(finalImages),
    [onReorder],
  );

  const getCurrentImages = useCallback(() => localRef.current, []);

  const handleDiscreteMove = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = [...localRef.current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      localRef.current = next;
      setLocalImages(next);
      onReorder(next);
    },
    [onReorder],
  );

  const handleSkuAssign = useCallback(
    (imageId: number, sku_id: number | null) => {
      setLocalImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                sku_id,
                sku_color_id: sku_id
                  ? (productSkus.find((s) => s.id === sku_id)?.color_id ?? null)
                  : null,
                sku_variant_id: sku_id
                  ? (productSkus.find((s) => s.id === sku_id)?.variant_id ?? null)
                  : null,
              }
            : img,
        ),
      );
      localRef.current = localRef.current.map((img) =>
        img.id === imageId ? { ...img, sku_id } : img,
      );
      onSkuAssign?.(imageId, sku_id);
    },
    [onSkuAssign, productSkus],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <GripVertical size={12} className="inline" />
        Drag or use ‹ › to reorder &middot; assign a SKU so customers see image only for that color+size
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {localImages.map((img, idx) => (
          <ImageCard
            key={img.id}
            image={img}
            index={idx}
            total={localImages.length}
            markedForDelete={deleteImageIds.includes(img.id)}
            productSkus={productSkus}
            onHoverMove={handleHoverMove}
            onDropEnd={handleDropEnd}
            getCurrentImages={getCurrentImages}
            onDiscreteMove={handleDiscreteMove}
            onToggleDelete={onToggleDelete}
            onSkuAssign={handleSkuAssign}
          />
        ))}
      </div>
    </div>
  );
}
