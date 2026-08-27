"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowRight, FiGitCommit, FiShoppingBag, FiX } from "react-icons/fi";
import Image from "next/image";
import { cn, toPublicUrl } from "@/lib/utils";
import { useCompareStore } from "@/hooks/useCompareStore";
import { useTranslation } from "@/hooks/useTranslation";
import { shouldHideBottomNav } from "@/lib/routeMatchers";

const MOTION = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function CompareFloatingBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { slots, removeFromCompare, clearCompare } = useCompareStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasAny = slots[0] !== null || slots[1] !== null;
  const liftForNav = !shouldHideBottomNav(pathname);

  if (!mounted || !hasAny) return null;

  const filledSlots = slots.filter(Boolean);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed z-50",
        "bottom-3 left-1/2 w-[calc(100vw-1.5rem)] max-w-[760px] -translate-x-1/2",
        "max-[500px]:left-2 max-[500px]:right-16 max-[500px]:w-auto max-[500px]:max-w-none max-[500px]:translate-x-0",
        liftForNav &&
          "max-[500px]:bottom-[calc(3.8125rem+0.5rem+env(safe-area-inset-bottom))]",
        "flex items-center gap-2.5 rounded-2xl border border-black/8 bg-white/95 px-2.5 py-2 shadow-[0_8px_28px_rgba(20,16,12,0.14)] backdrop-blur-md",
        "min-[501px]:gap-3 min-[501px]:px-3.5 min-[501px]:py-2.5",
        "transition-[bottom,transform,opacity]",
        MOTION,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 min-[501px]:gap-3">
        <div className="flex items-center gap-1.5 min-[501px]:gap-2">
          {([0, 1] as const).map((i) => {
            const slot = slots[i];
            const img = slot
              ? toPublicUrl(slot.images?.[0]?.path ?? slot.thumbnail)
              : null;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border",
                  "min-[501px]:h-11 min-[501px]:w-11",
                  slot
                    ? "border-black/10 bg-[#F7F4EE]"
                    : "border-dashed border-black/15 bg-[#FAF8F5]",
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
                        sizes="44px"
                      />
                    ) : (
                      <FiShoppingBag className="h-4 w-4 text-black/25" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${slot.name}`}
                      onClick={() => removeFromCompare(slot.id)}
                      className="absolute top-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#191919] text-white transition-colors hover:bg-black"
                    >
                      <FiX size={8} />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-semibold text-black/30">
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold tracking-tight text-[#191919] min-[501px]:text-[13px]">
            {filledSlots.length === 2
              ? t("compareBar.twoSelected")
              : t("compareBar.oneSelected")}
          </p>
          <p className="hidden truncate text-[11px] text-[#5F5F5F] min-[360px]:block">
            {filledSlots.map((s) => s!.name).join(" vs ")}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => router.push("/compare")}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#191919] px-3 text-[12px] font-semibold text-white",
            "transition-colors hover:bg-black",
            "min-[501px]:h-10 min-[501px]:px-4",
          )}
        >
          <FiGitCommit className="h-3.5 w-3.5" />
          <span>{t("compareBar.compare")}</span>
          <FiArrowRight className="hidden h-3 w-3 min-[501px]:block" />
        </button>

        <button
          type="button"
          aria-label={t("compareBar.clearCompare")}
          onClick={clearCompare}
          className="grid h-9 w-9 place-items-center rounded-lg border border-black/8 text-[#5F5F5F] transition-colors hover:bg-[#FAF8F5] hover:text-[#191919] min-[501px]:h-10 min-[501px]:w-10"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
