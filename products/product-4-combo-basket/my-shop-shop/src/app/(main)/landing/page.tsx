"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Phone,
  ChevronDown,
  ChevronUp,
  Check,
  Flame,
  Clock,
  MessageCircle,
  BadgeCheck,
  Package,
  Zap,
  Award,
  ThumbsUp,
  User,
  Heart,
  Copy,
  AlertCircle,
  ArrowDown,
  Gift,
} from "lucide-react";

/* ─── PRODUCT CONFIG ─── */
const PRODUCT = {
  name: "প্রিমিয়াম ওয়্যারলেস নয়েজ ক্যান্সেলিং হেডফোন",
  tagline: "🎧 যেখানেই যান, সেরা শব্দ অনুভব করুন",
  price: 2999,
  originalPrice: 5500,
  stock: 14,
  sold: 1248,
  rating: 4.9,
  reviewCount: 342,
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80",
    "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&q=80",
    "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&q=80",
  ],
  benefits: [
    {
      icon: Zap,
      text: "40 ঘণ্টা ব্যাটারি লাইফ",
      sub: "একবার চার্জে পুরো সপ্তাহ",
    },
    {
      icon: ShieldCheck,
      text: "Active Noise Cancellation",
      sub: "বাইরের শব্দ সম্পূর্ণ বন্ধ",
    },
    {
      icon: Award,
      text: "Premium Sound Quality",
      sub: "Hi-Fi Crystal Clear Audio",
    },
    { icon: Package, text: "Bluetooth 5.3", sub: "দ্রুত ও স্থিতিশীল সংযোগ" },
  ],
  features: [
    "✅ সম্পূর্ণ ওয়্যারলেস — কোনো তার নেই",
    "✅ আল্ট্রা-কম্ফোর্ট মেমোরি ফোম ইয়ার কুশন",
    "✅ বিল্ট-ইন মাইক্রোফোন ও ভয়েস কন্ট্রোল",
    "✅ ফোল্ডেবল ডিজাইন — সহজে বহনযোগ্য",
    "✅ iOS ও Android উভয়ে কাজ করে",
    "✅ Fast Charging — ১৫ মিনিটে ৩ ঘণ্টা চার্জ",
  ],
  testimonials: [
    {
      name: "রাফি আহমেদ",
      location: "ঢাকা",
      rating: 5,
      text: "অবিশ্বাস্য! এত কম দামে এই মানের হেডফোন আশা করিনি। নয়েজ ক্যান্সেলিং অসাধারণ কাজ করে, অফিসে পরে থাকি সারাদিন। একদম recommendation!",
      verified: true,
      time: "৩ দিন আগে",
    },
    {
      name: "সুমাইয়া খানম",
      location: "চট্টগ্রাম",
      rating: 5,
      text: "গিফট হিসেবে কিনেছিলাম ভাইয়ের জন্য। সে এত খুশি! প্যাকেজিং সুন্দর, দ্রুত ডেলিভারি। আবার কিনব অবশ্যই।",
      verified: true,
      time: "১ সপ্তাহ আগে",
    },
    {
      name: "তানভীর হোসেন",
      location: "সিলেট",
      rating: 5,
      text: "আমি এর আগে অনেক হেডফোন ব্যবহার করেছি। কিন্তু এটার মতো sound quality আর এত comfortable কান আগে হয়নি। দাম দেখে ভরসা করিনি, কিন্তু সত্যিই প্রিমিয়াম!",
      verified: true,
      time: "২ সপ্তাহ আগে",
    },
  ],
  faq: [
    {
      q: "ডেলিভারি কতদিনে পাব?",
      a: "ঢাকার মধ্যে ১-২ দিন। ঢাকার বাইরে ২-৩ দিনের মধ্যে ডেলিভারি হবে। অর্ডার confirm হলে SMS যাবে।",
    },
    {
      q: "পণ্য কি original?",
      a: "হ্যাঁ, শতভাগ original ও imported পণ্য। আমাদের কাছ থেকে কেনার পর ৭ দিনের মধ্যে কোনো সমস্যা হলে ফেরত দেওয়া যাবে।",
    },
    {
      q: "Cash on Delivery কি সম্ভব?",
      a: "হ্যাঁ! Cash on Delivery সম্পূর্ণ বিনামূল্যে। পণ্য হাতে পেয়ে টাকা দিন।",
    },
    {
      q: "Warranty আছে?",
      a: "৬ মাসের replacement warranty। কোনো সমস্যা হলে যোগাযোগ করুন, বদলে দেওয়া হবে।",
    },
  ],
  whatsapp: "8801234567890",
  deliveryCharge: 0, // Free delivery
};

