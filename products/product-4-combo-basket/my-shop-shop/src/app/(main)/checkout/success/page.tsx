"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2, ShoppingBag, Package, Truck, Home,
  Copy, Gift, MapPin, Phone, CreditCard, Loader2,
  ArrowRight, Star,
} from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";

/* ─── Confetti ─── */
function Confetti() {
  const colors = ["#e91e63", "#9c27b0", "#ff4081", "#0f172a", "#ff9800", "#00bcd4"];
  const pieces = Array.from({ length: 36 });
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {pieces.map((_, i) => (
        <div key={i} className="absolute top-0 rounded-sm opacity-0"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 1.5}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { opacity: 1; transform: translateY(-10px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── Mode badge configs ─── */
const MODE_BADGE: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  single: { label: "সিঙ্গেল অর্ডার", icon: "🛍️", color: "text-blue-700", bg: "bg-blue-50 border border-blue-200" },
  combo: { label: "কম্বো বিল্ডার অর্ডার", icon: "🔀", color: "text-pink-700", bg: "bg-pink-50 border border-pink-200" },
  "combo-bundle": { label: "কম্বো বান্ডেল অর্ডার", icon: "🎁", color: "text-purple-700", bg: "bg-purple-50 border border-purple-200" },
};

const PAY_BN: Record<string, string> = {
  cod: "ক্যাশ অন ডেলিভারি", bkash: "বিকাশ", nagad: "নগদ", card: "কার্ড",
};

/* ─── Inner component (uses useSearchParams — requires Suspense) ─── */
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") ?? "";
  const orderId = Number(searchParams.get("orderId") ?? "0");
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  /* Read order from sessionStorage (saved right before redirect in checkout) */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("last_order");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Use it if it matches the current order id or number
        if (parsed?.id === orderId || parsed?.order_number === orderNumber) {
          setOrder(parsed);
          setLoading(false);
          return;
        }
      }
    } catch { }
    // If sessionStorage failed, try API
    if (!orderId) { setLoading(false); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("shop_token") : null;
    if (!token) { setLoading(false); return; }

    fetch(`/api/orders/my/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d?.order) setOrder(d.order); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [orderId, orderNumber]);

  const copy = () => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const modeBadge = MODE_BADGE[order?.order_mode ?? "single"] ?? MODE_BADGE.single;
  const isComboType = order?.order_mode === "combo" || order?.order_mode === "combo-bundle";

  return (
    <div className="relative min-h-screen bg-[#f8f9fc]">
      <Confetti />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">

        {/* ─── Hero Card ─── */}
        <div className="animate-fade-in-down rounded-3xl bg-white shadow-2xl overflow-hidden">

          {/* Top dark banner */}
          <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">অর্ডার সফল হয়েছে! 🎉</h1>
            <p className="mt-2 text-sm text-slate-400">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।</p>

            {/* Order number */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 backdrop-blur-sm">
              <span className="font-mono text-base font-bold text-white">{orderNumber || "—"}</span>
              <button
                onClick={copy}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="কপি করুন"
              >
                {copied
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* ─── Content ─── */}
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-7 w-7 animate-spin text-[#e91e63]" />
            </div>
          ) : !order ? (
            /* No order data — show minimal success view */
            <div className="px-6 py-10 text-center space-y-3">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="text-sm font-semibold text-[#0f172a]">
                অর্ডার নম্বর: <span className="font-mono">{orderNumber}</span>
              </p>
              <p className="text-xs text-slate-400">আপনার অর্ডার সম্পর্কে বিস্তারিত জানতে অর্ডার ট্র্যাক করুন।</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">

              {/* Mode badge */}
              <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${modeBadge.bg}`}>
                <span className="text-lg">{modeBadge.icon}</span>
                <span className={`text-sm font-semibold ${modeBadge.color}`}>{modeBadge.label}</span>
                {Number(order.discount_amount) > 0 && (
                  <span className="ml-auto rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    ৳{Number(order.discount_amount).toLocaleString()} সাশ্রয়!
                  </span>
                )}
              </div>

              {/* Items list */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 border-b border-slate-100">
                  <Package className="h-4 w-4 text-[#e91e63]" />
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    অর্ডার করা পণ্য ({Array.isArray(order.items) ? order.items.length : 0} টি)
                  </h3>
                </div>

                <div className="divide-y divide-slate-50">
                  {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => {
                    const isComboItem = item.item_type === "combo" || (Array.isArray(item.combo_items) && item.combo_items.length > 0);
                    return (
                      <div key={i} className="flex flex-col gap-1.5 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                            {item.image ? (
                              <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-slate-300" />
                              </div>
                            )}
                            {isComboItem && (
                              <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-[#e91e63] text-[9px]">🎁</span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium text-[#0f172a] truncate">{item.name}</p>
                              {isComboItem && (
                                <span className="shrink-0 text-[10px] font-semibold bg-pink-50 text-[#e91e63] border border-pink-200 px-1.5 py-0.5 rounded-full">
                                  কম্বো বান্ডেল
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              ৳{Number(item.price).toLocaleString()} × {item.qty}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#0f172a] shrink-0">
                            ৳{(Number(item.price) * Number(item.qty)).toLocaleString()}
                          </span>
                        </div>
                        {/* Combo sub-items */}
                        {isComboItem && Array.isArray(item.combo_items) && item.combo_items.length > 0 && (
                          <div className="ml-14 space-y-1 border-l-2 border-pink-100 pl-3">
                            {item.combo_items.map((ci: any, j: number) => (
                              <p key={j} className="text-[11px] text-slate-400 flex items-center gap-1.5">
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
                <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs">
                  {[
                    { label: "সাব-টোটাল", value: `৳${Number(order.subtotal ?? 0).toLocaleString()}`, color: "text-slate-500" },
                    Number(order.discount_amount) > 0 ? { label: `ডিসকাউন্ট${isComboType ? " (কম্বো)" : ""}`, value: `-৳${Number(order.discount_amount).toLocaleString()}`, color: "text-emerald-600 font-medium" } : null,
                    Number(order.coupon_discount) > 0 ? { label: `কুপন (${order.coupon_code || ""})`, value: `-৳${Number(order.coupon_discount).toLocaleString()}`, color: "text-emerald-600 font-medium" } : null,
                    { label: "ডেলিভারি", value: Number(order.delivery_charge) === 0 ? "ফ্রি 🎉" : `৳${Number(order.delivery_charge).toLocaleString()}`, color: "text-slate-500" },
                  ].filter(Boolean).map((row: any, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-slate-500">{row.label}</span>
                      <span className={row.color}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                    <span className="text-[#0f172a]">সর্বমোট</span>
                    <span className="text-[#e91e63]">৳{Number(order.total ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping + Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-[#e91e63]" />
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ডেলিভারি</p>
                  </div>
                  <p className="text-xs font-semibold text-[#0f172a]">{order.shipping_name || "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{order.shipping_address || "—"}</p>
                  {order.shipping_city && <p className="text-xs text-slate-400">{order.shipping_city}</p>}
                  {order.shipping_phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="h-3 w-3" /> {order.shipping_phone}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-[#e91e63]" />
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">পেমেন্ট</p>
                  </div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    {PAY_BN[order.payment_method ?? ""] ?? (order.payment_method || "—")}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${order.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                    {order.payment_status === "paid" ? "✅ পেইড" : "⏳ পরিশোধ বাকি"}
                  </p>
                </div>
              </div>

              {/* Delivery time banner */}
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <Truck className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-700">ডেলিভারির সময়</p>
                  <p className="text-xs text-blue-500 mt-0.5">সাধারণত ৩–৫ কার্যদিবসের মধ্যে পৌঁছায়। SMS / WhatsApp-এ জানানো হবে।</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/account/orders"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] py-3 text-sm font-semibold text-white hover:bg-[#e91e63] transition-all">
                <Package className="h-4 w-4" /> অর্ডার ট্র্যাক করুন <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/products"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:border-[#e91e63] hover:text-[#e91e63] transition-all">
                <ShoppingBag className="h-4 w-4" /> কেনাকাটা চালিয়ে যান
              </Link>
            </div>
          </div>
        </div>

        {/* Rating nudge */}
        <div className="animate-fade-in-up mt-4 rounded-2xl bg-white border border-slate-100 p-5 text-center shadow-sm"
          style={{ animationDelay: "300ms" }}>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className="h-5 w-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-sm font-semibold text-[#0f172a] mb-0.5">আমাদের সার্ভিস কেমন লাগলো?</p>
          <p className="text-xs text-slate-400">আপনার মতামত আমাদের উন্নতিতে সাহায্য করে।</p>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc]">
        <Loader2 className="h-7 w-7 animate-spin text-[#e91e63]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
