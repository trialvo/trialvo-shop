"use client";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React, { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Skeleton } from "../ui/skeleton";

export type HeroSlide = {
    id: string;
    bg: string;
    cta: { label: string; href: string };
};

export type HeroSliderProps = {
    slides: HeroSlide[];
    autoplay?: boolean;
    autoplayDelay?: number;

    isLoading?: boolean;

    fallbackBg?: string;

    loaderCount?: number;
};

const DEFAULT_FALLBACK_BG = "/slider1.png";

const HeroSlider: React.FC<HeroSliderProps> = ({
    slides,
    autoplay = false,
    autoplayDelay = 4500,
    isLoading = false,
    fallbackBg = DEFAULT_FALLBACK_BG,
    loaderCount = 2,
}) => {
    const router = useRouter();
    const prevRef = useRef<HTMLButtonElement | null>(null);
    const nextRef = useRef<HTMLButtonElement | null>(null);
    const paginationRef = useRef<HTMLDivElement | null>(null);
    const swiperRef = useRef<SwiperType | null>(null);

    const safeSlides = React.useMemo<HeroSlide[]>(() => {
        const list = Array.isArray(slides) ? slides : [];
        return list.map((s) => ({
            ...s,
            bg: (s?.bg ?? "").trim() || fallbackBg,
            cta: {
                label: s?.cta?.label?.trim() ? s.cta.label : "Shop Now",
                href: s?.cta?.href?.trim() ? s.cta.href : "/",
            },
        }));
    }, [slides, fallbackBg]);

    const showLoader = isLoading && safeSlides.length === 0;
    const hasMultiple = safeSlides.length > 1;
    const showNavUi = hasMultiple && !showLoader;

    const bindControls = React.useCallback((swiper: SwiperType) => {
        // Swiper can fire onSwiper before params (or nav/pagination modules) exist.
        // Guard every hop so a half-initialized instance never crashes the home page.
        if (!swiper?.params) return;

        const nav = swiper.params?.navigation;
        if (
            nav &&
            typeof nav !== "boolean" &&
            prevRef.current &&
            nextRef.current &&
            swiper.navigation
        ) {
            nav.prevEl = prevRef.current;
            nav.nextEl = nextRef.current;
            try {
                swiper.navigation.destroy();
                swiper.navigation.init();
                swiper.navigation.update();
            } catch {
                // Half-initialized Navigation module — skip until the next bind.
            }
        }

        const pagination = swiper.params?.pagination;
        if (
            pagination &&
            typeof pagination !== "boolean" &&
            paginationRef.current &&
            swiper.pagination
        ) {
            pagination.el = paginationRef.current;
            try {
                swiper.pagination.destroy();
                swiper.pagination.init();
                swiper.pagination.render();
                swiper.pagination.update();
            } catch {
                // Half-initialized Pagination module — skip until the next bind.
            }
        }
    }, []);

    React.useEffect(() => {
        if (!swiperRef.current || !showNavUi) return;
        bindControls(swiperRef.current);
    }, [bindControls, showNavUi, safeSlides.length]);

    return (
        <section className="relative w-full overflow-x-clip bg-[#F7F4EE] px-3 pt-2 pb-3 min-[501px]:pt-3 min-[576px]:px-4 min-[576px]:py-3.5 min-[768px]:px-5 min-[768px]:py-4 min-[992px]:px-6 min-[1200px]:px-8 min-[1400px]:px-10">
            <div className={[
                "relative w-full overflow-hidden rounded-xl min-[768px]:rounded-2xl",
                "h-[200px] min-[576px]:h-[260px]",
                "min-[768px]:h-[340px] min-[992px]:h-[400px]",
                "min-[1200px]:h-[440px] min-[1400px]:h-[480px]",
            ].join(" ")}>
                {showLoader ? (
                    <div className="absolute inset-0 z-30">
                        <div className="relative h-full w-full overflow-hidden bg-[#F0EBE3]">
                            <Skeleton className="h-full w-full rounded-none bg-[#E8E2D8]" />
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-linear-to-r from-transparent via-black/5 to-transparent" />
                            </div>
                        </div>
                    </div>
                ) : null}

                <Swiper
                    key={showLoader ? "hero-loading" : `hero-${safeSlides.map((s) => s.id).join("-")}`}
                    modules={[EffectFade, Navigation, Pagination, Autoplay]}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    slidesPerView={1}
                    loop={safeSlides.length > 1}
                    speed={700}
                    autoplay={
                        autoplay && safeSlides.length > 1
                            ? { delay: autoplayDelay, disableOnInteraction: false }
                            : undefined
                    }
                    onSwiper={(swiper: SwiperType) => {
                        swiperRef.current = swiper;
                        requestAnimationFrame(() => bindControls(swiper));
                    }}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    pagination={{
                        el: paginationRef.current,
                        clickable: true,
                        bulletClass: "hero-bullet",
                        bulletActiveClass: "hero-bullet-active",
                        renderBullet: (_index, className) => `<span class="${className}"></span>`,
                    }}
                    className="hero-swiper h-full w-full"
                >
                    {(safeSlides.length ? safeSlides : Array.from({ length: loaderCount })).map((s, idx) => {
                        const slide = (s as HeroSlide | undefined) ?? undefined;

                        const bg = slide?.bg ?? fallbackBg;
                        const href = slide?.cta?.href ?? "/";
                        const key = slide?.id ?? `loader-${idx}`;

                        return (
                            <SwiperSlide key={key} className="h-full w-full">
                                <div
                                    onClick={() => router.push(href)}
                                    className="relative h-full w-full cursor-pointer overflow-hidden bg-[#F7F4EE]"
                                >
                                    <ImageWithFallback
                                        src={bg}
                                        alt={slide?.cta?.label ?? "Hero banner"}
                                        fill
                                        sizes="100vw"
                                        priority={idx === 0}
                                        className="object-cover object-center"
                                    />
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                <button
                    ref={prevRef}
                    type="button"
                    aria-label="Previous slide"
                    aria-hidden={!showNavUi}
                    tabIndex={showNavUi ? 0 : -1}
                    className={[
                        "absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/80 text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.08)] backdrop-blur-[2px] transition-opacity duration-200 hover:bg-white min-[768px]:grid min-[768px]:left-5 min-[1200px]:left-8",
                        showNavUi ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                    ].join(" ")}
                >
                    <FiChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                    ref={nextRef}
                    type="button"
                    aria-label="Next slide"
                    aria-hidden={!showNavUi}
                    tabIndex={showNavUi ? 0 : -1}
                    className={[
                        "absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/80 text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.08)] backdrop-blur-[2px] transition-opacity duration-200 hover:bg-white min-[768px]:grid min-[768px]:right-5 min-[1200px]:right-8",
                        showNavUi ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                    ].join(" ")}
                >
                    <FiChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <div
                    className={[
                        "pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-3.5 transition-opacity duration-200 min-[768px]:pb-5",
                        showNavUi ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                >
                    <div
                        ref={paginationRef}
                        className="pointer-events-auto flex items-center justify-center"
                    />
                </div>
            </div>

            <style jsx global>{`
        .hero-bullet {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          display: inline-block;
          margin: 0 5px;
          background: rgba(255, 255, 255, 0.45);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
          border: 0;
          cursor: pointer;
          transition: background 200ms ease, transform 200ms ease;
        }
        .hero-bullet-active {
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
          transform: scale(1.05);
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
        </section>
    );
};

export default HeroSlider;
