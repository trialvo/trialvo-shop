"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductListItem } from "@/lib/api/product/service";
import { cn, getLocalName, toPublicUrl } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import Link from "next/link";
import React from "react";
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";

export type HomeProductCarouselProps = {
  eyebrow: string;
  title: string;
  shopAllHref: string;
  products: ProductListItem[];
  isLoading?: boolean;
};

const CARD_WIDTH =
  "w-[46%] min-w-[46%] shrink-0 min-[576px]:w-[32%] min-[576px]:min-w-[32%] min-[768px]:w-[24%] min-[768px]:min-w-[24%] min-[992px]:w-[19%] min-[992px]:min-w-[19%] min-[1200px]:w-[16.5%] min-[1200px]:min-w-[16.5%]";

function splitName(name: string): { lead: string; rest: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { lead: name, rest: "" };
  return { lead: parts[0] ?? name, rest: parts.slice(1).join(" ") };
}

function productImage(product: ProductListItem): string | undefined {
  const raw =
    (typeof product.thumbnail === "string" && product.thumbnail.trim()
      ? product.thumbnail
      : null) ??
    (Array.isArray(product.images) && product.images[0]?.path
      ? product.images[0].path
      : null);
  return raw ? (toPublicUrl(raw) ?? raw) : undefined;
}

function productPrices(product: ProductListItem): { price: number; oldPrice?: number } {
  const discounted = product.variations?.filter((v) => v?.has_discount) ?? [];
  const fallback = product.variations?.[0];
  const hasDiscount = discounted.length > 0;
  const price =
    (hasDiscount ? discounted[0]?.final_price : fallback?.final_price) ??
    product.price_range?.min ??
    0;
  const oldPrice = hasDiscount
    ? discounted[0]?.selling_price
    : fallback?.selling_price;
  return { price, oldPrice };
}

function formatMoney(n: number): string {
  return `BDT ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HomeProductCarousel({
  eyebrow,
  title,
  shopAllHref,
  products,
  isLoading = false,
}: HomeProductCarouselProps) {
  const { t, language } = useTranslation();
  const dispatch = useAppDispatch();
  const handleFavoriteClick = useHandleFavoriteClick();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const list = React.useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  );

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
  }, [list.length, isLoading, updateScrollState]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-product-rail-card]");
    const step = card ? card.offsetWidth + 8 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const openQuickAdd = (id: number) => {
    dispatch(openModal({ key: "quickAdd", payload: { id } }));
  };

  if (!isLoading && list.length === 0) return null;

  return (
    <section className="w-full bg-background">
      <div className="container mx-auto">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#191919]">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[576px]:text-[30px] min-[768px]:text-[34px]">
              {title}
            </h2>
          </div>
          <Link
            href={shopAllHref}
            className="shrink-0 pb-0.5 text-[13px] font-medium text-primary underline underline-offset-[3px] transition-opacity hover:opacity-70"
          >
            {t("home.productRails.shopAll")}
          </Link>
        </div>

        <div className="relative mt-6 min-[768px]:mt-8">
          {canPrev ? (
            <button
              type="button"
              aria-label="Previous products"
              onClick={() => scrollByCard(-1)}
              className="absolute left-0 top-[36%] z-10 grid h-10 w-10 -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,0,0,0.16)] min-[992px]:h-11 min-[992px]:w-11"
            >
              <FiChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : null}
          {canNext ? (
            <button
              type="button"
              aria-label="Next products"
              onClick={() => scrollByCard(1)}
              className="absolute right-0 top-[36%] z-10 grid h-10 w-10 translate-x-1/2 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,0,0,0.16)] min-[992px]:h-11 min-[992px]:w-11"
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
                    <div className="aspect-[2/3] w-full animate-pulse bg-muted" />
                    <div className="mx-auto mt-3 h-3 w-16 animate-pulse bg-muted" />
                    <div className="mx-auto mt-2 h-3 w-24 animate-pulse bg-muted" />
                    <div className="mx-auto mt-2 h-3 w-14 animate-pulse bg-muted" />
                  </div>
                ))
              : list.map((product) => {
                  const displayName = getLocalName(
                    product.name,
                    product.name_bd,
                    language,
                  );
                  const { lead, rest } = splitName(displayName);
                  const img = productImage(product);
                  const { price, oldPrice } = productPrices(product);
                  const href = `/products/${encodeURIComponent(product.slug || "product")}/${product.id}/`;

                  return (
                    <Link
                      key={product.id}
                      href={href}
                      data-product-rail-card
                      className={cn("group", CARD_WIDTH)}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                        {img ? (
                          <ImageWithFallback
                            src={img}
                            alt={displayName}
                            fill
                            sizes="(max-width: 768px) 46vw, (max-width: 1200px) 24vw, 17vw"
                            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                            preload={false}
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}

                        {/* Wishlist — previous style */}
                        <button
                          type="button"
                          aria-label={t("productCard.addToWishlist")}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFavoriteClick({
                              id: product.id,
                              is_favourite: product.is_favourite,
                            });
                          }}
                          className={cn(
                            "absolute right-2 z-20 grid h-8 w-8 place-items-center text-white drop-shadow transition-all duration-300 hover:scale-110",
                            "bottom-12 min-[768px]:bottom-2 min-[768px]:group-hover:bottom-12",
                          )}
                        >
                          <FiHeart
                            className={cn(
                              "h-4 w-4",
                              product.is_favourite && "fill-white",
                            )}
                            strokeWidth={1.5}
                          />
                        </button>

                        {/* Quick Add */}
                        <div
                          className={cn(
                            "absolute inset-x-0 bottom-0 z-10",
                            "translate-y-0 opacity-100",
                            "min-[768px]:translate-y-full min-[768px]:opacity-0",
                            "min-[768px]:transition-all min-[768px]:duration-250 min-[768px]:ease-out",
                            "min-[768px]:group-hover:translate-y-0 min-[768px]:group-hover:opacity-100",
                          )}
                        >
                          <button
                            type="button"
                            aria-label={t("productCard.quickAdd")}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openQuickAdd(product.id);
                            }}
                            className="flex h-10 w-full items-center justify-center bg-white text-[12px] font-medium text-black hover:bg-[#F7F7F7]"
                          >
                            {t("productCard.quickAdd")}
                          </button>
                        </div>
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
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <span className="text-[12px] font-bold text-[#191919]">
                            {formatMoney(price)}
                          </span>
                          {typeof oldPrice === "number" && oldPrice > price ? (
                            <span className="text-[11px] text-[#767676] line-through">
                              {formatMoney(oldPrice)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}
