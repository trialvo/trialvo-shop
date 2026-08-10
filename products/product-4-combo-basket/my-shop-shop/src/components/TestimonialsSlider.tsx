"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";
import { useAllReviews } from "@/api/reviews";
import type { Review } from "@/api/reviews";

// ─── Static fallback data ───────────────────────────────────────────────────
const STATIC_REVIEWS: Review[] = [
  {
    id: 1, user_id: 1, product_id: 1, rating: 5,
    title: "অসাধারণ পণ্য!",
    body: "প্রোডাক্টের কোয়ালিটি একদম অসাধারণ। আমার পুরো পরিবার ব্যবহার করছে। ডেলিভারি খুব দ্রুত এবং প্যাকেজিং ছিল একদম প্রফেশনাল।",
    created_at: "2026-01-15T10:00:00Z",
    user: { id: 1, name: "Rahima Khatun", avatar: null },
    product: { id: 1, name: "ব্রাইডাল গিফট সেট", slug: "bridal-gift-set" },
  },
  {
    id: 2, user_id: 2, product_id: 2, rating: 5,
    title: "দারুণ কম্বো অফার",
    body: "স্কিন কেয়ার কম্বো একদম পারফেক্ট। পণ্যগুলো ১০০% অরিজিনাল এবং দাম অনেক যুক্তিসঙ্গত। আবার অর্ডার করব ইনশাআল্লাহ!",
    created_at: "2026-01-20T12:00:00Z",
    user: { id: 2, name: "Karim Ahmed", avatar: null },
    product: { id: 2, name: "স্কিন কেয়ার কম্বো", slug: "skin-care-combo" },
  },
  {
    id: 3, user_id: 3, product_id: 3, rating: 5,
    title: "সেরা গিফট শপ",
    body: "আমার বন্ধুকে বার্থডে গিফট হিসেবে দিয়েছিলাম। গিফট র‍্যাপিং দেখে সে অবাক হয়ে গেছে! সার্ভিস একদম টপ নচ।",
    created_at: "2026-01-25T09:00:00Z",
    user: { id: 3, name: "Nusrat Jahan", avatar: null },
    product: { id: 3, name: "গিফট বক্স কালেকশন", slug: "gift-box" },
  },
  {
    id: 4, user_id: 4, product_id: 1, rating: 5,
    title: "প্রত্যাশার চেয়ে ভালো",
    body: "অনেক ভেবে অর্ডার করেছিলাম, কিন্তু পণ্য হাতে পেয়ে সব সন্দেহ দূর হয়ে গেছে। এক্সেলেন্ট কোয়ালিটি এবং দ্রুত ডেলিভারি।",
    created_at: "2026-02-01T14:00:00Z",
    user: { id: 4, name: "Nasrin Akter", avatar: null },
    product: { id: 1, name: "কম্বো হেয়ার কেয়ার", slug: "hair-care-combo" },
  },
  {
    id: 5, user_id: 5, product_id: 2, rating: 5,
    title: "বিশ্বস্ত শপ",
    body: "এখান থেকে ৩ বার অর্ডার করেছি, প্রতিবার একই মান এবং একই দ্রুত সার্ভিস। এই শপ নিয়ে কোনো অভিযোগ নেই।",
    created_at: "2026-02-10T11:00:00Z",
    user: { id: 5, name: "Rakib Hossain", avatar: null },
    product: { id: 2, name: "মেকআপ কিট", slug: "makeup-kit" },
  },
  {
    id: 6, user_id: 6, product_id: 3, rating: 4,
    title: "খুব ভালো সার্ভিস",
    body: "মায়ের জন্য ঈদ গিফট নিয়েছিলাম। উনি দেখে খুশি হয়ে গেছেন। পণ্যের মান ভালো। পরের বার আরো নেব।",
    created_at: "2026-02-15T16:00:00Z",
    user: { id: 6, name: "Sadia Islam", avatar: null },
    product: { id: 3, name: "ঈদ স্পেশাল গিফট বক্স", slug: "eid-gift-box" },
  },
];

