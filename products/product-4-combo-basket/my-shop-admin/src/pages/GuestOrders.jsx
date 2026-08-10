import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Users, Eye, Clock, Filter, ShoppingBag } from "lucide-react";
import {
  OrderStatusBadge,
  ORDER_STATUS_BN,
  SearchInput,
  PageHeader,
} from "../components/ui";

export default function GuestOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["guest-orders"],
    queryFn: () => api.get("/orders?guest=true").then((r) => r.data),
  });

  const orders = (data?.orders || []).filter((o) => !o.user_id);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="গেস্ট অর্ডার"
        subtitle="অ্যাকাউন্ট ছাড়া অর্ডার করা গ্রাহকদের তালিকা"
        action={
          <div className="flex items-center gap-2 text-xs bg-purple-50 border border-purple-100 text-purple-700 font-semibold px-3 py-2 rounded-xl">
            <Users className="h-3.5 w-3.5" /> মোট: {filtered.length} টি
          </div>
        }
      />

      {/* Filters */}
      <div className="card !p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          value={search}
          onChange={setSearch}
          placeholder="অর্ডার নম্বর, নাম বা ফোন খুঁজুন..."
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="input !py-2 !w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">সব স্ট্যাটাস</option>
            {["pending", "processing", "shipped", "delivered", "cancelled"].map(
              (k) => (
                <option key={k} value={k}>
                  {ORDER_STATUS_BN[k] || k}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">
              <ShoppingBag className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              কোনো গেস্ট অর্ডার পাওয়া যায়নি
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    অর্ডার
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    গ্রাহক
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    পরিমাণ
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    স্ট্যাটাস
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    তারিখ
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded-lg">
                        {order.order_number || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0f172a] text-sm">
                        {order.customer_name || "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.customer_phone || order.customer_email || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#0f172a]">
                      ৳{Number(order.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString(
                              "bn-BD",
                            )
                          : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        দেখুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
