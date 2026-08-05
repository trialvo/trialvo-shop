"use client";

import * as React from "react";
import { FiCheck, FiGitCommit, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useCompareStore } from "@/hooks/useCompareStore";
import type { CompareSlot } from "@/hooks/useCompareStore";

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
  const { addToCompare, removeFromCompare, isInCompare, isFull } =
    useCompareStore();
  const inCompare = isInCompare(product.id);

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
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
        onClick={handleClick}
        disabled={!inCompare && isFull}
        title={
          inCompare
            ? "Remove from compare"
            : isFull
              ? "Compare slots full — remove one first"
              : "Add to compare"
        }
        className={cn(
          "flex h-8 w-8 items-center justify-center border transition-all duration-200",
          inCompare
            ? "border-black bg-black text-white"
            : isFull
              ? "cursor-not-allowed border-gray-200 bg-white/70 text-gray-300"
              : "border-gray-200 bg-white/80 text-gray-500 hover:border-black hover:bg-black hover:text-white",
          className,
        )}
      >
        {inCompare ? <FiCheck size={13} /> : <FiGitCommit size={13} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inCompare && isFull}
      className={cn(
        "inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
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
          Added to Compare
          <FiX size={13} className="ml-0.5 text-gray-400" />
        </>
      ) : (
        <>
          <FiGitCommit size={15} />
          {isFull ? "Compare Full" : "Add to Compare"}
        </>
      )}
    </button>
  );
}
