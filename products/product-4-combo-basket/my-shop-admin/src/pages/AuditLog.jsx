import { useState, useMemo } from "react";
import {
  Shield,
  Filter,
  Clock,
  Package,
  ShoppingBag,
  Tag,
  Settings,
  Users,
  FileText,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Eye,
  X,
  Database,
  Layers,
} from "lucide-react";
import { useAuditLogs } from "../hooks/useAudit";
import { SearchInput } from "../components/ui";

// ── Constants ───────────────────────────────────────────────────────────────
const ENTITY_ICONS = {
  product: Package,
  order: ShoppingBag,
  coupon: Tag,
  config: Settings,
  customer: Users,
  admin: Shield,
  faq: FileText,
  slider: Layers,
};
const ENTITY_COLORS = {
  product: "bg-blue-50 text-blue-600",
  order: "bg-purple-50 text-purple-600",
  coupon: "bg-amber-50 text-amber-600",
  config: "bg-slate-100 text-slate-600",
  customer: "bg-green-50 text-green-600",
  admin: "bg-rose-50 text-rose-600",
  faq: "bg-indigo-50 text-indigo-600",
  slider: "bg-cyan-50 text-cyan-600",
};
const ACTION_STYLE = {
  create: {
    bg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-400",
    label: "তৈরি",
  },
  update: {
    bg: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-400",
    label: "আপডেট",
  },
  delete: {
    bg: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-400",
    label: "মুছুন",
  },
  status_change: {
    bg: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
    label: "স্ট্যাটাস পরিবর্তন",
  },
  login: {
    bg: "bg-violet-50 text-violet-700 border border-violet-200",
    dot: "bg-violet-400",
    label: "লগইন",
  },
};
const ACTION_ICONS = {
  create: Plus,
  update: Edit3,
  delete: Trash2,
  status_change: RefreshCcw,
  login: Shield,
};
const ENTITY_TYPES = [
  "product",
  "order",
  "coupon",
  "config",
  "customer",
  "admin",
  "faq",
];
const ACTIONS = ["create", "update", "delete", "status_change"];

// ── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return `${diff}s আগে`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h আগে`;
  return `${Math.floor(diff / 86400)}d আগে`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Diff Viewer ─────────────────────────────────────────────────────────────
