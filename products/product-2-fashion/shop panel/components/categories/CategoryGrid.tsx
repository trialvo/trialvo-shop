"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useTranslation } from "@/hooks/useTranslation";
import type { ChildCategory } from "@/lib/api/category/service";
import { cn, getLocalName, toPublicUrl } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";
import React from "react";
import { CiImageOff } from "react-icons/ci";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export type CategoryGridProps = {
  items: ChildCategory[];
  isLoading: boolean;
  total?: number;
  /** Maximum number of items to display (default: 12) */
  maxItems?: number;
};

const MAX_ITEMS = 12;
const SHOP_ALL_HREF = "/category/all";
const ACCENT = "#E85D04";

const CARD_WIDTH =
  "w-[46%] min-w-[46%] shrink-0 min-[576px]:w-[32%] min-[576px]:min-w-[32%] min-[768px]:w-[24%] min-[768px]:min-w-[24%] min-[992px]:w-[19%] min-[992px]:min-w-[19%] min-[1200px]:w-[16.5%] min-[1200px]:min-w-[16.5%]";

function splitCategoryName(name: string): { lead: string; rest: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { lead: name, rest: "" };
  return { lead: parts[0] ?? name, rest: parts.slice(1).join(" ") };
}

export default function CategoryGrid({
  items,
  isLoading,
  total,
  maxItems = MAX_ITEMS,
}: CategoryGridProps) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const safeItems = React.useMemo(
    () => (Array.isArray(items) ? items : []),
    [items],
  );

  const data = React.useMemo(
    () => safeItems.slice(0, maxItems),
    [safeItems, maxItems],
  );

  const remaining = Math.max(0, (total ?? safeItems.length) - data.length);

  const updateScrollState = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [data.length, isLoading, remaining, updateScrollState]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-category-card]");
    const step = card ? card.offsetWidth + 8 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!isLoading && data.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#191919]">
            {t("home.topCategories.eyebrow")}
          </p>
          <h2 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[576px]:text-[30px] min-[768px]:text-[34px]">
            {t("home.topCategories.title")}
          </h2>
        </div>
        <Link
          href={SHOP_ALL_HREF}
          className="shrink-0 pb-0.5 text-[13px] font-medium underline underline-offset-[3px] transition-opacity hover:opacity-70"
          style={{ color: ACCENT }}
        >
          {t("home.topCategories.shopAll")}
        </Link>
      </div>

      <div className="relative mt-6 min-[768px]:mt-8">
        {canPrev ? (
          <button
            type="button"
            aria-label="Previous categories"
            onClick={() => scrollByCard(-1)}
            className="absolute left-0 top-[36%] z-10 grid h-10 w-10 -translate-x-1/2 cursor-pointer place-items-center rounded-full text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] min-[992px]:h-11 min-[992px]:w-11"
            style={{ backgroundColor: ACCENT }}
          >
            <FiChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            aria-label="Next categories"
            onClick={() => scrollByCard(1)}
            className="absolute right-0 top-[36%] z-10 grid h-10 w-10 translate-x-1/2 cursor-pointer place-items-center rounded-full text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] min-[992px]:h-11 min-[992px]:w-11"
            style={{ backgroundColor: ACCENT }}
          >
            <FiChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          className="flex gap-1.5 overflow-x-auto scroll-smooth pb-1 min-[576px]:gap-2"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={`sk-${i}`} className={CARD_WIDTH}>
                  <div className="aspect-[2/3] w-full animate-pulse bg-[#e8e2d8]" />
                  <div className="mx-auto mt-3 h-3 w-16 animate-pulse bg-[#e8e2d8]" />
                  <div className="mx-auto mt-2 h-3 w-24 animate-pulse bg-[#e8e2d8]" />
                </div>
              ))
            : data.map((item) => {
                const displayName = getLocalName(item.name, item.name_bd, language);
                const { lead, rest } = splitCategoryName(displayName);
                const src =
                  typeof item?.img_path === "string" && item.img_path.trim().length > 0
                    ? toPublicUrl(item.img_path)
                    : undefined;
                const href = `/category/${encodeURIComponent(item?.name ?? "")}?childId=${item?.id}`;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    data-category-card
                    className={cn("group", CARD_WIDTH)}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#ebe6de]">
                      {src ? (
                        <ImageWithFallback
                          src={src}
                          alt={displayName}
                          fill
                          sizes="(max-width: 768px) 46vw, (max-width: 1200px) 24vw, 17vw"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                          preload={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <CiImageOff className="h-7 w-7 text-black/25" />
                        </div>
                      )}
                      {item.featured ? (
                        <div className="absolute inset-x-0 bottom-0 bg-black/30 px-2 py-1.5">
                          <span className="block text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                            Exclusive
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2.5 px-1 text-center">
                      <p className="truncate text-[12px] font-bold uppercase tracking-[0.04em] text-[#191919]">
                        {lead}
                      </p>
                      {rest ? (
                        <p className="mt-0.5 truncate text-[13px] font-normal text-[#191919]">
                          {rest}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}

          {!isLoading && remaining > 0 ? (
            <Link
              href={SHOP_ALL_HREF}
              data-category-card
              className={cn("group", CARD_WIDTH)}
            >
              <div
                className="relative flex aspect-[2/3] w-full flex-col items-center justify-center overflow-hidden px-4 text-center"
                style={{
                  background:
                    "linear-gradient(115deg, #3d7ec4 0%, #6a8fd4 28%, #e07a3a 68%, #e85d04 100%)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.35) 0.6px, transparent 0.7px)",
                    backgroundSize: "3px 3px",
                  }}
                />
                <p className="relative text-[22px] font-semibold leading-tight text-white min-[768px]:text-[24px]">
                  {remaining} {t("home.topCategories.moreItems")}
                </p>
                <span className="relative mt-3 text-[13px] font-medium text-white underline underline-offset-[3px]">
                  {t("home.topCategories.shopAll")}
                </span>
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