// ─── Avatar Component ──────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = 48 }: { name: string; avatar?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Cycle through pleasant gradient pairs based on name char code
  const gradients = [
    "from-pink-400 to-rose-500",
    "from-violet-400 to-purple-500",
    "from-blue-400 to-indigo-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
  ];
  const gradient = gradients[(name.charCodeAt(0) || 0) % gradients.length];

  if (avatar) {
    return (
      <img
        src={getImageUrl(avatar)}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-2 ring-white/20"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white ring-2 ring-white/20`}
    >
      {initials}
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-700 text-slate-700"}`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TestimonialsSlider() {
  const { data, isLoading } = useAllReviews(20);
  const reviews = (data?.reviews?.length ? data.reviews : STATIC_REVIEWS);

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [visibleCount, setVisibleCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive slide count
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setVisibleCount(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const total = reviews.length;
  const maxStart = Math.max(0, total - visibleCount);

  const goNext = useCallback(() => {
    if (isAnimating) return;
    setDirection("right");
    setIsAnimating(true);
    setCurrent((c) => (c >= maxStart ? 0 : c + 1));
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, maxStart]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    setDirection("left");
    setIsAnimating(true);
    setCurrent((c) => (c <= 0 ? maxStart : c - 1));
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, maxStart]);

  // Auto-play every 4s
  useEffect(() => {
    if (isPaused || total <= visibleCount) return;
    const t = setInterval(goNext, 4000);
    return () => clearInterval(t);
  }, [goNext, isPaused, total, visibleCount]);

  const visible = reviews.slice(current, current + visibleCount);

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-12 flex flex-col items-center text-center gap-3 sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              ১০,০০০+ সন্তুষ্ট গ্রাহক
            </div>
            <h2 className="text-2xl font-extrabold text-[#0f172a] sm:text-3xl">
              গ্রাহকরা কী বলছেন?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              আমাদের গ্রাহকদের সত্যিকারের অভিজ্ঞতা পড়ুন
            </p>
          </div>

          {/* Nav arrows — desktop */}
          {total > visibleCount && (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={goPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-[#e91e63] hover:text-[#e91e63] hover:shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-[#e91e63] hover:text-[#e91e63] hover:shadow-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Slider ── */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="overflow-hidden"
        >
          <div
            className={`grid gap-5 transition-all duration-400 ${visibleCount === 1
              ? "grid-cols-1"
              : visibleCount === 2
                ? "grid-cols-2"
                : "grid-cols-3"
              } ${isAnimating
                ? direction === "right"
                  ? "opacity-70 translate-x-1"
                  : "opacity-70 -translate-x-1"
                : "opacity-100 translate-x-0"
              }`}
          >
            {isLoading
              ? Array.from({ length: visibleCount }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />
              ))
              : visible.map((review) => {
                const userName = review.user?.name || "Anonymous";
                const text = review.body || review.comment || "";
                const productName = review.product?.name || "";
                const date = new Date(review.created_at).toLocaleDateString("bn-BD", {
                  year: "numeric", month: "long", day: "numeric",
                });

                return (
                  <div
                    key={review.id}
                    className="shadow-card group hover:shadow-card-hover flex flex-col rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Quote icon */}
                    <Quote className="mb-3 h-7 w-7 text-[#e91e63]/10 transition-colors duration-300 group-hover:text-[#e91e63]/20" />

                    {/* Stars */}
                    <StarRow rating={review.rating} />

                    {/* Title */}
                    {(review.title) && (
                      <p className="mt-2.5 text-sm font-bold text-[#0f172a] line-clamp-1">
                        {review.title}
                      </p>
                    )}

                    {/* Body */}
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500 line-clamp-4">
                      &ldquo;{text}&rdquo;
                    </p>

                    {/* Product tag */}
                    {productName && (
                      <div className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-semibold text-[#e91e63]">
                        <MessageCircle className="h-2.5 w-2.5" />
                        {productName}
                      </div>
                    )}

                    {/* User + date */}
                    <div className="mt-4 flex items-center gap-3 border-t border-slate-50 pt-4">
                      <Avatar name={userName} avatar={review.user?.avatar} size={40} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0f172a]">{userName}</p>
                        <p className="text-[10px] text-slate-400">{date}</p>
                      </div>
                      {/* Verified */}
                      <div className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                        ✓ ভেরিফাইড
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── Dots + Mobile Nav ── */}
        {total > visibleCount && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {/* Mobile nav arrows */}
            <button
              onClick={goPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-[#e91e63] hover:text-[#e91e63] sm:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxStart + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? "right" : "left"); setCurrent(i); }}
                  className={`rounded-full transition-all duration-300 ${i === current
                    ? "w-6 h-2 bg-[#e91e63]"
                    : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-[#e91e63] hover:text-[#e91e63] sm:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Rating summary strip ── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-slate-100 bg-slate-50/60 px-6 py-5">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-[#0f172a]">4.9</p>
            <StarRow rating={5} size="md" />
            <p className="mt-1 text-[10px] text-slate-400">গড় রেটিং</p>
          </div>
          <div className="hidden h-12 w-px bg-slate-200 sm:block" />
          {[
            { label: "পণ্যের মান", pct: 98 },
            { label: "ডেলিভারি", pct: 96 },
            { label: "কাস্টমার সার্ভিস", pct: 99 },
          ].map((item) => (
            <div key={item.label} className="min-w-[120px]">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-600">{item.label}</span>
                <span className="font-bold text-[#e91e63]">{item.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e91e63] to-pink-400"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
