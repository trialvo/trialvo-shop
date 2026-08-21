"use client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React, { useRef } from "react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";
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


    return (
        <section className="relative w-full overflow-x-clip">
            <div className={[
                "relative w-full",
                "h-[24dvh] min-h-38 max-h-[560px]",
                "sm:h-[34vw] sm:min-h-[320px]",
                "lg:h-[30vw] lg:min-h-[520px] lg:max-h-[640px]",
                showNavUi ? "pb-10" : "pb-0",
            ].join(" ")}>
                {showLoader ? (
                    <div className="absolute inset-0 z-30">
                        <div className="relative h-full w-full overflow-hidden bg-white">
                            <Skeleton className="h-full w-full rounded-none" />
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-linear-to-r from-transparent via-black/5 to-transparent" />
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="pointer-events-none absolute -bottom-1 left-0 right-0 z-20">
                    <div className="mx-auto flex w-full max-w-42.5 items-center justify-center gap-6 px-4 pb-1">
                        <button
                            ref={prevRef}
                            aria-label="Previous slide"
                            className="pointer-events-auto cursor-pointer inline-flex h-10 w-10 items-center justify-center text-black transition disabled:opacity-40"
                            disabled={safeSlides.length <= 1}
                        >
                            <span className="flex h-6 sm:h-8 w-6 sm:w-8 items-center justify-center rounded-full border border-transparent transition hover:border-[#636363]">
                                <GoChevronLeft />
                            </span>
                        </button>

                        <div ref={paginationRef} className="pointer-events-auto flex items-center justify-center" />

                        <button
                            ref={nextRef}
                            aria-label="Next slide"
                            className="pointer-events-auto cursor-pointer inline-flex h-10 w-10 items-center justify-center text-black transition disabled:opacity-40"
                            disabled={safeSlides.length <= 1}
                        >
                            <span className="flex h-6 sm:h-8 w-6 sm:w-8 items-center justify-center rounded-full border border-transparent transition hover:border-[#636363]">
                                <GoChevronRight />
                            </span>
                        </button>
                    </div>
                </div>

                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    slidesPerView={1}
                    loop={safeSlides.length > 1}
                    speed={650}
                    autoplay={
                        autoplay && safeSlides.length > 1
                            ? { delay: autoplayDelay, disableOnInteraction: false }
                            : undefined
                    }
                    onBeforeInit={(swiper: SwiperType) => {
                        // @ts-expect-error Swiper expects element refs
                        swiper.params.navigation.prevEl = prevRef.current;
                        // @ts-expect-error Swiper expects element refs
                        swiper.params.navigation.nextEl = nextRef.current;
                        // @ts-expect-error Swiper expects element refs
                        swiper.params.pagination.el = paginationRef.current;
                    }}
                    navigation
                    pagination={{
                        clickable: true,
                        bulletClass: "hero-bullet",
                        bulletActiveClass: "hero-bullet-active",
                        renderBullet: (_index, className) => `<span class="${className}"></span>`,
                    }}
                    className="h-full w-full"
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
                                    className="relative h-full w-full cursor-pointer overflow-hidden bg-black"
                                >
                                    <ImageWithFallback
                                        src={bg}
                                        alt={slide?.cta?.label ?? "Hero banner"}
                                        fill
                                        sizes="100vw"
                                        priority={idx === 0}
                                        className="object-cover object-center"
                                    />

                                    {/* <div className="absolute inset-0 bg-black/15" /> */}
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            <style jsx global>{`
        .hero-bullet {
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          display: inline-block;
          margin: 0 6px;
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 1);
          cursor: pointer;
          transition: transform 150ms ease, background 150ms ease,
            border-color 150ms ease;
        }
        .hero-bullet-active {
          background: rgba(0, 0, 0, 0.85);
          border-color: rgba(0, 0, 0, 0.85);
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
