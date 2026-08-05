"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiGitCommit, FiShoppingBag, FiX } from "react-icons/fi";
import Image from "next/image";
import { cn, toPublicUrl } from "@/lib/utils";
import { useCompareStore } from "@/hooks/useCompareStore";

export default function CompareFloatingBar() {
  const router = useRouter();
  const { slots, removeFromCompare, clearCompare } = useCompareStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasAny = slots[0] !== null || slots[1] !== null;

  if (!mounted || !hasAny) return null;

  const filledSlots = slots.filter(Boolean);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-3 left-1/2 z-50 w-[calc(100vw-1rem)] max-w-[760px] -translate-x-1/2",
        "flex flex-wrap items-center gap-2 border border-black/[0.08] bg-white px-3 py-3 sm:flex-nowrap sm:gap-3 sm:px-4",
        "shadow-[0px_0px_10px_rgba(0,0,0,0.12)]",
        "transition-all duration-300 ease-out",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          {([0, 1] as const).map((i) => {
            const slot = slots[i];
            const img = slot
              ? toPublicUrl(slot.images?.[0]?.path ?? slot.thumbnail)
              : null;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border transition sm:h-12 sm:w-12",
                  slot
                    ? "border-black/20 bg-gray-50"
                    : "border-dashed border-gray-300 bg-gray-50",
                )}
              >
                {slot ? (
                  <>
                    {img ? (
                      <Image
                        src={img}
                        alt={slot.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    ) : (
                      <FiShoppingBag className="h-5 w-5 text-gray-300" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${slot.name}`}
                      onClick={() => removeFromCompare(slot.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white shadow transition hover:bg-red-600"
                    >
                      <FiX size={9} />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-gray-400">
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-black">
            {filledSlots.length === 2
              ? "2 products to compare"
              : "1 product selected"}
          </p>
          <p className="max-w-[180px] truncate text-[10px] text-gray-500 sm:max-w-[240px]">
            {filledSlots.map((s) => s!.name).join(" vs ")}
          </p>
        </div>
      </div>

      <div className="ml-auto flex w-full items-center gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/compare")}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 bg-black px-4 text-xs font-bold text-white transition hover:bg-black/80 sm:h-10 sm:flex-none"
        >
          <FiGitCommit size={13} />
          Compare
          <FiArrowRight size={12} />
        </button>

        <button
          type="button"
          aria-label="Clear compare"
          onClick={clearCompare}
          className="flex h-10 items-center justify-center border border-black/[0.08] px-3 text-xs font-semibold text-gray-500 transition hover:bg-black hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
