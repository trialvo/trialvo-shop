import { useState, useEffect } from "react";
import {
  X,
  Shield,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Phone,
  Package,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  checkFraud,
  RISK_META,
  getFraudApiKey,
  isFraudCheckerEnabled,
} from "../lib/fraudChecker";

// Circular progress ring
function CircleProgress({ pct, color }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg
      width="130"
      height="130"
      viewBox="0 0 130 130"
      className="rotate-[-90deg]"
    >
      <circle
        cx="65"
        cy="65"
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="10"
      />
      <circle
        cx="65"
        cy="65"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function CourierRow({ name, data }) {
  const pct =
    data.total_parcels > 0
      ? Math.round((data.total_delivered_parcels / data.total_parcels) * 100)
      : 0;
  const initial = name[0].toUpperCase();

  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {initial}
          </div>
          <span className="text-sm font-medium text-slate-700">{name}</span>
        </div>
      </td>
      <td className="py-3 pr-4 text-sm text-slate-600 text-center">
        {data.total_parcels}
      </td>
      <td className="py-3 pr-4 text-sm text-emerald-600 font-medium text-center">
        {data.total_delivered_parcels}
      </td>
      <td className="py-3 pr-4 text-sm text-red-500 text-center">
        {data.total_cancelled_parcels}
      </td>
      <td className="py-3 min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor:
                  pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 shrink-0">
            {pct}%
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function FraudCheckerModal({ phone, orderNumber, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enabled = isFraudCheckerEnabled();
  const hasKey = !!getFraudApiKey();

  const runCheck = async () => {
    if (!phone || !hasKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await checkFraud(phone);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasKey && phone) runCheck();
  }, [phone]);

  const risk = result ? RISK_META[result.riskLevel] : null;
  const pct = result ? parseFloat(result.deliveryRate) : 0;
  const circleColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-[#0f172a]">
                  Fraud Checker
                </h2>
                {result && risk && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${risk.bg} ${risk.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                    {risk.icon} {risk.label}
                  </span>
                )}
              </div>
              {orderNumber && (
                <p className="text-xs text-slate-400 mt-0.5">
                  অর্ডার {orderNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={runCheck}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <RefreshCcw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Meta pills */}
        {(phone || result) && (
          <div className="flex flex-wrap gap-2 px-6 pt-3">
            {phone && (
              <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">
                <Phone className="h-3 w-3" /> {phone}
              </span>
            )}
            {result?.checkedAt && (
              <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">
                <Clock className="h-3 w-3" />{" "}
                {new Date(result.checkedAt).toLocaleString("en-BD")}
              </span>
            )}
            {result?.total_parcels !== undefined && (
              <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">
                <Package className="h-3 w-3" /> মোট পার্সেল:{" "}
                {result.total_parcels}
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {/* Not configured */}
          {!hasKey && (
            <div className="flex flex-col items-center py-10 text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <p className="font-semibold text-slate-700">
                API Key কনফিগার করা হয়নি
              </p>
              <p className="text-sm text-slate-400 max-w-xs">
                Business Settings → Fraud Checker বিভাগে API key যোগ করুন
              </p>
            </div>
          )}

          {/* Loading */}
          {hasKey && loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 className="h-10 w-10 text-[#e91e63] animate-spin" />
              <p className="text-sm text-slate-500">
                ফোন নম্বর যাচাই করা হচ্ছে...
              </p>
            </div>
          )}

          {/* Error */}
          {hasKey && !loading && error && (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <p className="font-semibold text-red-600">
                চেক করতে ব্যর্থ হয়েছে
              </p>
              <p className="text-xs text-slate-400">{error}</p>
              <button onClick={runCheck} className="btn-outline text-xs mt-2">
                <RefreshCcw className="h-3.5 w-3.5" /> আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {/* Result */}
          {hasKey && !loading && result && !error && (
            <div className="space-y-5">
              {/* Top grid: circle + stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Circle progress */}
                <div className="card !p-4 flex flex-col items-center justify-center gap-2">
                  <p className="text-xs font-semibold text-slate-500 text-center">
                    Delivery Success Ratio
                  </p>
                  <div className="relative">
                    <CircleProgress pct={pct} color={circleColor} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-2xl font-extrabold"
                        style={{ color: circleColor }}
                      >
                        {result.deliveryRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-medium">
                      ডেলিভারি: {result.total_delivered}
                    </span>
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium">
                      বাতিল: {result.total_cancel}
                    </span>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Total Order",
                      value: result.total_parcels,
                      color: "text-[#0f172a]",
                    },
                    {
                      label: "Total Delivered",
                      value: result.total_delivered,
                      color: "text-emerald-600",
                    },
                    {
                      label: "Total Cancelled",
                      value: result.total_cancel,
                      color: "text-red-600",
                    },
                    {
                      label: "Delivery Rate",
                      value: `${result.deliveryRate}%`,
                      color:
                        pct >= 70
                          ? "text-emerald-600"
                          : pct >= 40
                            ? "text-amber-600"
                            : "text-red-600",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="card !p-4 flex flex-col gap-1"
                    >
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                        {s.label}
                      </p>
                      <p className={`text-2xl font-extrabold ${s.color}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courier breakdown */}
              {result.apis && Object.keys(result.apis).length > 0 && (
                <div className="card !p-0 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      কুরিয়ার বিস্তারিত
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full px-5">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {[
                            "কুরিয়ার",
                            "অর্ডার",
                            "ডেলিভারি",
                            "বাতিল",
                            "ডেলিভারি %",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate-400 uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="px-5">
                        {Object.entries(result.apis).map(([name, data]) => (
                          <tr
                            key={name}
                            className="border-b border-slate-50 last:border-0"
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                  {name[0]}
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  {name}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600 text-center">
                              {data.total_parcels}
                            </td>
                            <td className="px-5 py-3 text-sm text-emerald-600 font-medium text-center">
                              {data.total_delivered_parcels}
                            </td>
                            <td className="px-5 py-3 text-sm text-red-500 text-center">
                              {data.total_cancelled_parcels}
                            </td>
                            <td className="px-5 py-3 min-w-[140px]">
                              {(() => {
                                const p =
                                  data.total_parcels > 0
                                    ? Math.round(
                                        (data.total_delivered_parcels /
                                          data.total_parcels) *
                                          100,
                                      )
                                    : 0;
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${p}%`,
                                          backgroundColor:
                                            p >= 70
                                              ? "#10b981"
                                              : p >= 40
                                                ? "#f59e0b"
                                                : "#ef4444",
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500 shrink-0">
                                      {p}%
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Risk verdict */}
              <div
                className={`rounded-xl border p-4 flex items-center gap-4 ${risk.bg}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${risk.bg}`}
                >
                  {result.riskLevel === "safe" && (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  )}
                  {result.riskLevel === "medium" && (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                  {result.riskLevel === "high" && (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  )}
                  {result.riskLevel === "unknown" && (
                    <HelpCircle className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className={`font-bold text-sm ${risk.color}`}>
                    {risk.icon} {risk.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {result.riskLevel === "safe" &&
                      "গ্রাহকের ডেলিভারি হিস্ট্রি ভালো। নিরাপদভাবে ডেলিভারি দেওয়া যাবে।"}
                    {result.riskLevel === "medium" &&
                      "গ্রাহকের কিছু বাতিল রেকর্ড আছে। সতর্কতার সাথে প্রক্রিয়া করুন।"}
                    {result.riskLevel === "high" &&
                      "উচ্চ বাতিলের হার। অর্ডার প্রক্রিয়া করার আগে গ্রাহকের সাথে যোগাযোগ করুন।"}
                    {result.riskLevel === "unknown" &&
                      "এই নম্বরে কোনো পূর্ববর্তী রেকর্ড পাওয়া যায়নি।"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
