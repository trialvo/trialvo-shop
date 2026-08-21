"use client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React, { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
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
        const nav = swiper.params.navigation;
        if (nav && typeof nav !== "boolean") {
            nav.prevEl = prevRef.current;
            nav.nextEl = nextRef.current;
            swiper.navigation.destroy();
            swiper.navigation.init();
            swiper.navigation.update();
        }

        const pagination = swiper.params.pagination;
        if (pagination && typeof pagination !== "boolean") {
            pagination.el = paginationRef.current;
            swiper.pagination.destroy();
            swiper.pagination.init();
            swiper.pagination.render();
            swiper.pagination.update();
        }
    }, []);

    React.useEffect(() => {
        if (!swiperRef.current || !showNavUi) return;
        bindControls(swiperRef.current);
    }, [bindControls, showNavUi, safeSlides.length]);

    return (
        <section className="relative w-full overflow-x-clip bg-background">
            <div className={[
                "relative w-full overflow-hidden",
                "h-[24dvh] min-h-38 max-h-[560px]",
                "sm:h-[34vw] sm:min-h-[320px]",
                "lg:h-[30vw] lg:min-h-[520px] lg:max-h-[640px]",
            ].join(" ")}>
                {showLoader ? (
                    <div className="absolute inset-0 z-30">
                        <div className="relative h-full w-full overflow-hidden bg-muted">
                            <Skeleton className="h-full w-full rounded-none" />
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-linear-to-r from-transparent via-black/5 to-transparent" />
                            </div>
                        </div>
                    </div>
                ) : null}

                <Swiper
                    key={showLoader ? "hero-loading" : `hero-${safeSlides.map((s) => s.id).join("-")}`}
                    modules={[Navigation, Pagination, Autoplay]}
                    slidesPerView={1}
                    loop={safeSlides.length > 1}
                    speed={650}
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
                                    className="relative h-full w-full cursor-pointer overflow-hidden bg-foreground"
                                >
                                    <ImageWithFallback
                                        src={bg}
                                        alt={slide?.cta?.label ?? "Hero banner"}
                                        fill
                                        sizes="100vw"
                                        priority={idx === 0}
                                        className="hero-slide-image object-cover object-center"
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
                        "absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-all duration-200 hover:opacity-80 min-[768px]:left-5 min-[768px]:h-11 min-[768px]:w-11 min-[1200px]:left-8",
                        showNavUi ? "pointer-events-auto cursor-pointer opacity-100" : "pointer-events-none opacity-0",
                    ].join(" ")}
                >
                    <FiChevronLeft className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                    ref={nextRef}
                    type="button"
                    aria-label="Next slide"
                    aria-hidden={!showNavUi}
                    tabIndex={showNavUi ? 0 : -1}
                    className={[
                        "absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-all duration-200 hover:opacity-80 min-[768px]:right-5 min-[768px]:h-11 min-[768px]:w-11 min-[1200px]:right-8",
                        showNavUi ? "pointer-events-auto cursor-pointer opacity-100" : "pointer-events-none opacity-0",
                    ].join(" ")}
                >
                    <FiChevronRight className="h-5 w-5" strokeWidth={2} />
                </button>
                <div
                    className={[
                        "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/35 via-black/5 to-transparent pt-16 transition-opacity duration-200",
                        showNavUi ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                >
                    <div
                        ref={paginationRef}
                        className="pointer-events-auto flex items-center justify-center pb-4 min-[768px]:pb-5"
                    />
                </div>
            </div>

            <style jsx global>{`
        .hero-swiper .swiper-slide-active .hero-slide-image {
          animation: hero-kenburns 6.5s ease-out forwards;
        }

        @keyframes hero-kenburns {
          from {
            transform: scale(1.04);
          }
          to {
            transform: scale(1);
          }
        }

        .hero-bullet {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          display: inline-block;
          margin: 0 4px;
          background: color-mix(in oklab, var(--primary-foreground) 45%, transparent);
          border: 0;
          cursor: pointer;
          transition: transform 200ms ease, background 200ms ease, width 200ms ease;
        }
        .hero-bullet-active {
          width: 22px;
          border-radius: 9999px;
          background: var(--primary-foreground);
          box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 35%, transparent);
          transform: none;
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
