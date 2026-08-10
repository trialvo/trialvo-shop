"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Search, ChevronRight, Package, Truck,
  CheckCircle2, Clock, XCircle, Eye, Loader2, Gift,
} from "lucide-react";
import { useMyOrders, type MyOrder } from "@/api/orders";
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

const FILTER_TABS = ["সকল", "অপেক্ষমান", "প্রক্রিয়াধীন", "শিপড", "ডেলিভারড", "বাতিল"];
const TAB_TO_STATUS: Record<string, string> = {
  "অপেক্ষমান": "pending", "প্রক্রিয়াধীন": "processing",
  "শিপড": "shipped", "ডেলিভারড": "delivered", "বাতিল": "cancelled",
};

function OrderCard({ order }: { order: MyOrder }) {
  const status = (order.status as OrderStatus) || "pending";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const isCombo = order.order_mode === "combo" || order.items?.some((i) => i.item_type === "combo");
  const firstItem = order.items?.[0];
  const previewNames = order.items
    ?.slice(0, 2)
    .map((i) => i.name)
    .join(", ");
  const extraCount = (order.items?.length ?? 0) - 2;

  return (
    <div className="shadow-card animate-fade-in-up hover:shadow-card-hover rounded-2xl bg-white transition-shadow duration-200">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left */}
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
            {firstItem?.image ? (
              <img src={getImageUrl(firstItem.image)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-slate-300" />
              </div>
            )}
            {isCombo && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#e91e63] text-[10px]">🎁</span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#0f172a] font-mono">{order.order_number}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                <StatusIcon className="inline h-3 w-3 mr-0.5" />
                {cfg.label}
              </span>
              {isCombo && (
                <span className="rounded-full bg-pink-50 border border-pink-200 px-2 py-0.5 text-[10px] font-semibold text-[#e91e63]">
                  🎁 কম্বো
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {order.created_at ? new Date(order.created_at).toLocaleDateString("bn-BD") : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500 truncate max-w-xs">
              {previewNames}{extraCount > 0 && ` +${extraCount} আরো`}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <div className="text-right">
            <p className="text-sm font-bold text-[#0f172a]">৳{Number(order.total || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400">{order.items?.length ?? 0} আইটেম</p>
          </div>
          <Link
            href={`/account/orders/${order.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-[#e91e63]/10 hover:text-[#e91e63]"
          >
            <Eye className="h-3.5 w-3.5" />বিস্তারিত
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Shipment progress */}
      {(status === "processing" || status === "shipped") && (
        <div className="border-t border-slate-50 px-5 py-3">
          <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-400">
            <span>অর্ডার</span><span>প্রক্রিয়াধীন</span><span>শিপড</span><span>ডেলিভারড</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff4081] transition-all duration-700"
              style={{ width: status === "processing" ? "40%" : "70%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { data, isLoading } = useMyOrders();
  const [activeTab, setActiveTab] = useState("সকল");
  const [search, setSearch] = useState("");

  const orders = data?.orders ?? [];

  const filtered = orders.filter((o) => {
    const statusMatch = activeTab === "সকল" || o.status === TAB_TO_STATUS[activeTab];
    const searchMatch =
      !search ||
      (o.order_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="shadow-card animate-fade-in-up rounded-2xl bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/10">
              <ShoppingBag className="h-5 w-5 text-[#e91e63]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0f172a]">আমার অর্ডার</h2>
              <p className="text-xs text-slate-400">{orders.length} টি অর্ডার</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="অর্ডার বা পণ্য খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field py-2.5 pl-9 text-xs"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${activeTab === tab
                  ? "bg-[#e91e63] text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#e91e63]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="shadow-card animate-fade-in-up rounded-2xl bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <ShoppingBag className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">কোনো অর্ডার পাওয়া যায়নি</p>
          <Link href="/products" className="btn-pink mt-4 inline-flex px-5 py-2.5 text-sm">
            কেনাকাটা শুরু করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => (
            <div key={order.id} style={{ animationDelay: `${i * 60}ms` }}>
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
