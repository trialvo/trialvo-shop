import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Award,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { useStats, useOrdersChart, useTopProducts } from "../hooks/useStats";

const PIE_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#e91e63",
];

const STATUS_BN = {
  pending: "মুলতুবি",
  confirmed: "নিশ্চিত",
  processing: "প্রক্রিয়াধীন",
  shipped: "পাঠানো",
  delivered: "সম্পন্ন",
  cancelled: "বাতিল",
};

function KPI({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} shrink-0`}
      >
        <Icon className="h-5.5 w-5.5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-[#0f172a] mt-0.5">
          {value ?? "—"}
        </p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "orders" ? "অর্ডার" : "রাজস্ব"}:{" "}
          {p.dataKey === "revenue"
            ? `৳${Number(p.value || 0).toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data: statsData, isLoading: statsLoading } = useStats();
  const { data: chartData, isLoading: chartLoading } = useOrdersChart();
  const { data: topData, isLoading: topLoading } = useTopProducts();

  const s = statsData?.stats || {};
  const chart = (chartData?.data || []).map((d) => ({
    ...d,
    date: d.date?.slice(5),
    revenue: Number(d.revenue || 0),
    orders: Number(d.orders || 0),
  }));
  const top = topData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">বিক্রয় বিশ্লেষণ</h1>
        <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> শেষ ৩০ দিনের পরিসংখ্যান
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI
          label="মোট রাজস্ব"
          value={`৳${Number(s.revenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-[#e91e63]"
        />
        <KPI
          label="মোট অর্ডার"
          value={s.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-500"
          sub={`${s.pendingOrders ?? 0} মুলতুবি`}
        />
        <KPI
          label="মোট গ্রাহক"
          value={s.totalCustomers}
          icon={Users}
          color="bg-violet-500"
        />
        <KPI
          label="মোট পণ্য"
          value={s.totalProducts}
          icon={Package}
          color="bg-amber-500"
        />
      </div>

      {/* Revenue + Orders Trends */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#0f172a] mb-5">
          রাজস্ব ট্রেন্ড — শেষ ৩০ দিন
        </h2>
        {chartLoading ? (
          <div className="h-56 rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chart}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e91e63" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e91e63" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
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
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                formatter={(v) => (v === "revenue" ? "রাজস্ব (৳)" : "অর্ডার")}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#e91e63"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#ordGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Award className="h-4.5 w-4.5 text-[#e91e63]" />
          <h2 className="text-sm font-bold text-[#0f172a]">শীর্ষ ১০ পণ্য</h2>
        </div>
        {topLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {top.slice(0, 10).map((p, i) => {
              const maxRev = top[0]?.revenue || 1;
              const pct = Math.round((p.revenue / maxRev) * 100);
              return (
                <div key={p.id || i} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold
                      ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"}`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-[#0f172a] truncate">
                        {p.name}
                      </p>
                      <span className="text-xs font-bold text-[#e91e63] shrink-0 ml-2">
                        ৳{Number(p.revenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#e91e63] to-pink-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {p.totalSold} বিক্রি
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!top.length && (
              <p className="text-xs text-slate-400 text-center py-6">
                কোনো ডেটা নেই
              </p>
            )}
          </div>
        )}
      </div>

      {/* Orders bar chart */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#0f172a] mb-5">
          দৈনিক অর্ডার — শেষ ৩০ দিন
        </h2>
        {chartLoading ? (
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chart}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="orders"
                fill="#e91e63"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                name="অর্ডার"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
