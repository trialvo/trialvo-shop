"use client";

import Link from "next/link";
import {
  ArrowLeft, Package, Truck, CheckCircle2, MapPin, Phone,
  Receipt, MessageCircle, Clock, XCircle, Loader2, Gift,
} from "lucide-react";
import { useOrderDetail } from "@/api/orders";
import { getImageUrl } from "@/lib/imageUrl";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "অপেক্ষমান", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  confirmed: { label: "নিশ্চিত", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle2 },
  processing: { label: "প্রক্রিয়াধীন", color: "text-violet-600", bg: "bg-violet-100", icon: Package },
  shipped: { label: "শিপড", color: "text-indigo-600", bg: "bg-indigo-100", icon: Truck },
  delivered: { label: "ডেলিভারড", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle2 },
  cancelled: { label: "বাতিল", color: "text-red-500", bg: "bg-red-100", icon: XCircle },
};

const PAYMENT_BN: Record<string, string> = {
  cod: "ক্যাশ অন ডেলিভারি", bkash: "বিকাশ", nagad: "নগদ", card: "কার্ড",
};
const PAY_STATUS_BN: Record<string, string> = {
  pending: "⏳ বাকি", paid: "✅ পেইড", failed: "❌ ব্যর্থ", refunded: "↩ রিফান্ড",
};