const DISTRICTS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "সিলেট",
  "রাজশাহী",
  "খুলনা",
  "বরিশাল",
  "রংপুর",
  "ময়মনসিংহ",
  "কুমিল্লা",
  "নারায়ণগঞ্জ",
  "গাজীপুর",
  "টাঙ্গাইল",
  "ফরিদপুর",
  "যশোর",
  "সাতক্ষীরা",
  "অন্যান্য",
];

/* ─── Countdown Timer ─── */
function useCountdown() {
  const [time, setTime] = useState({ h: 3, m: 47, s: 22 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) {
          h = 0;
          m = 0;
          s = 0;
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`;
}

/* ─── FAQ Item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${open ? "border-[#e91e63]/30" : "border-slate-200"}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span
          className={`text-sm font-semibold ${open ? "text-[#e91e63]" : "text-slate-800"}`}
        >
          {q}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#e91e63]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pt-3 pb-4">
          <p className="text-sm leading-relaxed text-slate-500">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function LandingPage() {
  const countdown = useCountdown();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    district: "",
    address: "",
    payment: "cod",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const orderFormRef = useRef<HTMLDivElement>(null);

  const discount = Math.round(
    ((PRODUCT.originalPrice - PRODUCT.price) / PRODUCT.originalPrice) * 100,
  );
  const totalPrice = PRODUCT.price * qty + PRODUCT.deliveryCharge;

  const scrollToOrder = () => {
    orderFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.district || !form.address) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyPhone = () => {
    navigator.clipboard.writeText("+880 1234-567890");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 px-4 py-16 text-center">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            অর্ডার সফল হয়েছে! 🎉
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            ধন্যবাদ <strong>{form.name}</strong>! আপনার অর্ডার আমরা পেয়েছি।{" "}
            <strong>{form.phone}</strong> নম্বরে শীঘ্রই কনফার্মেশন কল করা হবে।
          </p>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-sm">
            <p className="mb-2 font-semibold text-slate-700">অর্ডার সারাংশ</p>
            <div className="space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>পণ্য</span>
                <span className="max-w-[60%] text-right font-medium text-slate-700">
                  {PRODUCT.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>পরিমাণ</span>
                <span className="font-medium text-slate-700">{qty}টি</span>
              </div>
              <div className="flex justify-between">
                <span>মোট</span>
                <span className="font-bold text-[#e91e63]">
                  BDT {totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>পেমেন্ট</span>
                <span className="font-medium text-slate-700">
                  {form.payment === "cod"
                    ? "Cash on Delivery"
                    : form.payment === "bkash"
                      ? "bKash"
                      : "Nagad"}
                </span>
              </div>
            </div>
          </div>
          <a
            href={`https://wa.me/${PRODUCT.whatsapp}?text=আমি অর্ডার করেছি। নাম: ${form.name}, ফোন: ${form.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp-এ নিশ্চিত করুন
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ──── TOP STRIP ──── */}
      <div className="bg-[#e91e63] px-4 py-2 text-center text-white">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wide">
          <Flame className="h-3.5 w-3.5 animate-pulse" />
          ফ্রি ডেলিভারি সারা বাংলাদেশে — সীমিত সময়ের অফার!
          <Flame className="h-3.5 w-3.5 animate-pulse" />
        </p>
      </div>

      {/* ──── HEADER ──── */}
      <header className="sticky top-0 z-40 border-b bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e91e63]">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="font-bold text-[#0f172a]">
              My<span className="text-[#e91e63]">Shop</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <Clock className="h-3.5 w-3.5 text-[#e91e63]" />
              অফার শেষ:{" "}
              <span className="font-bold text-[#e91e63]">{countdown}</span>
            </div>
            <button
              onClick={scrollToOrder}
              className="animate-pulse rounded-xl bg-[#e91e63] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#c2185b]"
            >
              এখনই অর্ডার করুন
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ──── HERO SECTION ──── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-50">
              <img
                src={PRODUCT.images[activeImage]}
                alt={PRODUCT.name}
                className="h-80 w-full object-cover transition-all duration-300 sm:h-96"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <span className="rounded-full bg-[#e91e63] px-3 py-1 text-xs font-bold text-white">
                  -{discount}% ছাড়
                </span>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                  ফ্রি ডেলিভারি
                </span>
              </div>
            </div>
            {/* Thumbnails */}
            <div className="mt-3 flex gap-2">
              {PRODUCT.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${activeImage === i ? "scale-105 border-[#e91e63]" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Social proof bar */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#0f172a]">
                  {PRODUCT.rating}
                </span>
                <span className="text-xs text-slate-400">
                  ({PRODUCT.reviewCount} রিভিউ)
                </span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-bold text-[#0f172a]">
                  {PRODUCT.sold.toLocaleString()}+
                </span>{" "}
                জন কিনেছেন
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#e91e63] uppercase">
              🔥 সীমিত সময়ের বিশেষ অফার
            </p>
            <h1 className="mt-2 text-2xl leading-tight font-black text-[#0f172a] sm:text-3xl">
              {PRODUCT.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{PRODUCT.tagline}</p>

            {/* Price */}
            <div className="mt-5 flex items-end gap-3">
              <span className="text-4xl font-black text-[#e91e63]">
                BDT {PRODUCT.price.toLocaleString()}
              </span>
              <div>
                <p className="text-sm text-slate-400 line-through">
                  BDT {PRODUCT.originalPrice.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-emerald-600">
                  আপনি সাশ্রয় করছেন BDT 
                  {(PRODUCT.originalPrice - PRODUCT.price).toLocaleString()}!
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <Clock className="h-4 w-4 shrink-0 text-orange-500" />
              <p className="text-xs text-orange-700">
                এই দামে পাওয়া যাবে আর মাত্র:{" "}
                <span className="text-sm font-black text-orange-600">
                  {countdown}
                </span>
              </p>
            </div>

            {/* Stock warning */}
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-500">
                সতর্কতা: মাত্র <strong>{PRODUCT.stock}টি</strong> বাকি আছে!
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {PRODUCT.benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e91e63]/10">
                      <Icon className="h-4 w-4 text-[#e91e63]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0f172a]">
                        {b.text}
                      </p>
                      <p className="text-[10px] text-slate-400">{b.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <button
              onClick={scrollToOrder}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e91e63] py-4 text-lg font-black text-white shadow-lg shadow-pink-200 transition-all hover:-translate-y-0.5 hover:bg-[#c2185b] hover:shadow-xl"
            >
              <ShoppingBag className="h-5 w-5" />
              এখনই অর্ডার করুন
              <ArrowDown className="h-5 w-5 animate-bounce" />
            </button>

            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> নিরাপদ
                পেমেন্ট
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-blue-500" /> ৭ দিনে রিটার্ন
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-500" /> ৬ মাস
                ওয়ারেন্টি
              </span>
            </div>
          </div>
        </div>

        {/* ──── FEATURES ──── */}
        <section className="mt-16">
          <h2 className="text-center text-xl font-black text-[#0f172a]">
            কেন এই হেডফোন কিনবেন?
          </h2>
          <div className="section-divider mt-3" />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PRODUCT.features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5 text-sm font-medium text-[#0f172a]"
              >
                {f}
              </div>
            ))}
          </div>
        </section>

        {/* ──── ORDER FORM ──── */}
        <section ref={orderFormRef} className="mt-16 scroll-mt-24">
          <div className="rounded-3xl border-2 border-[#e91e63]/20 bg-gradient-to-br from-pink-50/50 to-white p-6 sm:p-8">
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e91e63] px-4 py-1.5 text-xs font-bold text-white">
                <Gift className="h-3.5 w-3.5" />
                অর্ডার ফর্ম — ফ্রি ডেলিভারি সহ
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#0f172a]">
                এখনই অর্ডার করুন
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                নিচের ফর্ম পূরণ করুন, আমরা কনফার্মেশন কল করব
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Qty Selector */}
              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  পরিমাণ নির্বাচন করুন
                </label>
                <div className="flex items-center gap-4">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQty(n)}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all ${qty === n ? "border-[#e91e63] bg-[#e91e63] text-white" : "border-slate-200 text-slate-600 hover:border-[#e91e63]/50"}`}
                    >
                      {n}টি
                      {n > 1 && (
                        <span className="block text-[10px] font-normal opacity-80">
                          BDT {(PRODUCT.price * n).toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                    আপনার নাম *
                  </label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="আপনার পুরো নাম"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                    মোবাইল নম্বর *
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* District */}
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  জেলা *
                </label>
                <select
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">জেলা বেছে নিন</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  বিস্তারিত ঠিকানা *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="রাস্তা, এলাকা, উপজেলা..."
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="input-field resize-none"
                />
              </div>

              {/* Payment */}
              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  পেমেন্ট পদ্ধতি
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cod", label: "ক্যাশ অন ডেলিভারি", icon: "💵" },
                    { id: "bkash", label: "বিকাশ", icon: "📱" },
                    { id: "nagad", label: "নগদ", icon: "💳" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, payment: p.id })}
                      className={`flex flex-col items-center rounded-xl border-2 py-3 text-xs font-semibold transition-all ${form.payment === p.id ? "border-[#e91e63] bg-[#e91e63]/5 text-[#e91e63]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      <span className="mb-1 text-xl">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Order Summary */}
              <div className="rounded-xl bg-[#0f172a] p-4 text-white">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">পণ্যের দাম ({qty}টি)</span>
                  <span>BDT {(PRODUCT.price * qty).toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">ডেলিভারি চার্জ</span>
                  <span className="font-semibold text-emerald-400">
                    বিনামূল্যে ✓
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3">
                  <span className="font-bold">মোট পেমেন্ট</span>
                  <span className="text-2xl font-black text-[#e91e63]">
                    BDT {totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#e91e63] py-4 text-lg font-black text-white shadow-lg shadow-pink-200 transition-all hover:-translate-y-0.5 hover:bg-[#c2185b]"
              >
                🎉 অর্ডার কনফার্ম করুন
              </button>

              <p className="text-center text-xs text-slate-400">
                অর্ডারের পর আমরা{" "}
                <strong className="text-slate-600">১-২ ঘণ্টার মধ্যে</strong>{" "}
                কনফার্মেশন কল করব
              </p>
            </form>
          </div>
        </section>

        {/* ──── TRUST BADGES ──── */}
        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: Truck,
              label: "ফ্রি ডেলিভারি",
              sub: "সারা বাংলাদেশে",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: ShieldCheck,
              label: "নিরাপদ পেমেন্ট",
              sub: "১০০% সুরক্ষিত",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              icon: RefreshCw,
              label: "৭ দিন রিটার্ন",
              sub: "ঝামেলামুক্ত",
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
            {
              icon: BadgeCheck,
              label: "অরিজিনাল পণ্য",
              sub: "শতভাগ গ্যারান্টি",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${b.bg}`}
                >
                  <Icon className={`h-5 w-5 ${b.color}`} />
                </div>
                <p className="mt-2 text-xs font-bold text-[#0f172a]">
                  {b.label}
                </p>
                <p className="text-[10px] text-slate-400">{b.sub}</p>
              </div>
            );
          })}
        </section>

        {/* ──── TESTIMONIALS ──── */}
        <section className="mt-16">
          <h2 className="text-center text-xl font-black text-[#0f172a]">
            কাস্টমারদের অভিজ্ঞতা
          </h2>
          <div className="section-divider mt-3" />
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PRODUCT.testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3 border-t border-slate-50 pt-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-sm font-bold text-[#e91e63]">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[#0f172a]">
                        {t.name}
                      </p>
                      {t.verified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {t.location} · {t.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ──── FAQ ──── */}
        <section className="mt-16">
          <h2 className="text-center text-xl font-black text-[#0f172a]">
            সাধারণ প্রশ্নোত্তর
          </h2>
          <div className="section-divider mt-3" />
          <div className="mt-8 space-y-3">
            {PRODUCT.faq.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* ──── CONTACT ──── */}
        <section className="mt-16 rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 text-center text-white">
          <h3 className="text-xl font-black">যোগাযোগ করুন</h3>
          <p className="mt-2 text-sm text-slate-400">
            যেকোনো প্রশ্ন বা অর্ডার সংক্রান্ত বিষয়ে সরাসরি যোগাযোগ করুন
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/${PRODUCT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp করুন
            </a>
            <button
              onClick={copyPhone}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "কপি হয়েছে!" : "+880 1234-567890"}
            </button>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={scrollToOrder}
            className="btn-pink inline-flex items-center gap-2 px-10 py-4 text-base font-black"
          >
            এখনই অর্ডার করুন — ফ্রি ডেলিভারি
            <ArrowDown className="h-5 w-5 animate-bounce" />
          </button>
          <p className="mt-3 text-xs text-slate-400">
            মাত্র {PRODUCT.stock}টি স্টকে বাকি ✦ অফার সীমিত সময়ের জন্য
          </p>
        </div>
      </main>

      {/* ──── FLOATING WHATSAPP ──── */}
      <a
        href={`https://wa.me/${PRODUCT.whatsapp}?text=আমি এই পণ্যটি সম্পর্কে জানতে চাই`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-5 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 hover:bg-[#1ebe5d]"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-red-500 text-[9px] font-bold">
          1
        </span>
      </a>

      {/* ──── STICKY BOTTOM BAR (Mobile) ──── */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t bg-white p-3 shadow-lg sm:hidden">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-slate-400 line-through">
              BDT {PRODUCT.originalPrice.toLocaleString()}
            </p>
            <p className="text-lg font-black text-[#e91e63]">
              BDT {PRODUCT.price.toLocaleString()}
            </p>
          </div>
          <button
            onClick={scrollToOrder}
            className="flex-1 rounded-xl bg-[#e91e63] py-3 text-sm font-black text-white"
          >
            এখনই অর্ডার করুন 🎉
          </button>
        </div>
      </div>
    </div>
  );
}

// Missing import at the top
function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
      />
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        strokeLinecap="round"
        strokeWidth={2}
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 10a4 4 0 01-8 0"
      />
    </svg>
  );
}
