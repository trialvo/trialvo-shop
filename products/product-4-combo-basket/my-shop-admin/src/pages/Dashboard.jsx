import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Ticket,
  Eye,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Star,
  Activity,
} from "lucide-react";
import { useStats, useOrdersChart, useTopProducts } from "../hooks/useStats";
import { useOrders } from "../hooks/useOrders";
import { useNavigate } from "react-router-dom";
import { StatCard, OrderStatusBadge } from "../components/ui";

/* ── Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs min-w-32">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-slate-500">
            {p.dataKey === "orders" ? "অর্ডার" : "রাজস্ব"}:
          </span>
          <span className="font-semibold text-slate-800">
            {p.dataKey === "revenue"
              ? `৳${Number(p.value).toLocaleString()}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const MODE_BADGE = {
  single: {
    label: "সিঙ্গেল",
    color: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  combo: {
    label: "কম্বো",
    color: "bg-pink-50 text-pink-700 border border-pink-200",
  },
  "combo-bundle": {
    label: "বান্ডেল",
    color: "bg-purple-50 text-purple-700 border border-purple-200",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: statsData } = useStats();
  const { data: chartData } = useOrdersChart();
  const { data: topData } = useTopProducts();
  const { data: ordersData } = useOrders({ page: 1, limit: 8 });

  const s = statsData?.stats || {};
  const chart = chartData?.data || [];
  const top = topData?.data || [];
  const recents = ordersData?.orders || [];

  const quickActions = [
    {
      label: "নতুন পণ্য",
      icon: Plus,
      to: "/products/new",
      color: "from-[#e91e63] to-pink-400",
      shadow: "shadow-pink-200",
    },
    {
      label: "নতুন কুপন",
      icon: Ticket,
      to: "/coupons",
      color: "from-violet-600 to-violet-400",
      shadow: "shadow-violet-200",
    },
    {
      label: "মুলতুবি অর্ডার",
      icon: Clock,
      to: "/orders?status=pending",
      color: "from-amber-500 to-amber-400",
      shadow: "shadow-amber-200",
    },
    {
      label: "বিশ্লেষণ",
      icon: Activity,
      to: "/analytics",
      color: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] leading-tight">
            ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            আজকের পরিসংখ্যান ও সার্বিক অবস্থা
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm ${a.shadow} bg-gradient-to-r ${a.color}`}
            >
              <a.icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          label="মোট রাজস্ব"
          value={`৳${Number(s.revenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          iconBg="bg-[#e91e63]"
          trend={12}
        />
        <StatCard
          label="মোট অর্ডার"
          value={s.totalOrders}
          icon={ShoppingBag}
          iconBg="bg-blue-500"
          trend={8}
          sub={`${s.pendingOrders ?? 0} টি মুলতুবি`}
        />
        <StatCard
          label="ডেলিভারি সম্পন্ন"
          value={s.deliveredOrders}
          icon={CheckCircle2}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="মোট গ্রাহক"
          value={s.totalCustomers}
          icon={Users}
          iconBg="bg-violet-500"
          trend={5}
        />
        <StatCard
          label="মোট পণ্য"
          value={s.totalProducts}
          icon={Package}
          iconBg="bg-amber-500"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Area Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">
                অর্ডার ট্রেন্ড
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                শেষ ৩০ দিনের অর্ডার ও রাজস্ব
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#e91e63]/70" />
                অর্ডার
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-300/70" />
                রাজস্ব
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chart}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e91e63" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e91e63" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(v) => v?.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#e91e63"
                strokeWidth={2}
                fill="url(#ordersGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#e91e63" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">শীর্ষ পণ্য</h2>
              <p className="text-xs text-slate-400 mt-0.5">বিক্রির ভিত্তিতে</p>
            </div>
            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-0.5 text-xs text-[#e91e63] hover:underline font-medium"
            >
              সব দেখুন <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {top.slice(0, 7).map((p, i) => (
              <div key={p.id || i} className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    i === 0
                      ? "bg-amber-100 text-amber-700"
                      : i === 1
                        ? "bg-slate-100 text-slate-600"
                        : i === 2
                          ? "bg-orange-50 text-orange-500"
                          : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#0f172a]">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {p.totalSold} বিক্রি
                  </p>
                </div>
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ color: "#e91e63" }}
                >
                  ৳{Number(p.revenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {!top.length && (
              <div className="py-8 text-center">
                <Star className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">কোনো ডেটা নেই</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="card !p-0 overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #f1f5f9" }}
        >
          <div>
            <h2 className="text-sm font-bold text-[#0f172a]">
              সাম্প্রতিক অর্ডার
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              সর্বশেষ {recents.length} টি অর্ডার
            </p>
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline font-medium"
          >
            সব দেখুন <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th className="table-header rounded-tl-none">অর্ডার নং</th>
                <th className="table-header">গ্রাহক</th>
                <th className="table-header">টাইপ</th>
                <th className="table-header">মোট</th>
                <th className="table-header">স্ট্যাটাস</th>
                <th className="table-header text-right pr-5">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody>
              {recents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-xs text-slate-400"
                  >
                    <ShoppingBag className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                    কোনো অর্ডার নেই
                  </td>
                </tr>
              )}
              {recents.map((o) => {
                const mode = MODE_BADGE[o.order_mode] || MODE_BADGE.single;
                return (
                  <tr
                    key={o.id}
                    className="table-row"
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    <td className="table-cell">
                      <span className="font-mono text-xs font-semibold text-[#0f172a] bg-slate-100 px-2 py-1 rounded-lg">
                        {o.order_number || `#${o.id}`}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="text-xs font-semibold text-[#0f172a]">
                        {o.user?.name || o.shipping_name || "গেস্ট"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {o.shipping_phone || o.user?.phone || ""}
                      </p>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${mode.color}`}
                      >
                        {mode.label}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-[#0f172a]">
                      ৳{Number(o.total || 0).toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="table-cell text-right pr-5">
                      <button className="inline-flex items-center gap-1 text-xs text-[#e91e63] hover:underline font-medium">
                        <Eye className="h-3.5 w-3.5" /> দেখুন
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