function DiffViewer({ oldVal, newVal }) {
  if (!oldVal && !newVal) return null;
  const parseVal = (v) => {
    if (!v) return {};
    if (typeof v === "object") return v;
    try {
      return JSON.parse(v);
    } catch {
      return { value: v };
    }
  };
  const o = parseVal(oldVal);
  const n = parseVal(newVal);
  const allKeys = [...new Set([...Object.keys(o), ...Object.keys(n)])].slice(
    0,
    12,
  );

  const changed = allKeys.filter(
    (k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]),
  );
  if (!changed.length) return null;

  return (
    <div className="mt-3 rounded-xl bg-slate-900 overflow-hidden text-xs font-mono">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700">
        <Database className="h-3 w-3 text-slate-400" />
        <span className="text-slate-400 text-[10px] font-sans">
          변경사항 (পরিবর্তন)
        </span>
        <span className="ml-auto text-[10px] text-slate-500">
          {changed.length} field{changed.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="p-3 space-y-1 max-h-36 overflow-y-auto scrollbar-hide">
        {changed.map((k) => (
          <div key={k}>
            {o[k] !== undefined && (
              <div className="flex gap-2 items-start">
                <span className="text-red-400 shrink-0">-</span>
                <span className="text-slate-400 shrink-0">{k}:</span>
                <span className="text-red-300 break-all">
                  {JSON.stringify(o[k])}
                </span>
              </div>
            )}
            {n[k] !== undefined && (
              <div className="flex gap-2 items-start">
                <span className="text-emerald-400 shrink-0">+</span>
                <span className="text-slate-400 shrink-0">{k}:</span>
                <span className="text-emerald-300 break-all">
                  {JSON.stringify(n[k])}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-[#0f172a]">{value ?? "—"}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Log Entry ───────────────────────────────────────────────────────────────
function LogEntry({ log, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const entityStyle =
    ENTITY_COLORS[log.entity_type] || "bg-slate-100 text-slate-600";
  const actionInfo = ACTION_STYLE[log.action] || {
    bg: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
    label: log.action,
  };
  const ActionIcon = ACTION_ICONS[log.action] || Edit3;
  const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
  const hasDiff = log.old_value || log.new_value;

  return (
    <div className="relative pl-10">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[18px] top-8 bottom-0 w-px bg-slate-100" />
      )}

      {/* Timeline dot */}
      <div
        className={`absolute left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm ${actionInfo.dot} ring-2 ring-white`}
      >
        <ActionIcon className="h-3 w-3 text-white" />
      </div>

      {/* Card */}
      <div
        className={`mb-3 card !p-0 overflow-hidden transition-all duration-200 cursor-pointer
        ${expanded ? "shadow-md ring-1 ring-slate-200" : "hover:shadow-sm hover:border-slate-200"}`}
      >
        {/* Header */}
        <div
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-colors"
        >
          {/* Entity icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${entityStyle}`}
          >
            <EntityIcon className="h-4 w-4" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${actionInfo.bg}`}
              >
                <ActionIcon className="h-2.5 w-2.5" />
                {actionInfo.label}
              </span>
              <span className="text-xs font-semibold text-[#0f172a] capitalize">
                {log.entity_type}
                <span className="text-slate-400 font-normal">
                  {" "}
                  #{log.entity_id}
                </span>
              </span>
              {log.admin_id && (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Admin #{log.admin_id}
                </span>
              )}
            </div>
            {log.summary && (
              <p className="text-xs text-slate-600 mt-0.5 leading-snug truncate">
                {log.summary}
              </p>
            )}
          </div>

          {/* Time */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              {timeAgo(log.created_at)}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-slate-50/40">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-slate-400">এন্টিটি</span>
                <span className="font-medium text-slate-700 capitalize">
                  {log.entity_type} #{log.entity_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">অ্যাকশন</span>
                <span className="font-medium text-slate-700">
                  {actionInfo.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">তারিখ/সময়</span>
                <span className="font-medium text-slate-700">
                  {formatDate(log.created_at)}
                </span>
              </div>
              {log.admin_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400">অ্যাডমিন</span>
                  <span className="font-medium text-slate-700">
                    #{log.admin_id}
                  </span>
                </div>
              )}
            </div>

            {/* Summary */}
            {log.summary && (
              <div className="text-xs text-slate-600 bg-white rounded-xl border border-slate-200 px-3 py-2 mb-2">
                {log.summary}
              </div>
            )}

            {/* Diff toggle */}
            {hasDiff && (
              <button
                onClick={() => setShowDiff((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#e91e63] hover:underline mt-1"
              >
                <Database className="h-3 w-3" />
                {showDiff ? "Diff লুকান" : "Diff দেখুন"}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showDiff ? "rotate-180" : ""}`}
                />
              </button>
            )}
            {showDiff && hasDiff && (
              <DiffViewer oldVal={log.old_value} newVal={log.new_value} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AuditLog() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useAuditLogs({ entityType });
  const logs = data?.logs || [];

  // Client-side filter by action + search
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (action && l.action !== action) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.summary?.toLowerCase().includes(q) ||
          String(l.entity_id).includes(q) ||
          l.entity_type?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, action, search]);

  // Stats
  const stats = useMemo(
    () => ({
      total: logs.length,
      creates: logs.filter((l) => l.action === "create").length,
      updates: logs.filter((l) => l.action === "update").length,
      deletes: logs.filter((l) => l.action === "delete").length,
      statusChanges: logs.filter((l) => l.action === "status_change").length,
    }),
    [logs],
  );

  const hasFilters = entityType || action || search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#e91e63]" />
            অডিট লগ
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            সকল অ্যাডমিন অ্যাকশনের সম্পূর্ণ ইতিহাস
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className={`btn-outline !py-2 text-xs ${isFetching ? "opacity-50" : ""}`}
        >
          <RefreshCcw
            className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          রিফ্রেশ
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="মোট লগ"
          value={stats.total}
          icon={Shield}
          color="bg-slate-700"
        />
        <StatCard
          label="তৈরি"
          value={stats.creates}
          icon={Plus}
          color="bg-emerald-500"
        />
        <StatCard
          label="আপডেট"
          value={stats.updates}
          icon={Edit3}
          color="bg-blue-500"
        />
        <StatCard
          label="মুছুন"
          value={stats.deletes}
          icon={Trash2}
          color="bg-red-500"
        />
      </div>

      {/* Filters */}
      <div className="card !p-4 space-y-3">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="সারাংশ, entity ID, বা টাইপ দিয়ে খুঁজুন..."
        />

        <div className="flex flex-wrap gap-2">
          {/* Entity type chips */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="h-3.5 w-3.5" /> ধরন:
          </div>
          {["", ...ENTITY_TYPES].map((e) => (
            <button
              key={e}
              onClick={() => setEntityType(e)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all capitalize ${
                entityType === e
                  ? "bg-[#0d1225] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {!e ? "সব" : e}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Action chips */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Activity className="h-3.5 w-3.5" /> অ্যাকশন:
          </div>
          {["", ...ACTIONS].map((a) => {
            const info = ACTION_STYLE[a];
            return (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  action === a
                    ? info
                      ? info.bg.split(" ")[0] +
                        " " +
                        info.bg.split(" ")[1] +
                        " border-transparent font-bold"
                      : "bg-[#e91e63] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {!a ? "সব" : info?.label || a}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {filtered.length} / {logs.length} লগ দেখানো হচ্ছে
            </p>
            <button
              onClick={() => {
                setEntityType("");
                setAction("");
                setSearch("");
              }}
              className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline font-medium"
            >
              <X className="h-3 w-3" /> ফিল্টার সাফ
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        {isLoading && (
          <div className="space-y-3 pl-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="card h-14 animate-pulse bg-slate-50 relative"
              >
                <div className="absolute -left-7 top-4 h-6 w-6 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="card py-20 text-center">
            <Activity className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">
              {hasFilters ? "এই ফিল্টারে কোনো লগ পাওয়া যায়নি" : "কোনো লগ নেই"}
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setEntityType("");
                  setAction("");
                  setSearch("");
                }}
                className="btn-outline mt-4 mx-auto text-xs"
              >
                ফিল্টার সাফ করুন
              </button>
            )}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div>
            {/* Date grouping */}
            {(() => {
              const grouped = {};
              filtered.forEach((log) => {
                const day = log.created_at
                  ? new Date(log.created_at).toLocaleDateString("en-BD", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Unknown";
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(log);
              });

              return Object.entries(grouped).map(([day, dayLogs]) => (
                <div key={day} className="mb-4">
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-3 pl-10">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {day}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {dayLogs.length} টি
                    </span>
                  </div>

                  {dayLogs.map((log, i) => (
                    <LogEntry
                      key={log.id || i}
                      log={log}
                      isLast={i === dayLogs.length - 1}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Results summary */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-center text-slate-400 pb-4">
          মোট {filtered.length} টি লগ দেখানো হচ্ছে
          {hasFilters && ` (ফিলটার করা: ${logs.length} থেকে)`}
        </p>
      )}
    </div>
  );
}
