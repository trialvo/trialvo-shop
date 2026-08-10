"use client";

import { notFound } from "next/navigation";
import { useState, useEffect, useRef, use } from "react";
import { useProduct, toFrontendProduct } from "@/api/products";
import { dn } from "@/utils/displayName";
import { getImageUrl } from "@/lib/imageUrl";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  Flame,
  MessageCircle,
  ShieldCheck,
  Truck,
  RefreshCw,
  BadgeCheck,
  User,
  Phone,
  MapPin,
  Minus,
  Plus,
  ArrowDown,
  Package,
  Gift,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Zap,
  Award,
  Lock,
  Home,
  FileText,
  Loader2,
} from "lucide-react";

const DISTRICTS = [
  "ঢাকা", "চট্টগ্রাম", "সিলেট", "রাজশাহী", "খুলনা", "বরিশাল",
  "রংপুর", "ময়মনসিংহ", "কুমিল্লা", "নারায়ণগঞ্জ", "গাজীপুর",
  "টাঙ্গাইল", "ফরিদপুর", "যশোর", "সাতক্ষীরা", "ব্রাহ্মণবাড়িয়া",
  "হবিগঞ্জ", "মৌলভীবাজার", "অন্যান্য",
];

function useCountdown(initialSeconds = 14847) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return { h: p(h), m: p(m), s: p(s) };
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${open ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`text-sm font-semibold leading-snug ${open ? "text-rose-600" : "text-slate-700"}`}>{q}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${open ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400"}`}>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-rose-100 px-5 pt-3 pb-5">
          <p className="text-sm leading-relaxed text-slate-500">{a}</p>
        </div>
      )}
    </div>
  );
}

type OrderStep = 1 | 2 | 3;

/** Map API product to a shape compatible with the landing page layout */
function toLandingProduct(apiProduct: ReturnType<typeof toFrontendProduct>) {
  return {
    slug: apiProduct.slug,
    name: apiProduct.name,
    name_bn: apiProduct.name_bn ?? null,
    tagline: apiProduct.shortDescription || "",
    description: apiProduct.description || "",
    badge: apiProduct.isFeatured ? "🔥 সেরা বিক্রয়" : "⭐ জনপ্রিয়",
    price: apiProduct.price,              // MRP — shown as strikethrough when discounted
    discountPrice: apiProduct.discountPrice ?? null,   // sell price (price − discount)
    originalPrice: apiProduct.price,       // always MRP (for strikethrough display)
    stock: apiProduct.stockQty ?? 50,
    sold: apiProduct.reviewCount * 5 || 100,
    rating: apiProduct.rating,
    reviewCount: apiProduct.reviewCount,
    deliveryCharge: 0,
    images: apiProduct.images?.length ? apiProduct.images : [apiProduct.image],
    colors: [] as { label: string; value: string; available: boolean }[],
    sizes: [] as { label: string; value: string; available: boolean }[],
    comboItems: [] as { name: string; image: string; value: string }[],
    benefits: [
      { icon: "🎁", title: "প্রিমিয়াম কোয়ালিটি", sub: "১০০% অরিজিনাল" },
      { icon: "🚚", title: "ফ্রি ডেলিভারি", sub: "সারা বাংলাদেশে" },
      { icon: "↩️", title: "৭ দিন রিটার্ন", sub: "ঝামেলামুক্ত" },
      { icon: "🔒", title: "নিরাপদ পেমেন্ট", sub: "১০০% সুরক্ষিত" },
    ],
    features: apiProduct.features?.length
      ? apiProduct.features
      : ["✅ প্রিমিয়াম কোয়ালিটির প্রোডাক্ট", "✅ ফ্রি ডেলিভারি সারা বাংলাদেশে", "✅ ৭ দিনের রিটার্ন গ্যারান্টি"],
    testimonials: [] as { name: string; location: string; rating: number; text: string; time: string }[],
    faq: [
      { q: "ডেলিভারি কতদিনে পাব?", a: "ঢাকায় ১-২ দিন, বাইরে ২-৪ দিন। অর্ডার confirm হলে SMS যাবে।" },
      { q: "প্রোডাক্ট কি অরিজিনাল?", a: "হ্যাঁ, ১০০% অরিজিনাল। ৭ দিনের রিটার্ন গ্যারান্টি আছে।" },
      { q: "Cash on Delivery (COD) আছে?", a: "হ্যাঁ! COD সম্পূর্ণ বিনামূল্যে।" },
    ],
    whatsapp: "8801700000000",
    metaTitle: apiProduct.name,
    metaDesc: apiProduct.shortDescription || apiProduct.description?.slice(0, 160) || "",
  };
}

