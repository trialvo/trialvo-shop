"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Lock, ShieldCheck, User, Phone,
  MapPin, ChevronDown, MessageCircle, Tag, Package, Check,
  CreditCard, Banknote, Smartphone, Edit3, Truck, Clock,
  Star, Gift, FileText, Home, AlertCircle, Loader2, Zap, Heart,
} from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { useShopConfig } from "@/context/ShopConfigContext";
import { computePricing } from "@/config/shopConfig";
import { usePlaceOrder } from "@/api/orders";
import { useValidateCoupon } from "@/api/coupons";
import { getImageUrl } from "@/lib/imageUrl";

/* ─── Types ─── */
type Step = number;

const STEPS = [
  { id: 1, label: "তথ্য", icon: User },
  { id: 2, label: "ডেলিভারি", icon: Truck },
  { id: 3, label: "পেমেন্ট", icon: CreditCard },
  { id: 4, label: "রিভিউ", icon: Check },
];

// static delivery options removed as they are now dynamic

const paymentMethods = [
  { id: "cod", label: "ক্যাশ অন ডেলিভারি", sub: "পণ্য পেয়ে টাকা দিন", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-100" },
  { id: "bkash", label: "বিকাশ", sub: "01XXXXXXXXX", icon: Smartphone, color: "text-pink-600", bg: "bg-pink-100" },
  { id: "nagad", label: "নগদ", sub: "01XXXXXXXXX", icon: Smartphone, color: "text-orange-600", bg: "bg-orange-100" },
  { id: "card", label: "ক্রেডিট / ডেবিট কার্ড", sub: "Visa, Mastercard", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100" },
];

const DISTRICTS = ["ঢাকার বাহিরে", "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ"];

/* ─────────────── StepBar ─────────────── */
function StepBar({ current }: { current: Step }) {
  return (
    <div className="animate-fade-in-down mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = current > step.id;
          const active = current === step.id;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${done ? "bg-[#e91e63] text-white shadow-sm" :
                  active ? "bg-[#0f172a] text-white shadow-md ring-4 ring-[#0f172a]/10" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`hidden text-[10px] font-semibold sm:block ${active ? "text-[#0f172a]" : done ? "text-[#e91e63]" : "text-slate-400"
                  }`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="relative mx-2 h-0.5 flex-1">
                  <div className="absolute inset-0 rounded-full bg-slate-100" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff4081] transition-all duration-500"
                    style={{ width: current > step.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Order Summary ─────────────── */
function OrderSummary({
  items, deliveryPrice, step, isCombo, isComboBund,
  discountAmount, discountType, discountConfigAmount, subtotal, minFreeDelivery,
  isActive,
  coupon, setCoupon, couponDiscount,
  onApplyCoupon, couponLoading, couponError,
}: {
  items: { productId: number; name: string; image: string; price: number; qty: number; itemType?: string; combo_items?: unknown[] }[];
  deliveryPrice: number; step: Step; isCombo: boolean; isComboBund: boolean;
  discountAmount: number; discountType: string; discountConfigAmount: number; subtotal: number; minFreeDelivery: number;
  isActive: boolean;
  coupon: string; setCoupon: (v: string) => void;
  couponDiscount: number; onApplyCoupon: () => void;
  couponLoading: boolean; couponError: string;
}) {
  const afterDiscount = subtotal - discountAmount;
  const total = afterDiscount + deliveryPrice - couponDiscount;

  return (
    <div className="shadow-card sticky top-24 rounded-2xl bg-white p-6">
      {/* Mode badge */}
      {isCombo ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#e91e63]/5 px-3 py-2.5">
          <Gift className="h-4 w-4 text-[#e91e63]" />
          <span className="text-xs font-semibold text-[#e91e63]">কম্বো অর্ডার</span>
          {discountConfigAmount > 0 && (<span className="ml-auto rounded-full bg-[#e91e63] px-2 py-0.5 text-[10px] font-bold text-white">{discountType === 'percent' ? `${discountConfigAmount}%` : `৳${discountConfigAmount}`} ছাড়</span>)}
        </div>
      ) : isComboBund ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2.5">
          <Gift className="h-4 w-4 text-[#e91e63]" />
          <span className="text-xs font-semibold text-[#e91e63]">🎁 কম্বো বান্ডেল অর্ডার</span>
          {discountConfigAmount > 0 && (<span className="ml-auto rounded-full bg-[#e91e63] px-2 py-0.5 text-[10px] font-bold text-white">{discountType === 'percent' ? `${discountConfigAmount}%` : `৳${discountConfigAmount}`} ছাড়</span>)}
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">কার্ট অর্ডার</span>
          {discountConfigAmount > 0 && isActive && (
            <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {discountType === 'percent' ? `${discountConfigAmount}%` : `৳${discountConfigAmount}`} ছাড়
            </span>
          )}
        </div>
      )}

      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#0f172a]">
        <Package className="h-4 w-4 text-[#e91e63]" />অর্ডার সামারি
        <span className="ml-auto text-xs font-normal text-slate-400">
          {items.reduce((s, i) => s + i.qty, 0)} টি পণ্য
        </span>
      </h3>

      {/* Items */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        {items.map((item) => {
          const lineTotal = item.price * item.qty;
          const isComboItem = !!(item as any).combo_items?.length;
          return (
            <div key={item.productId} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                  />
                  {isComboItem && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-[#e91e63] text-[8px] text-white font-bold">🎁</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#0f172a]">{item.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    BDT {item.price.toLocaleString()} × {item.qty}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-[#0f172a]">
                  BDT {lineTotal.toLocaleString()}
                </span>
              </div>
              {/* Combo sub-items */}
              {isComboItem && (
                <div className="ml-14 space-y-0.5">
                  {(item as any).combo_items.map((ci: any, j: number) => (
                    <p key={j} className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="text-slate-300">└</span>
                      {ci.name} <span className="font-semibold">×{ci.qty}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pricing breakdown */}
      <div className="mt-4 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>সাব-টোটাল</span>
          <span>BDT {subtotal.toLocaleString()}</span>
        </div>

        {discountAmount > 0 && isActive && (
          <div className="flex justify-between">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <Zap className="h-3 w-3" />
              {discountType === 'percent' ? `${discountConfigAmount}%` : `৳${discountConfigAmount}`} ডিসকাউন্ট
            </span>
            <span className="font-semibold text-emerald-600">
              −BDT {discountAmount.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-slate-500">ডেলিভারি চার্জ</span>
          <span className={deliveryPrice === 0 ? "font-semibold text-emerald-600" : "text-slate-700"}>
            {deliveryPrice === 0 ? "🎉 ফ্রি" : `BDT ${deliveryPrice.toLocaleString()}`}
          </span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between">
            <span className="flex items-center gap-1 text-[#e91e63]">
              <Tag className="h-3 w-3" />কুপন ছাড়
            </span>
            <span className="font-semibold text-[#e91e63]">−BDT {couponDiscount.toLocaleString()}</span>
          </div>
        )}

        {/* Free delivery progress */}
        {deliveryPrice > 0 && minFreeDelivery !== Infinity && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3">
            <p className="mb-1.5 text-[10px] font-medium text-emerald-700">
              আর BDT {Math.max(0, minFreeDelivery - afterDiscount).toLocaleString()} যোগ করলে ফ্রি ডেলিভারি!
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (afterDiscount / minFreeDelivery) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#0f172a] px-4 py-3">
        <span className="text-sm font-bold text-white">সর্বমোট</span>
        <span className="text-lg font-bold text-[#e91e63]">BDT {total.toLocaleString()}</span>
      </div>

      {/* Coupon input */}
      {step < 4 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <Tag className="h-3 w-3 text-[#e91e63]" />ডিসকাউন্ট কুপন আছে?
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="কোড লিখুন..."
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              className="input-field flex-1 py-2 text-[11px]"
            />
            <button
              onClick={onApplyCoupon}
              disabled={couponLoading || !coupon.trim()}
              className="shrink-0 rounded-lg bg-[#0f172a] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#e91e63] disabled:opacity-50 transition-colors"
            >
              {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
            </button>
          </div>
          {couponError && (
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-red-500">
              <AlertCircle className="h-3 w-3" />{couponError}
            </p>
          )}
          {couponDiscount > 0 && (
            <p className="mt-1.5 text-[10px] font-medium text-emerald-600">
              ✓ কুপন প্রযোজ্য! BDT {couponDiscount.toLocaleString()} ছাড়
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
        <Lock className="h-3 w-3" />SSL সুরক্ষিত চেকআউট
      </div>
    </div>
  );
}


/* ─────────────── Shared Input Field ─────────────── */
const LBL = "mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase";

function Field({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LBL}>{label}</label>
      <div className="relative">{children}</div>
    </div>
  );
}

/* =================== MAIN PAGE =================== */
function CheckoutContent() {
  const router = useRouter();
  const { items, orderMode, setOrderMode, subtotal, clearCart } = useOrder();
  const { config } = useShopConfig();
  const isCombo = orderMode === "combo";
  const isComboBund = orderMode === "combo-bundle";
  const cfg = isCombo ? config.combo : isComboBund ? config["combo-bundle"] ?? config.single : config.single;
  const pricing = useMemo(() => computePricing(subtotal, cfg), [subtotal, cfg]);

  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode") as "single" | "combo" | "combo-bundle" | null;

  // Sync orderMode from URL param on first render
  // (e.g. user navigates directly from cart or combo-builder)
  useEffect(() => {
    if (urlMode === "single" || urlMode === "combo" || urlMode === "combo-bundle") {
      setOrderMode(urlMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMode]);

  const [step, setStep] = useState<Step>(1);
  // Prevent empty-cart guard from kicking in after order is placed
  const submitted = useRef(false);

  // Derive dynamic delivery zones from config based on current orderMode's deliveryConfig
  const deliveryZones = useMemo(() => {
    // If rules are not active, fall back to default Delivery options
    if (!cfg.isActive) {
      return [{ id: "standard", label: "স্ট্যান্ডার্ড ডেলিভারি", time: "৩-৫ কার্যদিবস", charge: 60, minFree: Infinity }];
    }

    const globalZones = config.delivery_zones || [];
    const modeConfig = cfg.deliveryConfig || {};
    const commonMinFree = Number(cfg.minAmountForDiscount) || Infinity;

    // Filter zones that are enabled for the current order mode
    const activeZones = globalZones.filter((z: any) => modeConfig[z.id]?.enabled);

    if (activeZones.length === 0) {
      // Fallback
      return [{ id: "standard", label: "স্ট্যান্ডার্ড ডেলিভারি", time: "৩-৫ কার্যদিবস", charge: 60, minFree: Infinity }];
    }

    return activeZones.map((z: any) => ({
      id: z.id.toString(),
      label: z.name,
      time: z.days || "৩-৫ কার্যদিবস",
      charge: Number(z.charge) || 0,
      minFree: commonMinFree,
    }));
  }, [config, cfg.deliveryConfig, cfg.isActive, cfg.minAmountForDiscount]);

  const [deliveryMethod, setDelivery] = useState(deliveryZones[0]?.id || "standard");
  const [paymentMethod, setPayment] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [submitError, setSubmitError] = useState("");

  /* gift toggle — default ON for combo */
  const [isGift, setIsGift] = useState(isCombo);

  /* sender (buyer) info — always collected */
  const [sender, setSender] = useState({
    name: "", phone: "", district: "ঢাকার বাহিরে", address: "", whatsapp: "",
  });
  /* recipient info — only used when isGift is true */
  const [recipient, setRecipient] = useState({
    name: "", phone: "", district: "ঢাকার বাহিরে", address: "",
  });
  const [giftNote, setGiftNote] = useState("");

  const patchSender = (p: Partial<typeof sender>) => setSender(s => ({ ...s, ...p }));
  const patchRecipient = (p: Partial<typeof recipient>) => setRecipient(r => ({ ...r, ...p }));

  /* Redirect if cart is empty — but NOT after we've just placed an order */
  useEffect(() => {
    if (submitted.current) return;
    if (items.length === 0) {
      if (isCombo) router.replace("/combo-builder");
      else if (isComboBund) router.replace("/combo-bundles");
      else router.replace("/cart");
    }
  }, [items.length, isCombo, isComboBund, router]);

  /* Delivery price */
  const selectedDelivery = deliveryZones.find((d: any) => d.id === deliveryMethod) || deliveryZones[0];
  const isFreeDelivery = pricing.discountedSubtotal >= (selectedDelivery?.minFree || Infinity);
  const totalDelivery = isFreeDelivery ? 0 : (selectedDelivery?.charge ?? 0);
  const finalTotal = pricing.discountedSubtotal + totalDelivery - couponDiscount;

  /* API */
  const placeOrder = usePlaceOrder();
  const validateCoupon = useValidateCoupon();

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponError("");
    try {
      const res = await validateCoupon.mutateAsync({
        code: coupon, order_total: pricing.discountedSubtotal, order_mode: orderMode,
      });
      if (res.success) setCouponDiscount(res.discount);
      else setCouponError("কুপন কোড সঠিক নয়");
    } catch { setCouponError("কুপন প্রযোজ্য নয়"); }
  };

  /* Build payload — shipping address goes to recipient if gift, else sender */
  const shippingFor = isGift ? recipient : sender;

  const handlePlaceOrder = async () => {
    setSubmitError("");
    try {
      const result = await placeOrder.mutateAsync({
        order_mode: orderMode,
        items: items.map((i) => ({
          product_id: i.productId, name: i.name, slug: i.slug,
          price: i.price, original_price: i.originalPrice ?? i.price,
          image: i.image, qty: i.qty,
          item_type: i.itemType || 'product',
          ...(i.combo_items?.length ? { combo_items: i.combo_items } : {}),
        })),
        shipping_address: {
          name: shippingFor.name, phone: shippingFor.phone,
          city: shippingFor.district, address: shippingFor.address,
          whatsapp: sender.whatsapp || undefined,
        },
        payment_method: paymentMethod,
        delivery_type: deliveryMethod,
        coupon_code: coupon || undefined,
        note: isGift
          ? `[গিফট] প্রেরক: ${sender.name}${giftNote ? " | বার্তা: " + giftNote : ""}`
          : giftNote || undefined,
      });
      submitted.current = true;
      // Save order to sessionStorage so success page can display it instantly
      try { sessionStorage.setItem("last_order", JSON.stringify(result.order)); } catch { }
      clearCart();
      router.push(`/checkout/success?orderNumber=${result.order.order_number}&orderId=${result.order.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "অর্ডার সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
      router.push("/checkout/failed");
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, 4) as Step);
  const prev = () => setStep((s) => Math.max(s - 1, 1) as Step);

  if (!submitted.current && items.length === 0) return null;

  /* ── header ── */
  const backHref = isCombo ? "/combo-builder" : isComboBund ? "/combo-bundles" : "/cart";
  const backLabel = isCombo ? "কম্বো বিল্ডারে ফিরুন" : isComboBund ? "কম্বো বান্ডেলে ফিরুন" : "কার্টে ফিরুন";

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ─── Page Header ─── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={backHref} className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#e91e63]">
              <ArrowLeft className="h-3.5 w-3.5" />{backLabel}
            </Link>
            <h1 className="text-2xl font-bold text-[#0f172a]">নিরাপদ চেকআউট</h1>
          </div>
          <div className="hidden items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Lock className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">এনক্রিপ্টেড পেমেন্ট</p>
              <p className="text-[10px] text-emerald-600">SSL SECURED</p>
            </div>
          </div>
        </div>

        {/* ─── Step Bar ─── */}
        <StepBar current={step} />

        {/* ─── Source Badge ─── */}
        <div className={`mb-2 flex items-center gap-3 rounded-2xl border px-5 py-3.5 ${isCombo
          ? "border-[#e91e63]/20 bg-[#e91e63]/5"
          : "border-blue-200 bg-blue-50"
          }`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCombo ? "bg-[#e91e63]/10" : "bg-blue-100"
            }`}>
            <span className="text-lg">{isCombo ? "🎁" : "🛍️"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${isCombo ? "text-[#e91e63]" : "text-blue-700"}`}>
              {isCombo ? "কম্বো অর্ডার চেকআউট" : "কার্ট চেকআউট"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isCombo
                ? `${items.length}টি পণ্য • কম্বো ডিসকাউন্ট প্রযোজ্য`
                : `${items.length}টি পণ্য • সাধারণ অর্ডার`}
            </p>
          </div>
          <Link
            href={isCombo ? "/combo-builder" : "/cart"}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors ${isCombo
              ? "bg-[#e91e63]/10 text-[#e91e63] hover:bg-[#e91e63]/20"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
          >
            {isCombo ? "← কম্বো বিল্ডার" : "← কার্ট"}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── CONTENT ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* ════ STEP 1: তথ্য ════ */}
            {step === 1 && (
              <div className="animate-fade-in-up space-y-5">

                {/* ── Sender / Buyer Card ── */}
                <div className="shadow-card overflow-hidden rounded-2xl bg-white">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f172a]/8 bg-[#0f172a]/5">
                        <User className="h-4 w-4 text-[#0f172a]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0f172a]">আপনার তথ্য</h2>
                        <p className="text-xs text-slate-400">অর্ডারকারীর তথ্য দিন</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Name */}
                      <div>
                        <label className={LBL}>আপনার নাম *</label>
                        <div className="relative">
                          <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="পূর্ণ নাম লিখুন"
                            value={sender.name} onChange={(e) => patchSender({ name: e.target.value })}
                            className="input-field pl-10" />
                        </div>
                      </div>
                      {/* Phone */}
                      <div>
                        <label className={LBL}>মোবাইল নম্বর *</label>
                        <div className="relative">
                          <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="tel" placeholder="01XXXXXXXXX"
                            value={sender.phone} onChange={(e) => patchSender({ phone: e.target.value })}
                            className="input-field pl-10" />
                        </div>
                      </div>
                    </div>

                    {/* Delivery address — only when NOT a gift */}
                    {!isGift && (
                      <div className="mt-5 space-y-5 animate-fade-in-up">
                        <div>
                          <label className={LBL}>জেলা *</label>
                          <div className="relative">
                            <MapPin className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select value={sender.district} onChange={(e) => patchSender({ district: e.target.value })}
                              className="input-field appearance-none pl-10 pr-10">
                              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className={LBL}>ডেলিভারি ঠিকানা *</label>
                          <div className="relative">
                            <Home className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                            <textarea placeholder="বাসা নম্বর, রোড, এলাকা, থানা..." rows={3}
                              value={sender.address} onChange={(e) => patchSender({ address: e.target.value })}
                              className="input-field resize-none pl-10" />
                          </div>
                        </div>
                        <div>
                          <label className={LBL}>WhatsApp নম্বর <span className="normal-case font-normal text-slate-400">(ঐচ্ছিক)</span></label>
                          <div className="relative">
                            <MessageCircle className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                            <input type="tel" placeholder="01XXXXXXXXX"
                              value={sender.whatsapp} onChange={(e) => patchSender({ whatsapp: e.target.value })}
                              className="input-field pl-10" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Gift Toggle Card ── */}
                <button
                  type="button"
                  onClick={() => setIsGift(!isGift)}
                  className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-300 ${isGift
                    ? "border-[#e91e63] bg-gradient-to-r from-[#e91e63]/5 to-pink-50/50 shadow-sm shadow-[#e91e63]/10"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-all duration-300 ${isGift ? "bg-[#e91e63]/10" : "bg-slate-100"
                      }`}>
                      🎁
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold transition-colors ${isGift ? "text-[#e91e63]" : "text-[#0f172a]"}`}>
                        প্রিয়জনকে গিফট করছি?
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                        {isGift
                          ? "✓ প্রিয়জনের ঠিকানায় সরাসরি পাঠানো হবে"
                          : "চালু করলে আলাদা প্রাপকের ঠিকানা দিতে পারবেন"}
                      </p>
                    </div>

                    {/* iOS-style toggle switch */}
                    <div className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-300 ${isGift
                      ? "border-[#e91e63] bg-[#e91e63]"
                      : "border-slate-200 bg-slate-200"
                      }`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${isGift ? "left-[22px]" : "left-0.5"
                        }`} />
                    </div>
                  </div>

                  {/* Active state: "Gift" label pill */}
                  {isGift && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="h-px flex-1 bg-[#e91e63]/15" />
                      <span className="rounded-full bg-[#e91e63]/10 px-3 py-0.5 text-[10px] font-semibold text-[#e91e63]">
                        🎀 গিফট মোড চালু — নিচে প্রিয়জনের তথ্য দিন
                      </span>
                      <span className="h-px flex-1 bg-[#e91e63]/15" />
                    </div>
                  )}
                </button>

                {/* Recipient form — animated expansion */}
                {isGift && (
                  <div className="animate-fade-in-up border-t border-[#e91e63]/10 px-6 pb-6 pt-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[10px] font-semibold tracking-wider text-[#e91e63] uppercase">
                        প্রিয়জনের তথ্য
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className={LBL}>প্রিয়জনের নাম *</label>
                        <div className="relative">
                          <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="পূর্ণ নাম"
                            value={recipient.name} onChange={(e) => patchRecipient({ name: e.target.value })}
                            className="input-field pl-10" />
                        </div>
                      </div>
                      <div>
                        <label className={LBL}>প্রিয়জনের ফোন *</label>
                        <div className="relative">
                          <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="tel" placeholder="01XXXXXXXXX"
                            value={recipient.phone} onChange={(e) => patchRecipient({ phone: e.target.value })}
                            className="input-field pl-10" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className={LBL}>জেলা *</label>
                      <div className="relative">
                        <MapPin className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select value={recipient.district} onChange={(e) => patchRecipient({ district: e.target.value })}
                          className="input-field appearance-none pl-10 pr-10">
                          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className={LBL}>ডেলিভারি ঠিকানা *</label>
                      <div className="relative">
                        <Home className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                        <textarea placeholder="বাসা নম্বর, রোড, এলাকা, থানা..." rows={3}
                          value={recipient.address} onChange={(e) => patchRecipient({ address: e.target.value })}
                          className="input-field resize-none pl-10" />
                      </div>
                    </div>

                    {/* sender address when gift */}
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        প্রেরকের ঠিকানা (আপনার)
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LBL}>জেলা</label>
                          <div className="relative">
                            <MapPin className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select value={sender.district} onChange={(e) => patchSender({ district: e.target.value })}
                              className="input-field appearance-none pl-10 pr-10">
                              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className={LBL}>WhatsApp (ঐচ্ছিক)</label>
                          <div className="relative">
                            <MessageCircle className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                            <input type="tel" placeholder="01XXXXXXXXX"
                              value={sender.whatsapp} onChange={(e) => patchSender({ whatsapp: e.target.value })}
                              className="input-field pl-10" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gift note */}
                    <div className="mt-5">
                      <label className={LBL}>গিফট বার্তা <span className="normal-case font-normal text-slate-400">(ঐচ্ছিক)</span></label>
                      <div className="relative">
                        <FileText className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                        <textarea placeholder="প্রিয়জনের জন্য বিশেষ কোনো বার্তা..." rows={2}
                          value={giftNote} onChange={(e) => setGiftNote(e.target.value)}
                          className="input-field resize-none pl-10" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Note for non-gift */}
                {!isGift && (
                  <div className="shadow-card animate-fade-in-up rounded-2xl bg-white p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <h2 className="text-sm font-semibold text-[#0f172a]">বিশেষ নোট <span className="text-xs font-normal text-slate-400">(ঐচ্ছিক)</span></h2>
                    </div>
                    <textarea placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন..." rows={2}
                      value={giftNote} onChange={(e) => setGiftNote(e.target.value)}
                      className="input-field resize-none" />
                  </div>
                )}

              </div>
            )}

            {/* ════ STEP 2: ডেলিভারি ════ */}
            {step === 2 && (
              <div className="shadow-card animate-fade-in-up overflow-hidden rounded-2xl bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                      <Truck className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0f172a]">ডেলিভারি পদ্ধতি</h2>
                      <p className="text-xs text-slate-400">পছন্দের ডেলিভারি বেছে নিন</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-6">
                  {deliveryZones.map((opt: any) => {
                    const sel = deliveryMethod === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setDelivery(opt.id)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${sel ? "border-[#e91e63] bg-[#e91e63]/5" : "border-slate-200 hover:border-slate-300"}`}>
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100`}>
                            <Truck className={`h-5 w-5 text-slate-600`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${sel ? "text-[#e91e63]" : "text-[#0f172a]"}`}>{opt.label}</p>
                            <p className="text-xs text-slate-400">{opt.time}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${isFreeDelivery ? "text-emerald-600" : "text-[#0f172a]"}`}>
                              {isFreeDelivery ? "ফ্রি" : `BDT ${opt.charge}`}
                            </span>
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${sel ? "border-[#e91e63] bg-[#e91e63]" : "border-slate-300"}`}>
                              {sel && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mx-6 mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700">আনুমানিক ডেলিভারি সময়</p>
                    <p className="mt-0.5 text-xs text-blue-600">{selectedDelivery?.time || "৩-৫ কার্যদিবস"} — সরাসরি আপনার ঠিকানায়।</p>
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 3: পেমেন্ট ════ */}
            {step === 3 && (
              <div className="shadow-card animate-fade-in-up overflow-hidden rounded-2xl bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                      <CreditCard className="h-4.5 w-4.5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0f172a]">পেমেন্ট পদ্ধতি</h2>
                      <p className="text-xs text-slate-400">সুবিধাজনক উপায়ে পেমেন্ট করুন</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-6">
                  {paymentMethods.map((pm) => {
                    const Icon = pm.icon;
                    const sel = paymentMethod === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPayment(pm.id)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${sel ? "border-[#e91e63] bg-[#e91e63]/5" : "border-slate-200 hover:border-slate-300"}`}>
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pm.bg}`}>
                            <Icon className={`h-5 w-5 ${pm.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${sel ? "text-[#e91e63]" : "text-[#0f172a]"}`}>{pm.label}</p>
                            <p className="text-xs text-slate-400">{pm.sub}</p>
                          </div>
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${sel ? "border-[#e91e63] bg-[#e91e63]" : "border-slate-300"}`}>
                            {sel && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {paymentMethod === "card" && (
                    <div className="animate-scale-in mt-2 space-y-4 rounded-xl bg-slate-50 p-4">
                      <div>
                        <label className={LBL}>কার্ড নম্বর</label>
                        <div className="relative">
                          <CreditCard className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} className="input-field pl-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LBL}>মেয়াদ (MM/YY)</label>
                          <input type="text" placeholder="MM/YY" maxLength={5} className="input-field" />
                        </div>
                        <div>
                          <label className={LBL}>CVV</label>
                          <input type="text" placeholder="123" maxLength={3} className="input-field" />
                        </div>
                      </div>
                    </div>
                  )}

                  {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                    <div className="animate-scale-in mt-2 rounded-xl border border-pink-100 bg-pink-50 p-4">
                      <p className="mb-2 text-xs font-semibold text-pink-700">পেমেন্ট নির্দেশনা</p>
                      <ol className="space-y-1.5 text-xs text-pink-600">
                        <li>১. {paymentMethod === "bkash" ? "বিকাশ" : "নগদ"} অ্যাপ থেকে Send Money করুন</li>
                        <li>২. নম্বর: <span className="font-bold">01712-345678</span></li>
                        <li>৩. রেফারেন্সে আপনার নাম লিখুন</li>
                        <li>৪. অর্ডার confirm করলে আমরা verify করব</li>
                      </ol>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    পেমেন্ট তথ্য SSL এনক্রিপ্টেড ও সুরক্ষিত
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 4: রিভিউ ════ */}
            {step === 4 && (
              <div className="animate-fade-in-up space-y-4">
                {/* Header */}
                <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/20">
                      <ShieldCheck className="h-5 w-5 text-[#e91e63]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">অর্ডার রিভিউ করুন</p>
                      <p className="text-xs text-slate-400">কনফার্ম করার আগে সব তথ্য দেখুন</p>
                    </div>
                  </div>
                </div>

                {/* Buyer info */}
                <div className="shadow-card rounded-2xl bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      <User className="h-3.5 w-3.5" />আপনার তথ্য
                    </h3>
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline">
                      <Edit3 className="h-3 w-3" />সম্পাদন
                    </button>
                  </div>
                  <div className="space-y-1 text-sm text-[#0f172a]">
                    <p><span className="text-xs text-slate-400">নাম: </span>{sender.name || "—"}</p>
                    <p><span className="text-xs text-slate-400">ফোন: </span>{sender.phone || "—"}</p>
                    {!isGift && <>
                      <p><span className="text-xs text-slate-400">জেলা: </span>{sender.district}</p>
                      <p><span className="text-xs text-slate-400">ঠিকানা: </span>{sender.address || "—"}</p>
                    </>}
                  </div>
                </div>

                {/* Gift / recipient info */}
                {isGift && (
                  <div className="shadow-card rounded-2xl border border-[#e91e63]/10 bg-[#e91e63]/3 p-5  bg-[#e91e63]/[0.03]">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#e91e63] uppercase">
                        <Gift className="h-3.5 w-3.5" />গিফট — প্রিয়জনের তথ্য
                      </h3>
                      <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline">
                        <Edit3 className="h-3 w-3" />সম্পাদন
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-[#0f172a]">
                      <p><span className="text-xs text-slate-400">নাম: </span>{recipient.name || "—"}</p>
                      <p><span className="text-xs text-slate-400">ফোন: </span>{recipient.phone || "—"}</p>
                      <p><span className="text-xs text-slate-400">জেলা: </span>{recipient.district}</p>
                      <p><span className="text-xs text-slate-400">ঠিকানা: </span>{recipient.address || "—"}</p>
                      {giftNote && <p><span className="text-xs text-slate-400">বার্তা: </span>{giftNote}</p>}
                    </div>
                  </div>
                )}

                {/* Delivery review */}
                <div className="shadow-card rounded-2xl bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      <Truck className="h-3.5 w-3.5" />ডেলিভারি
                    </h3>
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline">
                      <Edit3 className="h-3 w-3" />সম্পাদন
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">{selectedDelivery.label}</p>
                      <p className="text-xs text-slate-400">{selectedDelivery.time}</p>
                    </div>
                    <span className={`ml-auto text-sm font-bold ${totalDelivery === 0 ? "text-emerald-600" : "text-[#0f172a]"}`}>
                      {totalDelivery === 0 ? "🎉 ফ্রি" : `৳${totalDelivery}`}
                    </span>
                  </div>
                </div>

                {/* Payment review */}
                <div className="shadow-card rounded-2xl bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      <CreditCard className="h-3.5 w-3.5" />পেমেন্ট
                    </h3>
                    <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline">
                      <Edit3 className="h-3 w-3" />সম্পাদন
                    </button>
                  </div>
                  {(() => {
                    const pm = paymentMethods.find((p) => p.id === paymentMethod)!;
                    const Icon = pm?.icon;
                    return (
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${pm?.bg}`}>
                          <Icon className={`h-4 w-4 ${pm?.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{pm?.label}</p>
                          <p className="text-xs text-slate-400">{pm?.sub}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Final total */}
                <div className="rounded-2xl border-2 border-[#e91e63]/20 bg-[#e91e63]/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">সর্বমোট পরিমাণ</p>
                      <p className="text-2xl font-bold text-[#e91e63]">BDT {finalTotal.toLocaleString()}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{items.reduce((s, i) => s + i.qty, 0)} টি পণ্য</p>
                      <p>{selectedDelivery.label}</p>
                      {isGift && <p className="mt-0.5 rounded-full bg-[#e91e63]/10 px-2 py-0.5 text-[#e91e63]">🎁 গিফট</p>}
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />{submitError}
                  </div>
                )}
              </div>
            )}

            {/* ─── Navigation Buttons ─── */}
            <div className="flex gap-3">
              {step > 1 && (
                <button onClick={prev} className="btn-outline flex items-center gap-2 px-6 py-3 text-sm">
                  <ArrowLeft className="h-4 w-4" />পূর্ববর্তী
                </button>
              )}
              {step < 4 ? (
                <button onClick={next} className="btn-pink flex flex-1 items-center justify-center gap-2 py-3.5 text-sm">
                  পরবর্তী ধাপ<ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={handlePlaceOrder} disabled={placeOrder.isPending}
                  className="btn-pink flex flex-1 items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-70">
                  {placeOrder.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />প্রসেস হচ্ছে...</>
                  ) : (
                    <><ShieldCheck className="h-4.5 w-4.5" />অর্ডার কনফার্ম করুন<ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── STICKY SUMMARY (right column) ── */}

          <div className="animate-fade-in-right sticky top-8 self-start">
            <OrderSummary
              items={items}
              deliveryPrice={totalDelivery}
              step={step}
              isCombo={isCombo}
              isComboBund={isComboBund}
              discountAmount={pricing.discountAmount}
              discountType={cfg.discountType}
              discountConfigAmount={cfg.discountAmount}
              isActive={cfg.isActive}
              subtotal={pricing.subtotal}
              minFreeDelivery={selectedDelivery?.minFree || Infinity}
              coupon={coupon}
              setCoupon={setCoupon}
              couponDiscount={couponDiscount}
              onApplyCoupon={handleApplyCoupon}
              couponLoading={validateCoupon.isPending}
              couponError={couponError}
            />
          </div>

        </div> {/* end grid */}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fc]" />}>
      <CheckoutContent />
    </Suspense>
  );
}
