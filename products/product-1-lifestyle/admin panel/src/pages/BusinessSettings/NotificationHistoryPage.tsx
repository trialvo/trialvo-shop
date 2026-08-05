/**
 * NotificationHistoryPage.tsx — V2-040 Redesign (Theme Fixed)
 * Uses the admin panel design system: bg-white, border-gray-200, text-gray-900,
 * brand-500 accent, underline tabs — matching DiscountRulesPage / OrderDistributionPage style.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell, Mail, MessageSquare, Smartphone, Search, RefreshCw,
  CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight,
  Inbox, Send, CalendarDays, X, ChevronDown,
} from "lucide-react";
import {
  useNotificationLogs,
  useNotificationBatches,
} from "@/hooks/useNotificationHistory";
import type { NotificationLog, NotificationBatch } from "@/api/notification-history.api";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SH  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Tiny Calendar Component ─────────────────────────────────────────────────

function Calendar({
  value,
  onChange,
  onClose,
}: {
  value: string;          // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const init = value ? new Date(value + "T00:00:00") : today;
  const [view, setView] = useState({ year: init.getFullYear(), month: init.getMonth() });

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pad = (n: number) => String(n).padStart(2, "0");

  function selectDay(d: number) {
    const iso = `${view.year}-${pad(view.month + 1)}-${pad(d)}`;
    onChange(iso);
    onClose();
  }

  function prevMonth() {
    setView(v => {
      const m = v.month === 0 ? 11 : v.month - 1;
      const y = v.month === 0 ? v.year - 1 : v.year;
      return { year: y, month: m };
    });
  }
  function nextMonth() {
    setView(v => {
      const m = v.month === 11 ? 0 : v.month + 1;
      const y = v.month === 11 ? v.year + 1 : v.year;
      return { year: y, month: m };
    });
  }

  const selectedStr = value;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-64 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {MONTHS[view.month]} {view.year}
        </span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ChevronRight size={15} />
        </button>
      </div>
      {/* Day-of-week row */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SH.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = `${view.year}-${pad(view.month + 1)}-${pad(d)}`;
          const isSelected = iso === selectedStr;
          const isToday    = iso === todayStr;
          return (
            <button
              key={i}
              onClick={() => selectDay(d)}
              className={`
                h-8 w-full flex items-center justify-center rounded-lg text-sm transition-colors
                ${isSelected
                  ? "bg-brand-500 text-white font-semibold"
                  : isToday
                  ? "border border-brand-400 text-brand-600 dark:text-brand-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}
              `}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DatePicker field ────────────────────────────────────────────────────────

function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
      >
        <CalendarDays size={14} className="text-gray-400 shrink-0" />
        <span className={`flex-1 truncate ${!display ? "text-gray-400" : ""}`}>
          {display || placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
            className="text-gray-400 hover:text-red-500"
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown size={12} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0">
          <Calendar value={value} onChange={onChange} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ─── Styled Select ────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-colors cursor-pointer"
    >
      {children}
    </select>
  );
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
    email: {
      icon: <Mail size={10} />,
      cls:  "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      label: "Email",
    },
    sms: {
      icon: <MessageSquare size={10} />,
      cls:  "bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      label: "SMS",
    },
    push: {
      icon: <Smartphone size={10} />,
      cls:  "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
      label: "Push",
    },
  };
  const c = map[channel] ?? {
    icon: <Bell size={10} />,
    cls:  "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400",
    label: channel,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    sent:      { icon: <CheckCircle size={10} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
    delivered: { icon: <CheckCircle size={10} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
    failed:    { icon: <XCircle size={10} />,    cls: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
    queued:    { icon: <Clock size={10} />,       cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    cancelled: { icon: <XCircle size={10} />,    cls: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400" },
  };
  const c = map[status] ?? { icon: null, cls: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${c.cls}`}>
      {c.icon} {status}
    </span>
  );
}

function BatchStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed:  "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    processing: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    failed:     "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    pending:    "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
      {status}
    </span>
  );
}

function CategoryLabel({ category }: { category: string }) {
  const labels: Record<string, string> = {
    order_status:    "Order Status",
    order_admin:     "Order Alert",
    contact_reply:   "Contact Reply",
    contact_admin:   "Contact Alert",
    report_reply:    "Report Reply",
    report_admin:    "Report Alert",
    personal:        "Personal",
    announcement:    "Announcement",
    forgot_password: "Password Reset",
    welcome:         "Welcome",
    system:          "System",
    other:           "Other",
  };
  return <span className="text-xs text-gray-500 dark:text-gray-400">{labels[category] ?? category}</span>;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function truncate(s: string | null, n = 60) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = page * pageSize + 1;
  const end   = Math.min((page + 1) * pageSize, total);

  // Build page buttons: always show first, last, current ±1
  const toShow = new Set<number>();
  toShow.add(0);
  toShow.add(totalPages - 1);
  toShow.add(page);
  if (page > 0) toShow.add(page - 1);
  if (page < totalPages - 1) toShow.add(page + 1);
  const pages = Array.from(toShow).sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Showing {start}–{end} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={13} /> Prev
        </button>

        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const gap  = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {gap && <span className="text-gray-400 px-1">…</span>}
              <button
                onClick={() => onPage(p)}
                className={`min-w-[30px] h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {p + 1}
              </button>
            </span>
          );
        })}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

interface LogFilters {
  channel: string;
  category: string;
  status: string;
  search: string;
  date_from: string;
  date_to: string;
}

const EMPTY_LOG_FILTERS: LogFilters = {
  channel: "", category: "", status: "", search: "", date_from: "", date_to: "",
};

function LogsTab() {
  const [page, setPage]       = useState(0);
  const [filters, setFilters] = useState<LogFilters>(EMPTY_LOG_FILTERS);
  const [search, setSearch]   = useState("");

  // Auto-apply filter changes immediately (except search — use Enter/button)
  const setField = useCallback(<K extends keyof LogFilters>(key: K, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(0);
  }, []);

  function applySearch() {
    setFilters(prev => ({ ...prev, search }));
    setPage(0);
  }

  function clearAll() {
    setFilters(EMPTY_LOG_FILTERS);
    setSearch("");
    setPage(0);
  }

  const params = {
    channel:    filters.channel   || undefined,
    category:   filters.category  || undefined,
    status:     filters.status    || undefined,
    search:     filters.search    || undefined,
    date_from:  filters.date_from || undefined,
    date_to:    filters.date_to   || undefined,
    limit:  PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch, isFetching } = useNotificationLogs(params);
  const logs: NotificationLog[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const hasFilter = Object.values(filters).some(v => v !== "");

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Channel */}
          <FilterSelect value={filters.channel} onChange={v => setField("channel", v)}>
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
          </FilterSelect>

          {/* Category */}
          <FilterSelect value={filters.category} onChange={v => setField("category", v)}>
            <option value="">All Categories</option>
            <option value="order_status">Order Status</option>
            <option value="order_admin">Order Admin Alert</option>
            <option value="contact_reply">Contact Reply</option>
            <option value="contact_admin">Contact Admin Alert</option>
            <option value="report_reply">Report Reply</option>
            <option value="report_admin">Report Admin Alert</option>
            <option value="personal">Personal</option>
            <option value="announcement">Announcement</option>
            <option value="forgot_password">Password Reset</option>
            <option value="welcome">Welcome</option>
            <option value="system">System</option>
          </FilterSelect>

          {/* Status */}
          <FilterSelect value={filters.status} onChange={v => setField("status", v)}>
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
            <option value="read">Read</option>
          </FilterSelect>

          {/* From date */}
          <DatePicker
            value={filters.date_from}
            onChange={v => setField("date_from", v)}
            placeholder="From date"
          />

          {/* To date */}
          <DatePicker
            value={filters.date_to}
            onChange={v => setField("date_to", v)}
            placeholder="To date"
          />

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applySearch()}
              placeholder="Email, phone, title…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={applySearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Search size={13} /> Search
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>

          {hasFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {total.toLocaleString()} total logs
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-48 text-red-500 gap-2">
            <XCircle size={20} />
            <p className="text-sm">Failed to load notification logs.</p>
            <button onClick={() => refetch()} className="text-xs text-brand-500 hover:underline">Try again</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Inbox size={28} className="opacity-40" />
            <p className="text-sm font-medium text-gray-500">No logs found{hasFilter ? " for selected filters" : ""}.</p>
            {hasFilter && (
              <button onClick={clearAll} className="text-xs text-brand-500 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[780px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {["Channel", "Category", "Recipient", "Title / Message", "Status", "Sent At"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${i === logs.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ChannelBadge channel={log.channel} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryLabel category={log.category} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs leading-relaxed">
                        {log.recipient_user_name && (
                          <div className="font-semibold text-gray-800 dark:text-gray-100">{log.recipient_user_name}</div>
                        )}
                        {log.recipient_admin_name && (
                          <div className="font-semibold text-brand-600 dark:text-brand-400">
                            {log.recipient_admin_name}
                            <span className="text-gray-400 font-normal ml-1">(admin)</span>
                          </div>
                        )}
                        {log.recipient_email && (
                          <div className="text-gray-500 dark:text-gray-400">{log.recipient_email}</div>
                        )}
                        {log.recipient_phone && (
                          <div className="text-gray-500 dark:text-gray-400">{log.recipient_phone}</div>
                        )}
                        {!log.recipient_email && !log.recipient_phone && !log.recipient_admin_name && !log.recipient_user_name && (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      {log.title && (
                        <div className="font-medium text-gray-800 dark:text-gray-100 text-xs truncate" title={log.title}>
                          {truncate(log.title, 50)}
                        </div>
                      )}
                      {log.message && (
                        <div className="text-gray-400 text-xs truncate" title={log.message}>
                          {truncate(log.message, 60)}
                        </div>
                      )}
                      {log.error_message && (
                        <div className="text-red-500 text-xs truncate mt-0.5" title={log.error_message}>
                          ⚠ {truncate(log.error_message, 50)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(log.sent_at || log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      </div>
    </div>
  );
}

// ─── Batches Tab ──────────────────────────────────────────────────────────────

function BatchesTab() {
  const [page, setPage]       = useState(0);
  const [sourceType, setST]   = useState("");
  const [status, setStatus]   = useState("");

  const params = {
    source_type: sourceType || undefined,
    status:      status     || undefined,
    limit:  PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch, isFetching } = useNotificationBatches(params);
  const batches: NotificationBatch[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const successRate = (b: NotificationBatch) => {
    if (!b.total_target) return null;
    return Math.round((b.total_sent / b.total_target) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={sourceType} onChange={v => { setST(v); setPage(0); }}>
            <option value="">All Sources</option>
            <option value="announcement">Announcement</option>
            <option value="manual_announcement">Manual Announcement</option>
          </FilterSelect>
          <FilterSelect value={status} onChange={v => { setStatus(v); setPage(0); }}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </FilterSelect>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </button>
          <span className="ml-auto text-xs text-gray-400">{total.toLocaleString()} batches</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-48 text-red-500 gap-2">
            <XCircle size={18} /> Failed to load batches.
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-3">
            <Send size={32} className="opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No announcement batches yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Batches appear here when you send an announcement.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[860px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {["#", "Source", "Channel", "Title", "Target", "Sent", "Failed", "Success", "Status", "Started"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((b, i) => {
                  const rate = successRate(b);
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${i === batches.length - 1 ? "border-b-0" : ""}`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-400">#{b.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {(b.source_type ?? "—").replace("_", " ")}
                        </div>
                        {b.announcement_headline && (
                          <div className="text-xs text-gray-400 truncate max-w-[100px]" title={b.announcement_headline}>
                            {truncate(b.announcement_headline, 22)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ChannelBadge channel={b.channel ?? "email"} />
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate block" title={b.title ?? undefined}>
                          {truncate(b.title, 35) ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {b.total_target?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {b.total_sent?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-red-500 dark:text-red-400">
                        {b.total_failed?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {rate !== null ? (
                          <div className="flex items-center gap-2 min-w-[70px]">
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${rate >= 90 ? "bg-emerald-500" : rate >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 shrink-0">{rate}%</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BatchStatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                        {formatDate(b.started_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "logs" | "batches";

export default function NotificationHistoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  return (
    <>
      {/* Page header */}
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell size={22} className="text-brand-500" />
          Notification History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Full audit trail of every notification sent — orders, contacts, reports, announcements, and personal alerts.
        </p>
      </div>

      {/* Underline tabs — matching DiscountRulesPage pattern */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
        {(["logs", "batches"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab === "logs" ? (
              <><Bell size={14} /> Notification Logs</>
            ) : (
              <><Send size={14} /> Announcement Batches</>
            )}
          </button>
        ))}
      </div>

      {activeTab === "logs"    && <LogsTab />}
      {activeTab === "batches" && <BatchesTab />}
    </>
  );
}
