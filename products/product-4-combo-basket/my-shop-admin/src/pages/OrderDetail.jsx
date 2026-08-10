import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  CreditCard,
  Package,
  User,
  Clock,
  Truck,
  Shield,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { useOrder, useUpdateOrderStatus } from "../hooks/useOrders";
import { getImageUrl } from "../lib/imageUrl";
import {
  checkFraud,
  RISK_META,
  getFraudApiKey,
  isFraudCheckerEnabled,
} from "../lib/fraudChecker";
import FraudCheckerModal from "../components/FraudCheckerModal";
import api from "../lib/api";
import {
  SectionHeader,
  InfoRow,
  Avatar,
  OrderStatusBadge,
  ORDER_STATUS_STYLE,
  ORDER_STATUS_BN,
} from "../components/ui";

// Local constants and InfoRow replaced by shared components

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useOrder(id);
  const statusMut = useUpdateOrderStatus();
  const [notes, setNotes] = useState("");
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [fraudResult, setFraudResult] = useState(null);
  const [fraudChecking, setFraudChecking] = useState(false);
  const fraudEnabled = isFraudCheckerEnabled();
  const hasKey = !!getFraudApiKey();

  const runFraudCheckEffect = async (ph) => {
    if (!ph || !hasKey) return;
    setFraudChecking(true);
    try {
      const result = await checkFraud(ph);
      setFraudResult(result);
      try {
        await api.put(`/admin/orders/${id}/fraud-status`, {
          fraud_status: result,
        });
      } catch {}
    } catch (e) {
      console.error("Fraud check failed:", e.message);
    } finally {
      setFraudChecking(false);
    }
  };

  // Run fraud check once when order loads
  useEffect(() => {
    if (!data?.order) return;
    const o = data.order;
    const ph = o.user?.phone || o.shipping_phone;
    const stored = o.fraud_status || null;
    if (fraudEnabled && hasKey && ph && !stored && !fraudResult) {
      runFraudCheckEffect(ph);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.order?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card h-32 animate-pulse bg-slate-50" />
        ))}
      </div>
    );
  }

  const o = data?.order;
  if (!o) {
    return (
      <div className="card text-center py-16 text-sm text-slate-400">
        অর্ডার পাওয়া যায়নি
      </div>
    );
  }

  // MySQL JSON columns may come back as strings — parse safely
  const safeItems = (() => {
    try {
      if (Array.isArray(o.items)) return o.items;
      if (typeof o.items === "string") return JSON.parse(o.items) || [];
    } catch {}
    return [];
  })();
  const safeFraudStatus = (() => {
    try {
      if (!o.fraud_status) return null;
      if (typeof o.fraud_status === "object") return o.fraud_status;
      return JSON.parse(o.fraud_status);
    } catch {}
    return null;
  })();

  const handleStatusUpdate = (status) => {
    statusMut.mutate({ id, data: { status, notes: notes || undefined } });
  };

  const storedFraud = safeFraudStatus;
  const activeFraud = fraudResult || storedFraud;
  const activeRisk = activeFraud?.riskLevel;
  const riskMeta = activeRisk ? RISK_META[activeRisk] : null;
  const phone = o.user?.phone || o.shipping_phone;

  const runFraudCheck = runFraudCheckEffect;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/orders")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-[#0f172a] font-mono">
              {o.order_number}
            </h1>
            <OrderStatusBadge status={o.status} />
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                o.order_mode === "combo"
                  ? "bg-pink-50 text-pink-700 border border-pink-200"
                  : o.order_mode === "combo-bundle"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {o.order_mode === "combo"
                ? "🔀 কম্বো বিল্ডার"
                : o.order_mode === "combo-bundle"
                  ? "🎁 কম্বো বান্ডেল"
                  : "🛍️ সিঙ্গেল"}
            </span>
            {/* Fraud badge */}
            {fraudEnabled && (fraudChecking || activeFraud) && (
              <button
                onClick={() => setShowFraudModal(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-opacity hover:opacity-75 ${
                  fraudChecking
                    ? "bg-slate-100 text-slate-500 border-slate-200"
                    : riskMeta
                      ? `${riskMeta.bg} ${riskMeta.color} ${riskMeta.border}`
                      : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {fraudChecking ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> চেক হচ্ছে...
                  </>
                ) : riskMeta ? (
                  <>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${riskMeta.dot}`}
                    />
                    {riskMeta.icon} Fraud: {riskMeta.label}
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3" /> Fraud চেক
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            <Clock className="h-3 w-3 inline mr-1" />
            {o.created_at ? new Date(o.created_at).toLocaleString("bn-BD") : ""}
          </p>
        </div>
      </div>

      {/* 3-col layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <SectionHeader icon={User} title="গ্রাহক" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={o.user?.name || o.shipping_name || "G"} size="md" />
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">
                  {o.user?.name || o.shipping_name || "গেস্ট"}
                </p>
                <p className="text-xs text-slate-400">{o.user?.email || "—"}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow label="ফোন" value={phone} />
              <InfoRow
                label="অ্যাকাউন্ট"
                value={o.user_id ? "নিবন্ধিত" : "গেস্ট"}
              />
            </div>
          </div>

          {/* Fraud Status Card */}
          {fraudEnabled && (
            <div
              className={`card !p-0 overflow-hidden ${
                activeRisk === "high"
                  ? "ring-2 ring-red-200"
                  : activeRisk === "medium"
                    ? "ring-2 ring-amber-200"
                    : activeRisk === "safe"
                      ? "ring-2 ring-emerald-200"
                      : ""
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                <Shield className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex-1">
                  Fraud Status
                </h3>
                {phone && (
                  <button
                    onClick={() => runFraudCheck(phone)}
                    disabled={fraudChecking || !hasKey}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#e91e63] transition-colors disabled:opacity-40"
                  >
                    <RefreshCcw
                      className={`h-3 w-3 ${fraudChecking ? "animate-spin" : ""}`}
                    />
                    {fraudChecking ? "চেক হচ্ছে..." : "পুনরায় চেক"}
                  </button>
                )}
              </div>
              <div className="px-4 py-4">
                {!hasKey ? (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Services → Fraud Checker-এ API key যোগ করুন
                  </p>
                ) : fraudChecking && !activeFraud ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#e91e63]" />
                    <p className="text-xs text-slate-500">
                      ফোন নম্বর যাচাই হচ্ছে...
                    </p>
                  </div>
                ) : activeFraud ? (
                  <button
                    onClick={() => setShowFraudModal(true)}
                    className="w-full text-left"
                  >
                    <div
                      className={`rounded-xl border p-3 hover:opacity-80 transition-opacity ${
                        riskMeta?.bg || "bg-slate-50"
                      } ${riskMeta?.border || "border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-bold ${riskMeta?.color || "text-slate-600"}`}
                        >
                          {riskMeta?.icon} {riskMeta?.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          বিস্তারিত ↗
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="bg-white/60 rounded-lg px-2 py-1.5">
                          <p className="text-slate-400">ডেলিভারি রেট</p>
                          <p
                            className={`font-bold ${riskMeta?.color || "text-slate-600"}`}
                          >
                            {activeFraud.deliveryRate}%
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg px-2 py-1.5">
                          <p className="text-slate-400">মোট পার্সেল</p>
                          <p className="font-bold text-[#0f172a]">
                            {activeFraud.total_parcels}
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg px-2 py-1.5">
                          <p className="text-slate-400">ডেলিভারি</p>
                          <p className="font-bold text-emerald-600">
                            {activeFraud.total_delivered}
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg px-2 py-1.5">
                          <p className="text-slate-400">বাতিল</p>
                          <p className="font-bold text-red-600">
                            {activeFraud.total_cancel}
                          </p>
                        </div>
                      </div>
                      {activeFraud.checkedAt && (
                        <p className="text-[10px] text-slate-400 mt-2 text-right">
                          চেক:{" "}
                          {new Date(activeFraud.checkedAt).toLocaleString(
                            "en-BD",
                          )}
                        </p>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="text-center py-3">
                    <button
                      onClick={() => runFraudCheck(phone)}
                      disabled={!phone || !hasKey}
                      className="btn-outline text-xs py-1.5 disabled:opacity-40"
                    >
                      <Shield className="h-3.5 w-3.5" /> Fraud চেক করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping address */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <SectionHeader icon={MapPin} title="ডেলিভারি ঠিকানা" />
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow label="নাম" value={o.shipping_name} />
              <InfoRow label="ফোন" value={o.shipping_phone} />
              <InfoRow label="ঠিকানা" value={o.shipping_address} />
              <InfoRow label="শহর" value={o.shipping_city} />
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <SectionHeader icon={CreditCard} title="পেমেন্ট" />
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow
                label="পদ্ধতি"
                value={(o.payment_method || "—").toUpperCase()}
              />
              <InfoRow
                label="স্ট্যাটাস"
                value={
                  o.payment_status === "paid"
                    ? "✅ পেইড"
                    : o.payment_status === "pending"
                      ? "⏳ বাকি"
                      : o.payment_status
                }
              />
              {o.coupon_code && <InfoRow label="কুপন" value={o.coupon_code} />}
            </div>
            {/* Pricing */}
            <div className="mt-4 space-y-1.5 text-xs border-t border-slate-100 pt-4">
              <div className="flex justify-between text-slate-500">
                <span>সাব-টোটাল</span>
                <span>৳{Number(o.subtotal || 0).toLocaleString()}</span>
              </div>
              {Number(o.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>ডিসকাউন্ট</span>
                  <span>-৳{Number(o.discount_amount).toLocaleString()}</span>
                </div>
              )}
              {Number(o.coupon_discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>কুপন ডিসকাউন্ট</span>
                  <span>-৳{Number(o.coupon_discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>ডেলিভারি</span>
                <span>
                  {Number(o.delivery_charge) === 0
                    ? "ফ্রি"
                    : `৳${Number(o.delivery_charge).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-100 pt-2 mt-2">
                <span className="text-[#0f172a]">সর্বমোট</span>
                <span className="text-[#e91e63]">
                  ৳{Number(o.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Items + Status */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="card !p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Package className="h-4 w-4 text-[#e91e63]" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                পণ্যসমূহ ({safeItems.length} টি)
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {safeItems.map((item, i) => {
                const isCombo =
                  item.item_type === "combo" || item.combo_items?.length > 0;
                return (
                  <div key={i} className="flex flex-col px-5 py-3.5 gap-2">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        {isCombo && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-[#e91e63] text-[9px]">
                            🎁
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#0f172a] leading-tight truncate">
                            {item.name}
                          </p>
                          {isCombo && (
                            <span className="shrink-0 text-[10px] font-semibold bg-pink-50 text-[#e91e63] border border-pink-200 px-1.5 py-0.5 rounded-full">
                              কম্বো বান্ডেল
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ৳{Number(item.price || 0).toLocaleString()} ×{" "}
                          {item.qty}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#0f172a] shrink-0">
                        ৳
                        {Number(
                          (item.price || 0) * (item.qty || 1),
                        ).toLocaleString()}
                      </span>
                    </div>
                    {/* Combo sub-items */}
                    {isCombo && item.combo_items?.length > 0 && (
                      <div className="ml-16 space-y-1 border-l-2 border-pink-100 pl-3">
                        {item.combo_items.map((ci, j) => (
                          <div key={j} className="flex items-center gap-2">
                            {ci.image && (
                              <img
                                src={getImageUrl(ci.image)}
                                alt=""
                                className="h-6 w-6 rounded-md object-cover border border-slate-100 shrink-0"
                              />
                            )}
                            <span className="text-xs text-slate-500 flex-1 truncate">
                              {ci.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 shrink-0">
                              ×{ci.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!(o.items || []).length && (
                <p className="px-5 py-6 text-xs text-slate-400 text-center">
                  কোনো আইটেম নেই
                </p>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Truck className="h-4 w-4 text-[#e91e63]" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                স্ট্যাটাস আপডেট
              </h3>
            </div>
            {/* Timeline */}
            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
              {STATUSES.filter((s) => s !== "cancelled").map((s, i) => {
                const idx = STATUSES.indexOf(o.status);
                const sIdx = STATUSES.indexOf(s);
                const isPast = sIdx < idx && o.status !== "cancelled";
                const isCurrent = s === o.status;
                return (
                  <div
                    key={s}
                    className="flex flex-col items-center gap-1 min-w-0 shrink-0"
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs ${
                        isCurrent
                          ? "border-[#e91e63] bg-[#e91e63] text-white"
                          : isPast
                            ? "border-emerald-400 bg-emerald-400 text-white"
                            : "border-slate-200 bg-white text-slate-300"
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-[9px] font-medium text-center whitespace-nowrap ${
                        isCurrent
                          ? "text-[#e91e63]"
                          : isPast
                            ? "text-emerald-600"
                            : "text-slate-400"
                      }`}
                    >
                      {ORDER_STATUS_BN[s]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusUpdate(s)}
                  disabled={o.status === s || statusMut.isPending}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                    o.status === s
                      ? `${ORDER_STATUS_STYLE[s]} cursor-default`
                      : "border-slate-200 text-slate-600 hover:border-[#e91e63] hover:text-[#e91e63]"
                  }`}
                >
                  {o.status === s && <CheckCircle2 className="h-3 w-3" />}
                  {ORDER_STATUS_BN[s]}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                নোট (ঐচ্ছিক)
              </label>
              <textarea
                className="input min-h-16 resize-y text-xs"
                placeholder="অর্ডার সম্পর্কে নোট যোগ করুন..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {o.notes && (
                <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                  <span className="font-semibold">বিদ্যমান নোট:</span> {o.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Checker Modal */}
      {showFraudModal && (
        <FraudCheckerModal
          phone={phone}
          orderNumber={o.order_number}
          onClose={() => setShowFraudModal(false)}
        />
      )}
    </div>
  );
}
