import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Filter,
  Eye,
  ShoppingBag,
  Download,
  Shield,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Search,
  X,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  TruckIcon,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import {
  checkFraud,
  RISK_META,
  getFraudApiKey,
  isFraudCheckerEnabled,
} from "../lib/fraudChecker";
import FraudCheckerModal from "../components/FraudCheckerModal";
import { Pagination } from "../components/ui";
import { OrderStatusBadge, ORDER_STATUS_BN } from "../components/ui";

// ── Style maps ────────────────────────────────────────────────────────────────
const PAYMENT_STYLE = {
  cod: {
    label: "COD",
    cls: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  bkash: {
    label: "বিকাশ",
    cls: "bg-pink-50 text-pink-700 border border-pink-200",
  },
  nagad: {
    label: "নগদ",
    cls: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  card: {
    label: "কার্ড",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

const MODE_CONFIG = {
  single: {
    label: "সিঙ্গেল",
    icon: "🛍️",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  combo: {
    label: "কম্বো",
    icon: "🔀",
    cls: "bg-pink-50 text-pink-700 border border-pink-200",
  },
  "combo-bundle": {
    label: "বান্ডেল",
    icon: "🎁",
    cls: "bg-purple-50 text-purple-700 border border-purple-200",
  },
};

const STATUS_TABS = [
  { value: "", label: "সব", icon: null },
  { value: "pending", label: "মুলতুবি", icon: Clock },
  { value: "confirmed", label: "নিশ্চিত", icon: CheckCircle2 },
  { value: "processing", label: "প্রক্রিয়াধীন", icon: Package },
  { value: "shipped", label: "পাঠানো", icon: TruckIcon },
  { value: "delivered", label: "সম্পন্ন", icon: CheckCircle2 },
  { value: "cancelled", label: "বাতিল", icon: XCircle },
];

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(orders) {
  const rows = orders.map((o) => [
    o.order_number || `#${o.id}`,
    o.user?.name || o.shipping_name,
    o.user?.phone || o.shipping_phone,
    o.total,
    o.payment_method,
    o.status,
    new Date(o.created_at).toLocaleDateString(),
  ]);
  const csv = [
    ["Order#", "Customer", "Phone", "Total", "Payment", "Status", "Date"],
    ...rows,
  ]
    .map((r) => r.join(","))
    .join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: "orders.csv",
  });
  a.click();
}

// ── Fraud Badge ───────────────────────────────────────────────────────────────
function FraudBadge({ risk, loading, onClick }) {
  if (loading)
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500"
      >
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> চেক হচ্ছে...
      </button>
    );
  if (!risk)
    return (
      <button
        onClick={onClick}
        title="Fraud check করুন"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
      >
        <Shield className="h-2.5 w-2.5" /> চেক
      </button>
    );
  const m = RISK_META[risk];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.bg} ${m.color} hover:opacity-80 transition-opacity`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.icon} {m.label}
    </button>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      <td colSpan={10} className="px-5 py-2.5">
        <div className="h-12 rounded-xl skeleton" />
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Orders() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [status, setStatus] = useState(params.get("status") || "");
  const [search, setSearch] = useState("");
  const [orderMode, setOrderMode] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({
    status,
    search,
    page,
    limit: 20,
    orderMode,
  });
  const orders = data?.orders || [];

  const fraudEnabled = isFraudCheckerEnabled();
  const hasKey = !!getFraudApiKey();
  const [fraudResults, setFraudResults] = useState({});
  const [fraudLoading, setFraudLoading] = useState({});
  const [modalOrder, setModalOrder] = useState(null);

  useEffect(() => {
    if (!fraudEnabled || !hasKey) return;
    orders
      .filter(
        (o) =>
          (o.status === "pending" || o.status === "confirmed") &&
          (o.user?.phone || o.shipping_phone),
      )
      .forEach((o) => {
        const ph = o.user?.phone || o.shipping_phone;
        if (!fraudResults[ph]) autoCheck(ph);
      });
  }, [orders, fraudEnabled, hasKey]);

  const autoCheck = async (phone) => {
    if (fraudLoading[phone] || fraudResults[phone]) return;
    setFraudLoading((p) => ({ ...p, [phone]: true }));
    try {
      const result = await checkFraud(phone);
      setFraudResults((p) => ({ ...p, [phone]: result }));
    } catch {
      setFraudResults((p) => ({ ...p, [phone]: { riskLevel: "unknown" } }));
    } finally {
      setFraudLoading((p) => ({ ...p, [phone]: false }));
    }
  };

  const manualCheck = (phone) => {
    if (!phone || !hasKey) return;
    const next = { ...fraudResults };
    delete next[phone];
    setFraudResults(next);
    autoCheck(phone);
  };

  // Count by status for tab badges
  const total = data?.total || 0;

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] leading-tight">
            অর্ডার ম্যানেজমেন্ট
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            মোট <span className="font-semibold text-[#0f172a]">{total}</span> টি
            অর্ডার
            {status && (
              <span className="text-[#e91e63]">
                {" "}
                · {ORDER_STATUS_BN[status]}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Fraud status chip */}
          {fraudEnabled && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                hasKey
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {hasKey ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {hasKey ? "Fraud Check সক্রিয়" : "API Key নেই"}
            </div>
          )}
          <button
            onClick={() => exportCSV(orders)}
            className="btn-outline text-xs py-2"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map((t) => {
          const isActive = status === t.value;
          return (
            <button
              key={t.value}
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#e91e63] text-white shadow-sm shadow-pink-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#e91e63]/40 hover:text-[#e91e63]"
              }`}
            >
              {t.icon && <t.icon className="h-3 w-3" />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="card !p-3 flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="অর্ডার নং, নাম বা ফোন দিয়ে খুঁজুন..."
            className="input !pl-10 !pr-8 !py-2.5 text-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Mode Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="input !py-2.5 !w-auto text-xs"
            value={orderMode}
            onChange={(e) => {
              setOrderMode(e.target.value);
              setPage(1);
            }}
          >
            <option value="">সব টাইপ</option>
            <option value="single">🛍️ সিঙ্গেল</option>
            <option value="combo">🔀 কম্বো বিল্ডার</option>
            <option value="combo-bundle">🎁 কম্বো বান্ডেল</option>
          </select>
        </div>

        {/* Clear filters */}
        {(search || status || orderMode) && (
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setOrderMode("");
              setPage(1);
            }}
            className="shrink-0 btn-ghost text-xs py-2"
          >
            <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {[
                  "অর্ডার নং",
                  "গ্রাহক",
                  "পণ্য",
                  "মোট",
                  "পেমেন্ট",
                  "পে-স্ট্যাটাস",
                  "স্ট্যাটাস",
                  ...(fraudEnabled ? ["Fraud"] : []),
                  "তারিখ",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="table-header first:pl-5 last:pr-5 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)}

              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-slate-100">
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">
                        কোনো অর্ডার পাওয়া যায়নি
                      </p>
                      <p className="text-xs text-slate-400">
                        ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {orders.map((o) => {
                const phone = o.user?.phone || o.shipping_phone;
                const fraudData = phone ? fraudResults[phone] : null;
                const fraudIsLoading = phone ? !!fraudLoading[phone] : false;
                const pay = PAYMENT_STYLE[o.payment_method] || {
                  label: o.payment_method?.toUpperCase() || "—",
                  cls: "bg-slate-100 text-slate-600",
                };
                const mode = MODE_CONFIG[o.order_mode] || MODE_CONFIG.single;
                const riskLevel = fraudData?.riskLevel;

                // Items safe parse
                let itemCount = "—";
                try {
                  const items = Array.isArray(o.items)
                    ? o.items
                    : JSON.parse(o.items || "[]");
                  itemCount = `${items.length} টি`;
                } catch {}

                return (
                  <tr
                    key={o.id}
                    className={`group border-b border-slate-50 transition-colors cursor-pointer ${
                      riskLevel === "high"
                        ? "bg-red-50/40 hover:bg-red-50/70"
                        : riskLevel === "medium"
                          ? "bg-amber-50/30 hover:bg-amber-50/60"
                          : "hover:bg-blue-50/20"
                    }`}
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    {/* Order number + type badge */}
                    <td className="table-cell pl-5 min-w-[140px]">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded-lg w-fit">
                          {o.order_number || `#${o.id}`}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold w-fit ${mode.cls}`}
                        >
                          {mode.icon} {mode.label}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="table-cell min-w-[140px]">
                      <p className="text-xs font-semibold text-[#0f172a] leading-tight">
                        {o.user?.name || o.shipping_name || "গেস্ট"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {phone || "—"}
                      </p>
                    </td>

                    {/* Items count */}
                    <td className="table-cell text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3 w-3 text-slate-300" />
                        {itemCount}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="table-cell">
                      <span className="font-bold text-sm text-[#0f172a]">
                        ৳{Number(o.total || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Payment method */}
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${pay.cls}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pay.label}
                      </span>
                    </td>

                    {/* Payment status */}
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          o.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : o.payment_status === "failed"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : o.payment_status === "refunded"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            o.payment_status === "paid"
                              ? "bg-emerald-400"
                              : o.payment_status === "failed"
                                ? "bg-red-400"
                                : "bg-slate-400"
                          }`}
                        />
                        {o.payment_status === "paid"
                          ? "পেইড"
                          : o.payment_status === "pending"
                            ? "বাকি"
                            : o.payment_status || "—"}
                      </span>
                    </td>

                    {/* Order status */}
                    <td className="table-cell">
                      <OrderStatusBadge status={o.status} />
                    </td>

                    {/* Fraud */}
                    {fraudEnabled && (
                      <td
                        className="table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {phone ? (
                          <FraudBadge
                            risk={fraudData?.riskLevel}
                            loading={fraudIsLoading}
                            onClick={() => {
                              if (!fraudData && !fraudIsLoading)
                                manualCheck(phone);
                              setModalOrder(o);
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    )}

                    {/* Date */}
                    <td className="table-cell text-[11px] text-slate-400 whitespace-nowrap">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString("bn-BD")
                        : "—"}
                    </td>

                    {/* View */}
                    <td
                      className="table-cell pr-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {fraudEnabled && phone && (
                          <button
                            onClick={() => {
                              manualCheck(phone);
                              setModalOrder(o);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <Link
                          to={`/orders/${o.id}`}
                          className="flex items-center gap-1 text-xs text-[#e91e63] font-semibold hover:underline whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5" /> দেখুন
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ borderTop: "1px solid #f1f5f9" }}>
          <Pagination
            page={page}
            pages={data?.pages || 1}
            total={total}
            onChange={setPage}
          />
        </div>
      </div>

      {/* Fraud Modal */}
      {modalOrder && (
        <FraudCheckerModal
          phone={modalOrder.user?.phone || modalOrder.shipping_phone}
          orderNumber={modalOrder.order_number || `#${modalOrder.id}`}
          onClose={() => setModalOrder(null)}
        />
      )}
    </div>
  );
}