const TIMELINE_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];
const TIMELINE_LABELS: Record<string, string> = {
  pending: "অর্ডার হয়েছে", confirmed: "নিশ্চিত", processing: "প্যাকেজিং", shipped: "শিপমেন্ট", delivered: "ডেলিভারড",
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const orderId = Number(params.id);
  const { data, isLoading } = useOrderDetail(isNaN(orderId) ? null : orderId);
  const o = data?.order;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#e91e63]" />
      </div>
    );
  }

  if (!o) {
    return (
      <div className="shadow-card rounded-2xl bg-white py-16 text-center text-sm text-slate-400">
        অর্ডার পাওয়া যায়নি।
        <br />
        <Link href="/account/orders" className="mt-4 inline-block text-[#e91e63] underline text-xs">
          ← অর্ডার লিস্টে ফিরুন
        </Link>
      </div>
    );
  }

  const status = (o.status as OrderStatus) || "pending";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const currentIdx = TIMELINE_STEPS.indexOf(status);
  const isComboOrder = o.order_mode === "combo" || o.items?.some((i) => i.item_type === "combo");

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="animate-fade-in-down">
        <Link
          href="/account/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#e91e63]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> অর্ডার লিস্টে ফিরুন
        </Link>

        <div className="shadow-card rounded-2xl bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e91e63]/10">
                {isComboOrder ? <Gift className="h-5 w-5 text-[#e91e63]" /> : <Package className="h-5 w-5 text-[#e91e63]" />}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a] font-mono">{o.order_number}</p>
                <p className="text-xs text-slate-400">
                  {o.created_at ? new Date(o.created_at).toLocaleString("bn-BD") : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
              </span>
              {isComboOrder && (
                <span className="rounded-full bg-pink-50 border border-pink-200 px-2.5 py-1 text-[10px] font-semibold text-[#e91e63]">
                  🎁 কম্বো অর্ডার
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left — items + timeline */}
        <div className="space-y-5 lg:col-span-3">
          {/* Items */}
          <div className="shadow-card animate-fade-in-up rounded-2xl bg-white">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e91e63]/10">
                <Package className="h-3.5 w-3.5 text-[#e91e63]" />
              </div>
              <h3 className="text-sm font-semibold text-[#0f172a]">
                অর্ডারের পণ্য ({o.items?.length ?? 0} টি)
              </h3>
            </div>
            <div className="divide-y divide-slate-50 px-5">
              {(o.items ?? []).map((item, i) => {
                const isComboItem = item.item_type === "combo" || (item.combo_items?.length ?? 0) > 0;
                return (
                  <div key={i} className="flex flex-col gap-2 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        {isComboItem && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-[#e91e63] text-[9px]">🎁</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-[#0f172a] leading-tight truncate">{item.name}</p>
                          {isComboItem && (
                            <span className="shrink-0 text-[10px] font-semibold bg-pink-50 text-[#e91e63] border border-pink-200 px-1.5 py-0.5 rounded-full">কম্বো</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">৳{Number(item.price).toLocaleString()} × {item.qty}</p>
                      </div>
                      <span className="text-sm font-bold text-[#0f172a] shrink-0">
                        ৳{Number((item.price || 0) * (item.qty || 1)).toLocaleString()}
                      </span>
                    </div>
                    {/* Combo sub-items */}
                    {isComboItem && (item.combo_items?.length ?? 0) > 0 && (
                      <div className="ml-14 space-y-1 border-l-2 border-pink-100 pl-3">
                        {item.combo_items!.map((ci, j) => (
                          <div key={j} className="flex items-center gap-2">
                            {ci.image && (
                              <img src={getImageUrl(ci.image)} alt="" className="h-5 w-5 rounded-md object-cover border border-slate-100 shrink-0" />
                            )}
                            <span className="text-xs text-slate-500 flex-1 truncate">{ci.name}</span>
                            <span className="text-xs font-semibold text-slate-400 shrink-0">×{ci.qty}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Pricing */}
            <div className="space-y-1.5 border-t border-slate-100 px-5 py-4 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>সাব-টোটাল</span>
                <span>৳{Number(o.subtotal ?? 0).toLocaleString()}</span>
              </div>
              {Number(o.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>ডিসকাউন্ট</span>
                  <span>-৳{Number(o.discount_amount).toLocaleString()}</span>
                </div>
              )}
              {Number(o.coupon_discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>কুপন ({o.coupon_code})</span>
                  <span>-৳{Number(o.coupon_discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>ডেলিভারি</span>
                <span>{Number(o.delivery_charge) === 0 ? "ফ্রি 🎉" : `৳${Number(o.delivery_charge).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-[#0f172a]">
                <span>সর্বমোট</span>
                <span className="text-[#e91e63]">৳{Number(o.total ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          {status !== "cancelled" && (
            <div className="shadow-card animate-fade-in-up rounded-2xl bg-white" style={{ animationDelay: "60ms" }}>
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
                  <Truck className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h3 className="text-sm font-semibold text-[#0f172a]">ডেলিভারি অগ্রগতি</h3>
              </div>
              <div className="px-5 py-4">
                <div className="flex gap-1">
                  {TIMELINE_STEPS.map((step, i) => {
                    const isDone = i <= currentIdx;
                    return (
                      <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] transition-all ${isDone ? "border-[#e91e63] bg-[#e91e63] text-white" : "border-slate-200 bg-white text-slate-400"}`}>
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        <span className={`text-center text-[9px] font-medium leading-tight ${isDone ? "text-[#e91e63]" : "text-slate-400"}`}>
                          {TIMELINE_LABELS[step]}
                        </span>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className="absolute" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — address, payment, help */}
        <div className="space-y-5 lg:col-span-2">
          {/* Delivery Address */}
          <div className="shadow-card animate-fade-in-up rounded-2xl bg-white">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-[#0f172a]">ডেলিভারি ঠিকানা</h3>
            </div>
            <div className="px-5 py-4 space-y-1.5 text-xs">
              <p className="font-semibold text-[#0f172a]">{o.shipping_name || "—"}</p>
              <p className="text-slate-500 leading-relaxed">{o.shipping_address || "—"}</p>
              {o.shipping_city && <p className="text-slate-500">{o.shipping_city}</p>}
              {o.shipping_phone && (
                <div className="flex items-center gap-1.5 text-slate-400 pt-1">
                  <Phone className="h-3.5 w-3.5" /> {o.shipping_phone}
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="shadow-card animate-fade-in-up rounded-2xl bg-white">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <Receipt className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-[#0f172a]">পেমেন্ট</h3>
            </div>
            <div className="space-y-2 px-5 py-4 text-xs">
              {[
                { label: "পদ্ধতি", value: PAYMENT_BN[o.payment_method ?? ""] ?? (o.payment_method || "—") },
                { label: "স্ট্যাটাস", value: PAY_STATUS_BN[o.payment_status ?? ""] ?? o.payment_status ?? "—" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="font-medium text-[#0f172a]">{row.value}</span>
                </div>
              ))}
              {o.notes && (
                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 italic">
                  📝 {o.notes}
                </p>
              )}
            </div>
          </div>

          {/* Help */}
          <div className="animate-fade-in-up rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5" style={{ animationDelay: "120ms" }}>
            <p className="mb-1 text-xs font-semibold text-white">অর্ডারে সমস্যা?</p>
            <p className="mb-3 text-[11px] text-slate-400">আমরা সাহায্য করতে প্রস্তুত।</p>
            <Link
              href="/contact"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#e91e63] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#d81b60]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> সাপোর্টে যোগাযোগ করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
