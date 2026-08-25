"use client";

import * as React from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { MdOutlineCompareArrows } from "react-icons/md";
import { cn } from "@/lib/utils";
import { useCompareStore } from "@/hooks/useCompareStore";
import type { CompareSlot } from "@/hooks/useCompareStore";
import { useTranslation } from "@/hooks/useTranslation";

interface AddToCompareButtonProps {
  product: CompareSlot;
  variant?: "icon" | "full";
  className?: string;
}

export default function AddToCompareButton({
  product,
  variant = "icon",
  className,
}: AddToCompareButtonProps) {
  const { t } = useTranslation();
  const { addToCompare, removeFromCompare, isInCompare, isFull } =
    useCompareStore();
  const inCompare = isInCompare(product.id);
  const addLabel = t("productCard.addToCompare");
  const removeLabel = t("productCard.removeFromCompare");
  const fullLabel = t("productCard.compareFull");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={inCompare ? removeLabel : addLabel}
        aria-pressed={inCompare}
        onClick={handleClick}
        disabled={!inCompare && isFull}
        title={inCompare ? removeLabel : isFull ? fullLabel : addLabel}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[4px] border shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40",
          inCompare
            ? "border-black bg-black text-white"
            : isFull
              ? "cursor-not-allowed border-black/10 bg-white text-black/25"
              : "border-black/10 bg-white text-black hover:border-black",
          className,
        )}
      >
        {inCompare ? <FiCheck size={14} /> : <MdOutlineCompareArrows size={16} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={inCompare ? removeLabel : addLabel}
      aria-pressed={inCompare}
      onClick={handleClick}
      disabled={!inCompare && isFull}
      className={cn(
        "inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40",
        inCompare
          ? "border-black bg-black/[0.03] text-black hover:bg-black/[0.06]"
          : isFull
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : "border-gray-200 bg-white text-gray-600 hover:border-black hover:text-black",
        className,
      )}
    >
      {inCompare ? (
        <>
          <FiCheck size={15} className="text-black" />
          {removeLabel}
          <FiX size={13} className="ml-0.5 text-gray-400" />
        </>
      ) : (
        <>
          <MdOutlineCompareArrows size={16} />
          {isFull ? fullLabel : addLabel}
        </>
      )}
    </button>
  );
}