export default function ProductLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: productData, isLoading, isError } = useProduct(slug);

  const countdown = useCountdown();
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState<OrderStep>(1);
  const [form, setForm] = useState({ name: "", phone: "", district: "", address: "", note: "" });
  const [payment, setPayment] = useState<"cod" | "bkash" | "nagad">("cod");
  const [orderId] = useState("ORD-" + Date.now().toString().slice(-6));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const orderRef = useRef<HTMLDivElement>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="text-sm text-slate-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (isError || !productData?.product) {
    notFound();
  }

  const product = toLandingProduct(toFrontendProduct(productData.product));

  // effectivePrice = sell price (discountPrice if set, else MRP)
  const effectivePrice = product.discountPrice ?? product.price;
  const discount = product.originalPrice > effectivePrice
    ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
    : 0;
  const total = effectivePrice * qty + product.deliveryCharge;

  const scrollToOrder = () => orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "নাম দিন";
    if (!form.phone.match(/^01[3-9]\d{8}$/)) e.phone = "সঠিক মোবাইল নম্বর দিন";
    if (!form.district) e.district = "জেলা নির্বাচন করুন";
    if (!form.address.trim()) e.address = "ঠিকানা দিন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Success Screen ─── */
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-16">
        <div className="mx-auto max-w-lg">
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 pt-10 pb-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-black">অর্ডার সফল! 🎉</h1>
              <p className="mt-1.5 text-sm text-emerald-100">ধন্যবাদ <strong>{form.name}</strong>! আমরা আপনার অর্ডার পেয়েছি।</p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 px-5 py-3.5">
                <span className="text-xs font-medium text-slate-400">অর্ডার নম্বর</span>
                <span className="text-xl font-black text-rose-500">{orderId}</span>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-100 p-4 text-sm">
                {[
                  { label: "পণ্য", value: dn(product) },
                  { label: "পরিমাণ", value: `${qty}টি` },
                  { label: "মোট", value: `BDT ${total.toLocaleString()}`, highlight: true },
                  { label: "পেমেন্ট", value: payment === "cod" ? "Cash on Delivery" : payment === "bkash" ? "বিকাশ" : "নগদ" },
                  { label: "ঠিকানা", value: `${form.district}, ${form.address}` },
                  { label: "ফোন", value: form.phone },
                ].map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-slate-400">{row.label}</span>
                    <span className={`text-right font-medium ${(row as { highlight?: boolean }).highlight ? "font-black text-rose-500" : "text-slate-700"}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 p-4">
                <p className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">ডেলিভারি টাইমলাইন</p>
                <div className="relative space-y-3 pl-6">
                  <div className="absolute left-2.5 top-0 h-full w-0.5 bg-slate-100" />
                  {[
                    { label: "অর্ডার গ্রহণ", sub: "এইমাত্র ✓", done: true },
                    { label: "কনফার্মেশন কল", sub: "১-২ ঘণ্টার মধ্যে", done: false },
                    { label: "প্যাকেজিং ও শিপমেন্ট", sub: "২৪ ঘণ্টার মধ্যে", done: false },
                    { label: "ডেলিভারি", sub: form.district === "ঢাকা" ? "১-২ দিন" : "২-৩ দিন", done: false },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`absolute left-0 flex h-5 w-5 items-center justify-center rounded-full text-xs ${t.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`} style={{ top: `${i * 2.25}rem` }}>
                        {t.done ? <Check className="h-3 w-3" /> : i + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${t.done ? "text-emerald-600" : "text-slate-600"}`}>{t.label}</p>
                        <p className="text-[10px] text-slate-400">{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={`https://wa.me/${product.whatsapp}?text=${encodeURIComponent(`অর্ডার: ${orderId}\nনাম: ${form.name}\nফোন: ${form.phone}\nপণ্য: ${dn(product)} (${qty}টি)`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-sm font-bold text-white transition-all hover:bg-[#1ebe5d] active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp-এ নিশ্চিত করুন
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Page ─── */
  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 px-4 py-2.5 text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold text-white">
          <Flame className="h-3.5 w-3.5 animate-pulse" />
          <span>
            <span className="hidden sm:inline">🎉 সীমিত সময়ের অফার! </span>
            ফ্রি ডেলিভারি + {discount}% ছাড় — আজকেই অর্ডার করুন!
          </span>
          <Flame className="h-3.5 w-3.5 animate-pulse" />
        </p>
      </div>

      {/* ═══ STICKY HEADER ═══ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/98 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-200">
                <span className="text-sm font-black text-white">M</span>
              </div>
              <div className="leading-none">
                <span className="text-lg font-black tracking-tight text-slate-800">
                  My<span className="text-rose-500">Shop</span>
                </span>
                <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 hidden sm:block">
                  বাংলাদেশের বিশ্বস্ত শপ
                </p>
              </div>
            </div>

            {/* Center: Countdown Timer */}
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2">
              <Clock className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-xs font-semibold text-red-700">অফার শেষ:</span>
              <div className="flex items-center gap-1">
                {[
                  { v: countdown.h, l: "ঘণ্টা" },
                  { v: countdown.m, l: "মিনিট" },
                  { v: countdown.s, l: "সেকেন্ড" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="inline-flex min-w-[36px] flex-col items-center rounded-lg bg-red-500 px-2 py-1 shadow-sm">
                      <span className="text-sm font-black leading-none text-white">{t.v}</span>
                      <span className="text-[8px] text-red-100">{t.l}</span>
                    </span>
                    {i < 2 && <span className="text-sm font-black text-red-500">:</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: CTA + Trust */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mini trust badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">নিরাপদ অর্ডার</span>
              </div>

              {/* Mobile: compact timer */}
              <div className="flex md:hidden items-center gap-1">
                {[{ v: countdown.h }, { v: countdown.m }, { v: countdown.s }].map((t, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    <span className="inline-flex min-w-[28px] items-center justify-center rounded-md bg-red-500 px-1 py-0.5 text-xs font-black text-white">{t.v}</span>
                    {i < 2 && <span className="text-xs font-bold text-red-500">:</span>}
                  </div>
                ))}
              </div>

              <button
                onClick={scrollToOrder}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-rose-200/60 transition-all hover:-translate-y-0.5 hover:shadow-rose-300/60 active:translate-y-0"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">অর্ডার করুন</span>
                <span className="sm:hidden">অর্ডার</span>
              </button>
            </div>
          </div>
        </div>

        {/* Header bottom trust strip */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-1.5">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 text-[11px] text-slate-500">
            {[
              { icon: <Truck className="h-3.5 w-3.5 text-emerald-500" />, text: "ফ্রি ডেলিভারি" },
              { icon: <RefreshCw className="h-3.5 w-3.5 text-blue-500" />, text: "৭ দিন রিটার্ন" },
              { icon: <Lock className="h-3.5 w-3.5 text-violet-500" />, text: "নিরাপদ পেমেন্ট" },
              { icon: <BadgeCheck className="h-3.5 w-3.5 text-rose-500" />, text: "১০০% অরিজিনাল" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 font-medium">
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ PAGE BODY ═══ */}
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:pb-10">

        {/* ─── HERO SECTION ─── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">

          {/* Left: Images */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-md">
              <img
                src={getImageUrl(product.images[imgIdx])}
                alt={dn(product)}
                className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[460px]"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-xs font-black text-white shadow-md">
                  {discount}% ছাড়
                </span>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                  ফ্রি ডেলিভারি
                </span>
              </div>
              {/* Nav Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-700" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % product.images.length)}
                    className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-700" />
                  </button>
                </>
              )}
              {/* Dot indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {product.images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${imgIdx === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2.5">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`h-[72px] w-[72px] overflow-hidden rounded-xl border-2 transition-all duration-200 ${imgIdx === i ? "scale-105 border-rose-500 shadow-md shadow-rose-100" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Rating card */}
            <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-black text-slate-800">{product.rating}</span>
                <span className="text-xs text-slate-400">({product.reviewCount} রিভিউ)</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Package className="h-4 w-4 text-rose-400" />
                <span className="font-black text-slate-800">{product.sold.toLocaleString()}+</span>
                <span className="text-xs text-slate-400">বিক্রয়</span>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-5">
            {/* Badge + Title */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                <Zap className="h-3 w-3" />
                {product.badge}
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                {dn(product)}
              </h1>
              <p className="mt-2 text-base text-slate-500">{product.tagline}</p>
            </div>

            {/* Price */}
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-5">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-4xl font-black text-rose-500">BDT {effectivePrice.toLocaleString()}</span>
                {discount > 0 && (
                  <div className="pb-1 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-400 line-through">BDT {product.originalPrice.toLocaleString()}</p>
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>
                    </div>
                    <p className="text-xs font-bold text-emerald-600">BDT {(product.originalPrice - effectivePrice).toLocaleString()} সাশ্রয়!</p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5">
                <Clock className="h-4 w-4 shrink-0 text-red-500" />
                <span className="text-xs text-red-700">এই দামে বাকি:</span>
                <div className="ml-auto flex items-center gap-1">
                  {[{ v: countdown.h }, { v: countdown.m }, { v: countdown.s }].map((t, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <span className="inline-flex min-w-[30px] justify-center rounded-lg bg-red-500 px-1.5 py-0.5 text-xs font-black text-white">{t.v}</span>
                      {i < 2 && <span className="text-xs font-bold text-red-400">:</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock warning */}
            <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-orange-500" />
              <p className="text-xs font-semibold text-orange-700">
                সতর্কতা: মাত্র <strong className="text-orange-600">{product.stock}টি</strong> স্টকে বাকি — এখনই অর্ডার করুন!
              </p>
            </div>

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="mb-2.5 text-xs font-bold tracking-wider text-slate-500 uppercase">রঙ নির্বাচন করুন</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      disabled={!c.available}
                      onClick={() => setSelectedColor(c.value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-semibold transition-all ${selectedColor === c.value
                        ? "border-rose-500 bg-rose-50 text-rose-600 shadow-sm shadow-rose-100"
                        : c.available
                          ? "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          : "cursor-not-allowed border-slate-100 text-slate-300"
                        }`}
                    >
                      <span className="h-4 w-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: c.value }} />
                      {c.label}
                      {!c.available && <span className="text-[10px]">(শেষ)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="mb-2.5 text-xs font-bold tracking-wider text-slate-500 uppercase">সাইজ নির্বাচন করুন</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.value}
                      disabled={!s.available}
                      onClick={() => setSelectedSize(s.value)}
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${selectedSize === s.value
                        ? "border-rose-500 bg-rose-50 text-rose-600 shadow-sm"
                        : s.available
                          ? "border-slate-200 text-slate-600 hover:border-slate-300"
                          : "cursor-not-allowed border-slate-100 text-slate-300 line-through"
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits grid */}
            <div className="grid grid-cols-2 gap-2">
              {product.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-sm">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{b.title}</p>
                    <p className="text-[11px] text-slate-400">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={scrollToOrder}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-4.5 py-[18px] text-lg font-black text-white shadow-xl shadow-rose-200/70 transition-all hover:-translate-y-0.5 hover:shadow-rose-300/70 active:translate-y-0"
            >
              <Package className="h-5 w-5" />
              এখনই অর্ডার করুন
              <ArrowDown className="h-5 w-5 animate-bounce" />
            </button>
          </div>
        </div>

        {/* ─── DESCRIPTION ─── */}
        {product.description && (
          <section className="mt-14">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                <h2 className="text-lg font-black text-slate-900">পণ্যের বিবরণ</h2>
              </div>
              <div
                className="prose prose-sm prose-slate max-w-none px-6 py-5 sm:px-8 [&>p]:text-slate-600 [&>p]:leading-relaxed [&>p]:mb-3 [&_strong]:text-slate-800 [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </section>
        )}

        {/* ─── FEATURES ─── */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full bg-rose-100 px-4 py-1 text-xs font-bold text-rose-600 uppercase tracking-wider">বিস্তারিত</span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">পণ্যের বৈশিষ্ট্যসমূহ</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {product.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{f.replace(/^✅\s*/, "")}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── COMBO ITEMS ─── */}
        {product.comboItems && product.comboItems.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 text-center">
              <span className="inline-block rounded-full bg-violet-100 px-4 py-1 text-xs font-bold text-violet-600 uppercase tracking-wider">প্যাকেজের মধ্যে</span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">বক্সে কী কী থাকছে?</h2>
              <p className="mt-1 text-sm text-slate-500">এই একটি অর্ডারে আপনি পাচ্ছেন সব কিছু</p>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              {/* Header row */}
              <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:grid-cols-4">
                <span className="col-span-2">পণ্য</span>
                <span className="text-right">বাজার মূল্য</span>
                <span className="text-right">আপনার মূল্য</span>
              </div>
              {product.comboItems.map((item, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-4 items-center gap-3 px-5 py-4 ${i < product.comboItems!.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover shadow-sm"
                    />
                    <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-right text-sm text-slate-400 line-through">{item.value}</span>
                  <span className="text-right text-sm font-black text-emerald-600">ফ্রি ✓</span>
                </div>
              ))}
              {/* Total row */}
              <div className="grid grid-cols-4 items-center gap-3 border-t-2 border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 px-5 py-4">
                <div className="col-span-2">
                  <p className="text-sm font-black text-slate-800">মোট প্যাকেজ মূল্য</p>
                  <p className="text-xs text-slate-500">সব আইটেম মিলিয়ে</p>
                </div>
                <span className="text-right text-base font-black text-slate-400 line-through">
                  {product.comboItems.reduce((acc, item) => {
                    const num = parseInt(item.value.replace(/[^0-9]/g, ""));
                    return acc + (isNaN(num) ? 0 : num);
                  }, 0).toLocaleString("bn-BD")} টাকা
                </span>
                <span className="text-right text-base font-black text-rose-500">BDT {(product.discountPrice ?? product.price).toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        {/* ─── TESTIMONIALS ─── */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-bold text-amber-600 uppercase tracking-wider">ক্রেতাদের মতামত</span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">তারা কী বলছেন?</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.testimonials.map((t, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-sm font-black text-white">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location}</p>
                    </div>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div className="mb-2 flex">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">"{t.text}"</p>
                <p className="mt-3 text-[11px] text-slate-400">{t.time}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ORDER FORM ─── */}
        <section ref={orderRef} className="mt-16 scroll-mt-24">
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full bg-rose-100 px-4 py-1 text-xs font-bold text-rose-600 uppercase tracking-wider">অর্ডার</span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">এখনই অর্ডার করুন</h2>
          </div>

          <div className="mx-auto max-w-xl">
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg">অর্ডার ফর্ম</h3>
                    <p className="mt-0.5 text-sm text-rose-100">নিচের তথ্য পূরণ করুন</p>
                  </div>
                  {/* Step progress */}
                  <div className="flex items-center gap-2">
                    {[1, 2].map((n) => (
                      <div key={n} className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition-all ${step === n ? "bg-white text-rose-500" : step > n ? "bg-white/30 text-white" : "bg-white/20 text-white/50"
                          }`}>
                          {step > n ? <Check className="h-4 w-4" /> : n}
                        </div>
                        {n < 2 && <div className={`h-0.5 w-6 rounded-full ${step > 1 ? "bg-white/60" : "bg-white/20"}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-5">
                    {/* Product summary */}
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <img src={getImageUrl(product.images[0])} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{dn(product)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-black text-rose-500">BDT {(product.discountPrice ?? product.price).toLocaleString()}</span>
                          <span className="text-xs text-slate-400 line-through">BDT {product.originalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600 uppercase tracking-wider">পরিমাণ</label>
                      <div className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-3">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          disabled={qty <= 1}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 transition-all hover:border-rose-300 hover:text-rose-500 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-3xl font-black text-slate-900">{qty}</span>
                          <span className="ml-1 text-sm text-slate-400">টি</span>
                        </div>
                        <button
                          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                          disabled={qty >= product.stock}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-rose-400 bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {[1, 2, 3, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setQty(Math.min(n, product.stock))}
                            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${qty === n ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            {n}টি
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-2.5">
                        <span className="text-xs text-slate-500">{qty}×BDT {effectivePrice.toLocaleString()} + ডেলিভারি</span>
                        <span className="text-base font-black text-rose-500">BDT {total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-600">আপনার নাম <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="পুরো নাম লিখুন"
                            value={form.name}
                            onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                            className={`w-full rounded-xl border-2 py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all placeholder:text-slate-300 focus:border-rose-400 focus:bg-rose-50/30 ${errors.name ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"}`}
                          />
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-600">মোবাইল নম্বর <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            value={form.phone}
                            onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
                            className={`w-full rounded-xl border-2 py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all placeholder:text-slate-300 focus:border-rose-400 focus:bg-rose-50/30 ${errors.phone ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"}`}
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* District */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">জেলা <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          value={form.district}
                          onChange={(e) => { setForm({ ...form, district: e.target.value }); setErrors({ ...errors, district: "" }); }}
                          className={`w-full appearance-none rounded-xl border-2 py-3 pl-10 pr-10 text-sm font-medium outline-none transition-all focus:border-rose-400 focus:bg-rose-50/30 ${errors.district ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"}`}
                        >
                          <option value="">জেলা বেছে নিন</option>
                          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                      {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">বিস্তারিত ঠিকানা <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Home className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                        <textarea
                          rows={2}
                          placeholder="রাস্তা, এলাকা, উপজেলা..."
                          value={form.address}
                          onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrors({ ...errors, address: "" }); }}
                          className={`w-full resize-none rounded-xl border-2 pl-10 pr-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-slate-300 focus:border-rose-400 focus:bg-rose-50/30 ${errors.address ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"}`}
                        />
                      </div>
                      {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>

                    {/* Note */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">বিশেষ নির্দেশনা <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span></label>
                      <div className="relative">
                        <FileText className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="কোনো বিশেষ নির্দেশনা..."
                          value={form.note}
                          onChange={(e) => setForm({ ...form, note: e.target.value })}
                          className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-slate-300 focus:border-rose-400 focus:bg-rose-50/30"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => { if (validate()) setStep(2); }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-4 text-base font-black text-white shadow-lg shadow-rose-200/70 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      পরবর্তী: পেমেন্ট
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-5">
                    {/* Order summary */}
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">অর্ডার সারসংক্ষেপ</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">পণ্য</span><span className="font-medium text-slate-700 max-w-[55%] text-right">  {dn(product)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">পরিমাণ</span><span className="font-medium">{qty}টি</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ডেলিভারি</span><span className="font-bold text-emerald-600">{product.deliveryCharge === 0 ? "বিনামূল্যে" : `BDT ${product.deliveryCharge}`}</span></div>
                        <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-bold text-slate-700">মোট</span><span className="text-lg font-black text-rose-500">BDT {total.toLocaleString()}</span></div>
                      </div>
                    </div>

                    {/* Payment Options */}
                    <div>
                      <p className="mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider">পেমেন্ট পদ্ধতি</p>
                      <div className="space-y-2.5">
                        {[
                          { id: "cod", label: "Cash on Delivery (COD)", sub: "পণ্য পেয়ে টাকা দিন", icon: "💵", badge: "সবচেয়ে জনপ্রিয়" },
                          { id: "bkash", label: "বিকাশ", sub: "Advance payment via bKash", icon: "📱", badge: null },
                          { id: "nagad", label: "নগদ", sub: "Advance payment via Nagad", icon: "💳", badge: null },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setPayment(opt.id as "cod" | "bkash" | "nagad")}
                            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${payment === opt.id ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                          >
                            <span className="text-2xl">{opt.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                                {opt.badge && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{opt.badge}</span>}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                            </div>
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${payment === opt.id ? "border-rose-500 bg-rose-500" : "border-slate-300"}`}>
                              {payment === opt.id && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* bKash/Nagad instructions */}
                    {(payment === "bkash" || payment === "nagad") && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
                        <p className="font-bold text-amber-800">পেমেন্ট নির্দেশনা:</p>
                        <ol className="mt-2 space-y-1 text-amber-700 list-decimal list-inside text-xs">
                          <li>{payment === "bkash" ? "বিকাশ" : "নগদ"} থেকে Send Money করুন: <strong>01234-567890</strong></li>
                          <li>Amount: BDT {total.toLocaleString()} পাঠান</li>
                          <li>Transaction ID নোট রাখুন</li>
                        </ol>
                      </div>
                    )}

                    {/* Trust badges */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { icon: <Lock className="h-4 w-4 text-violet-500" />, label: "নিরাপদ" },
                        { icon: <Truck className="h-4 w-4 text-emerald-500" />, label: "দ্রুত ডেলিভারি" },
                        { icon: <RefreshCw className="h-4 w-4 text-blue-500" />, label: "৭ দিন রিটার্ন" },
                      ].map((b, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 py-3">
                          {b.icon}
                          <span className="text-[11px] font-semibold text-slate-600">{b.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300"
                      >
                        <ChevronLeft className="h-4 w-4" /> ফিরে যান
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 text-base font-black text-white shadow-lg shadow-rose-200/70 transition-all hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Check className="h-5 w-5" />
                        অর্ডার কনফার্ম করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full bg-slate-100 px-4 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">সাহায্য</span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">সাধারণ প্রশ্নোত্তর</h2>
          </div>
          <div className="mx-auto max-w-2xl space-y-3">
            {product.faq.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </section>

        {/* ─── BOTTOM TRUST ─── */}
        <section className="mt-16">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: <Truck className="h-7 w-7 text-emerald-500" />, title: "ফ্রি ডেলিভারি", sub: "সারা বাংলাদেশে" },
              { icon: <RefreshCw className="h-7 w-7 text-blue-500" />, title: "৭ দিন রিটার্ন", sub: "ঝামেলামুক্ত নীতি" },
              { icon: <Lock className="h-7 w-7 text-violet-500" />, title: "নিরাপদ পেমেন্ট", sub: "১০০% সুরক্ষিত" },
              { icon: <Award className="h-7 w-7 text-amber-500" />, title: "মানের গ্যারান্টি", sub: "১০০% অরিজিনাল" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">{item.icon}</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── MOBILE STICKY CTA ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-lg sm:hidden">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">মূল্য</p>
            <p className="text-lg font-black text-rose-500">BDT {(product.discountPrice ?? product.price).toLocaleString()}</p>
          </div>
          <button
            onClick={scrollToOrder}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 text-base font-black text-white shadow-lg shadow-rose-200"
          >
            <Package className="h-5 w-5" />
            এখনই অর্ডার করুন
          </button>
        </div>
      </div>
    </div>
  );
}
