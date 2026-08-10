"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowRight, ChevronLeft, ChevronRight,
  ShieldCheck, Truck, Star, Sparkles, ShoppingBag, Gift, Pause, Play,
} from "lucide-react";
import { useSliders, toSlide } from "@/api/sliders";
import { getImageUrl } from "@/lib/imageUrl";

const AUTO_PLAY_MS = 5000;

/* ─── Fallback slide ─────────────────────────────────── */
const FALLBACK_SLIDES = [
  {
    id: 0,
    badge: "FEATURED", badgeColor: "from-pink-500 to-rose-600",
    title: "আমাদের", subtitle: "", highlight: "সেরা পণ্য",
    description: "সেরা মানের পণ্য, সেরা দামে। এখনই অর্ডার করুন।",
    price: "", originalPrice: "", discount: "",
    rating: 4.8, reviews: 0, category: "",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
    freeDelivery: true, authentic: true,
    accentFrom: "#e91e63", accentTo: "#ff4081",
    bgFrom: "#0f172a", bgVia: "#1a1035", bgTo: "#1e0a2e",
    link: "/products",
    ctaText: "এখনই কিনুন", ctaSecondary: "সব পণ্য দেখুন",
    buttonStyle: "gradient" as const,
  },
];

/* ─── Loading skeleton ───────────────────────────────── */
function BannerSkeleton() {
  return (
    <section className="relative overflow-hidden bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#e91e63]" />
            <p className="text-xs text-white/30">লোড হচ্ছে...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Auto-play progress bar ─────────────────────────── */
function ProgressBar({ active, paused, accentFrom, accentTo }: {
  active: boolean; paused: boolean; accentFrom: string; accentTo: string;
}) {
  return (
    <div className="h-0.5 w-full overflow-hidden bg-white/10">
      {active && (
        <div
          key={`${active}-${paused}`}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
            width: paused ? undefined : "100%",
            transition: paused ? "none" : `width ${AUTO_PLAY_MS}ms linear`,
            // restart animation by re-mounting via key change
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}
    </div>
  );
}

/* ─── CTA Button ─────────────────────────────────────── */
function CtaButton({
  href, label, accentFrom, accentTo, style, secondary,
}: {
  href: string; label: string; accentFrom: string; accentTo: string;
  style: string; secondary?: boolean;
}) {
  if (secondary) {
    return (
      <a
        href={href}
        className="rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/5"
      >
        {label}
      </a>
    );
  }

  const bgStyle =
    style === "gradient"
      ? { background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, boxShadow: `0 8px 24px ${accentFrom}30` }
      : style === "solid"
        ? { background: accentFrom, boxShadow: `0 8px 20px ${accentFrom}28` }
        : { border: `1.5px solid ${accentFrom}`, color: accentFrom };

  return (
    <a
      href={href}
      className="group flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      style={bgStyle}
    >
      <ShoppingBag className="h-4 w-4" />
      {label}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </a>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export default function HeroBanner() {
  const { data, isLoading } = useSliders();

  const slides =
    data?.sliders && data.sliders.length > 0
      ? data.sliders.map(toSlide)
      : FALLBACK_SLIDES;

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0); // forces bar restart

  // Touch/swipe refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => { setCurrent(0); }, [slides.length]);

  const goTo = useCallback(
    (index: number, dir?: "left" | "right") => {
      if (isAnimating) return;
      setDirection(dir ?? (index > current ? "right" : "left"));
      setIsAnimating(true);
      setCurrent(index);
      setProgressKey(k => k + 1); // restart progress bar
      setTimeout(() => setIsAnimating(false), 600);
    },
    [isAnimating, current],
  );

  const next = useCallback(() => goTo((current + 1) % slides.length, "right"), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length, "left"), [current, goTo, slides.length]);

  /* Auto-play */
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [next, isPaused, slides.length]);

  /* Touch swipe */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current ?? 0));
    // Only horizontal swipes (dx > 40, dy < 60)
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) next(); else prev();
    }
    touchStartX.current = null;
  };

  if (isLoading) return <BannerSkeleton />;

  const slide = slides[Math.min(current, slides.length - 1)];

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background */}
      <div
        className="transition-all duration-700 ease-out"
        style={{ background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgVia} 50%, ${slide.bgTo} 100%)` }}
      >
        {/* Decorative */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[120px] transition-colors duration-700"
            style={{ background: `${slide.accentFrom}12` }}
          />
          <div
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-[100px] transition-colors duration-700"
            style={{ background: `${slide.accentTo}10` }}
          />
          <div className="animate-pulse-soft absolute top-1/4 right-1/4 h-1.5 w-1.5 rounded-full bg-white/20" />
          <div className="animate-float absolute bottom-1/3 left-1/5 h-1 w-1 rounded-full bg-white/15" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[520px] grid-cols-1 items-center gap-8 py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">

            {/* ── Left: Content ── */}
            <div
              key={`content-${slide.id}`}
              className={`text-center lg:text-left ${direction === "right" ? "animate-slide-content-right" : "animate-slide-content-left"}`}
            >
              {/* Subtitle */}
              {slide.subtitle && (
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {slide.subtitle}
                </p>
              )}

              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${slide.badgeColor} px-3.5 py-1 text-[10px] font-bold tracking-wider text-white shadow-lg`}>
                  <Sparkles className="h-3 w-3" />
                  {slide.badge}
                </span>
                {slide.category && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium text-white/60 backdrop-blur-sm">
                    {slide.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-4 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                {slide.title}
                {slide.highlight && (
                  <>
                    <br />
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}
                    >
                      {slide.highlight}
                    </span>
                  </>
                )}
              </h1>

              {/* Description */}
              <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base lg:max-w-lg">
                {slide.description}
              </p>

              {/* Price row */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                {slide.price && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white sm:text-3xl">{slide.price}</span>
                    {slide.originalPrice && (
                      <span className="text-sm text-slate-500 line-through">{slide.originalPrice}</span>
                    )}
                  </div>
                )}
                {slide.discount && (
                  <span className="rounded-lg bg-green-500/20 px-2.5 py-1 text-xs font-bold text-green-400">
                    {slide.discount}
                  </span>
                )}
                {slide.reviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-white/80">{slide.rating}</span>
                    <span className="text-xs text-slate-500">({slide.reviews})</span>
                  </div>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <CtaButton
                  href={slide.link}
                  label={slide.ctaText}
                  accentFrom={slide.accentFrom}
                  accentTo={slide.accentTo}
                  style={slide.buttonStyle}
                />
                {slide.ctaSecondary && (
                  <CtaButton
                    href="/products"
                    label={slide.ctaSecondary}
                    accentFrom={slide.accentFrom}
                    accentTo={slide.accentTo}
                    style="outline"
                    secondary
                  />
                )}
              </div>
            </div>

            {/* ── Right: Product card ── */}
            <div className="relative hidden lg:flex lg:items-center lg:justify-center">
              <div
                key={`card-${slide.id}`}
                className={`relative z-10 ${direction === "right" ? "animate-slide-card-right" : "animate-slide-card-left"}`}
              >
                <div className="relative mx-auto w-80 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-8 backdrop-blur-xl">
                  <div
                    className="absolute -inset-4 -z-10 rounded-3xl opacity-15 blur-3xl"
                    style={{ background: `radial-gradient(circle, ${slide.accentFrom}40, transparent 70%)` }}
                  />

                  {/* Top row */}
                  <div className="mb-6 flex items-center justify-between">
                    <span className={`rounded-full bg-gradient-to-r ${slide.badgeColor} px-3 py-1 text-[10px] font-bold text-white`}>
                      {slide.badge}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-white/80">{slide.rating}</span>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="group relative mb-6 flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent">
                    <div
                      className="absolute h-40 w-40 rounded-full opacity-15 blur-2xl"
                      style={{ background: `radial-gradient(circle, ${slide.accentFrom}, transparent)` }}
                    />
                    <img
                      src={getImageUrl(slide.image)}
                      alt={`${slide.title} ${slide.highlight}`}
                      className="relative h-full w-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Info */}
                  <h3 className="mb-1 text-base font-semibold text-white">{slide.title} {slide.highlight}</h3>
                  {slide.category && <p className="mb-4 text-xs text-slate-400">{slide.category}</p>}

                  {/* Price bar */}
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white">{slide.price || "অর্ডার করুন"}</span>
                      {slide.originalPrice && (
                        <span className="text-xs text-slate-500 line-through">{slide.originalPrice}</span>
                      )}
                    </div>
                    <a
                      href={slide.link}
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}
                    >
                      <ArrowRight className="h-4 w-4 text-white" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Floating mini-cards */}
              {slide.freeDelivery && (
                <div className="animate-float absolute top-8 -left-4 z-20 rounded-xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                      <Truck className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-white">ফ্রি ডেলিভারি</p>
                      <p className="text-[9px] text-slate-400">সব অর্ডারে</p>
                    </div>
                  </div>
                </div>
              )}
              {slide.authentic && (
                <div
                  className="animate-float absolute -right-2 bottom-12 z-20 rounded-xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-md"
                  style={{ animationDelay: "1s" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
                      <ShieldCheck className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-white">১০০% অরিজিনাল</p>
                      <p className="text-[9px] text-slate-400">গ্যারান্টিড</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Navigation bar ── */}
          <div className="relative z-20 flex items-center justify-between pb-6">
            {/* Dots + counter */}
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className={`relative h-2 rounded-full transition-all duration-400 ${i === current ? "w-8" : "w-2 bg-white/20 hover:bg-white/40"}`}
                  aria-label={`Slide ${i + 1}`}
                >
                  {i === current && (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})` }}
                    />
                  )}
                </button>
              ))}
              <span className="ml-3 text-xs text-slate-500">
                {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>

            {/* Prev / Next + Pause indicator */}
            <div className="flex items-center gap-2">
              {slides.length > 1 && (
                <button
                  onClick={() => setIsPaused(p => !p)}
                  title={isPaused ? "Resume" : "Pause"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-all hover:text-white/80"
                >
                  {isPaused
                    ? <Play className="h-3.5 w-3.5" />
                    : <Pause className="h-3.5 w-3.5" />
                  }
                </button>
              )}
              <button
                onClick={prev}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Auto-play progress bar ── */}
        {slides.length > 1 && (
          <ProgressBar
            key={progressKey}
            active={!isPaused}
            paused={isPaused}
            accentFrom={slide.accentFrom}
            accentTo={slide.accentTo}
          />
        )}

        {/* ── Trust strip ── */}
        <div className="border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
            {slide.freeDelivery && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-500" /><span>ফ্রি ডেলিভারি</span>
              </div>
            )}
            {slide.authentic && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" /><span>১০০% অরিজিনাল</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-slate-500" /><span>গিফট র‍্যাপিং</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-slate-500" /><span>১০,০০০+ সন্তুষ্ট গ্রাহক</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
