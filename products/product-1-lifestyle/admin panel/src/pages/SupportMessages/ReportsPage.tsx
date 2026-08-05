// src/pages/SupportMessages/ReportsPage.tsx — V2-037
// Unified Support Reports inbox + distribution pool.
// Stat pills: Total | Unread | Unresolved | Open | In-Progress | Resolved
// Two tabs: Inbox (split-pane) | Distribution Pool

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle, Archive, CheckCircle2, Clock, FileText,
  Filter, ImagePlus, Inbox, Loader2, Mail, MessageSquare, RefreshCw,
  Search, SlidersHorizontal, Trash2, UserCheck, X, XCircle, Zap,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import { Pagination } from "@/components/ui";
import {
  useAdminReports,
  useAdminReportCounts,
  useAdminReport,
  useAdminReplyReport,
  useAdminAssignReport,
  useAdminUpdateReportStatus,
  useAdminDeleteReport,
  useReportDistributionSettings,
  useReportEligibleAdmins,
  useUpdateReportDistributionSettings,
  useUpsertReportAgent,
  useRemoveReportAgent,
  useRedistributeReports,
  // V2-038
  useManualAssignReport,
  useReportAssignmentLogs,
} from "@/hooks/useReports";
import { useAdmins } from "@/hooks/useAdmins";
import SupportDistributionPoolTab from "@/components/support/SupportDistributionPoolTab";
import SupportAssignTab from "@/components/support/SupportAssignTab";
import type {
  Report, ReportStatus, ReportPriority, ReportCategory, GetReportsParams,
} from "@/api/reports.api";

// ─── Helpers ──────────────────────────────────────────────────────────────── //

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Status / Priority config ─────────────────────────────────────────────── //

const STATUS_CONFIG: Record<ReportStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",   icon: <Inbox size={11} /> },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: <Clock size={11} /> },
  resolved:    { label: "Resolved",    cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400", icon: <CheckCircle2 size={11} /> },
  closed:      { label: "Closed",      cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",       icon: <XCircle size={11} /> },
};

const PRIORITY_CONFIG: Record<ReportPriority, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  normal: { label: "Normal", cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  high:   { label: "High",   cls: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" },
  urgent: { label: "Urgent", cls: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  product_issue: "Product Issue", order_issue: "Order Issue",
  fraud: "Fraud", general: "General", other: "Other",
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const c = STATUS_CONFIG[status];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", c.cls)}>{c.icon}{c.label}</span>;
}
function PriorityBadge({ priority }: { priority: ReportPriority }) {
  const c = PRIORITY_CONFIG[priority];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", c.cls)}>{c.label}</span>;
}

// ─── Stat Tab Types ───────────────────────────────────────────────────────── //

type TabKey = "all" | "unread" | "unresolved" | "open" | "in_progress" | "resolved";

const STAT_COLORS: Record<TabKey, string> = {
  all:         "text-gray-600 dark:text-gray-400",
  unread:      "text-violet-600 dark:text-violet-400",
  unresolved:  "text-orange-600 dark:text-orange-400",
  open:        "text-blue-600 dark:text-blue-400",
  in_progress: "text-amber-600 dark:text-amber-400",
  resolved:    "text-green-600 dark:text-green-400",
};

const STAT_ACTIVE_BG: Record<TabKey, string> = {
  all:         "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
  unread:      "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/30",
  unresolved:  "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30",
  open:        "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30",
  in_progress: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
  resolved:    "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30",
};

const STAT_ICONS: Record<TabKey, React.ReactNode> = {
  all:         <FileText size={13} />,
  unread:      <Mail size={13} />,
  unresolved:  <AlertTriangle size={13} />,
  open:        <Inbox size={13} />,
  in_progress: <Clock size={13} />,
  resolved:    <CheckCircle2 size={13} />,
};

// ─── Filters Bar ──────────────────────────────────────────────────────────── //

type Filters = Omit<GetReportsParams, "offset" | "limit">;

function FiltersBar({ filters, onChange, onRefresh, isRefetching }: {
  filters: Filters; onChange: (f: Partial<Filters>) => void;
  onRefresh: () => void; isRefetching: boolean;
}) {
  const [showAdv, setShowAdv] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search subject, name, email…"
            value={filters.search ?? ""}
            onChange={e => onChange({ search: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdv(v => !v)}
          className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
            showAdv ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300")}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>

        <button
          type="button" onClick={onRefresh} disabled={isRefetching}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{isRefetching ? "Refreshing…" : "Refresh"}</span>
        </button>
      </div>

      {showAdv && (
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 pb-3">
            <Filter size={14} className="text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Advanced Filters</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { key: "priority" as const, opts: [["all", "All Priority"], ["low", "Low"], ["normal", "Normal"], ["high", "High"], ["urgent", "Urgent"]] },
              { key: "category" as const, opts: [["all", "All Categories"], ...Object.entries(CATEGORY_LABELS).map(([v, l]) => [v, l])] },
              { key: "assigned" as const, opts: [["all", "All Assignments"], ["mine", "Assigned to Me"], ["unassigned", "Unassigned"]] },
              { key: "is_replied" as const, opts: [["all", "Any Reply Status"], ["false", "Unreplied"], ["true", "Replied"]] },
            ] as const).map(({ key, opts }) => (
              <select
                key={key}
                value={(filters as Record<string, string | undefined>)[key] ?? "all"}
                onChange={e => onChange({ [key]: e.target.value as never })}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report List Item ─────────────────────────────────────────────────────── //

function ReportListItem({ report, selected, onSelect }: { report: Report; selected: boolean; onSelect: (id: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className={cn(
        "w-full text-left px-4 py-3.5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0",
        selected
          ? "bg-brand-50 dark:bg-brand-500/10"
          : "hover:bg-gray-50 dark:hover:bg-white/[0.02]",
        !report.is_read && "border-l-2 border-l-brand-400 dark:border-l-brand-500"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          report.is_read
            ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            : "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
        )}>
          {initials(report.reporter_name)}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + time */}
          <div className="flex items-center justify-between gap-1">
            <p className={cn("truncate text-sm", report.is_read ? "font-medium text-gray-700 dark:text-gray-300" : "font-bold text-gray-900 dark:text-white")}>
              {report.reporter_name || report.reporter_email || "Anonymous"}
            </p>
            <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(report.created_at)}</span>
          </div>

          {/* Subject */}
          <p className="truncate text-xs text-gray-600 dark:text-gray-400 mt-0.5">{report.subject}</p>

          {/* Badges */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={report.status} />
            <PriorityBadge priority={report.priority} />
            {!report.is_replied && (
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                Unreplied
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────── //

function DetailPanel({
  reportId, isSuperAdmin,
}: { reportId: number; isSuperAdmin: boolean }) {
  const { data, isLoading } = useAdminReport(reportId);
  const report = data?.data;
  const reply  = useAdminReplyReport();
  const assign = useAdminAssignReport();
  const status = useAdminUpdateReportStatus();
  const del    = useAdminDeleteReport();
  const { data: adminsData } = useAdmins({ limit: 100 });
  const admins = adminsData?.data ?? [];

  const [replyText, setReplyText]     = useState("");
  const [replyChannels, setReplyChannels] = useState<Set<"email" | "sms">>(new Set(["email"]));
  const [showReply, setShowReply]     = useState(false);
  const [assignId, setAssignId]       = useState<number | "">("");
  const [replyImages, setReplyImages] = useState<File[]>([]);

  const toggleChannel = (ch: "email" | "sms") => {
    setReplyChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) { if (next.size > 1) next.delete(ch); } // keep at least one
      else next.add(ch);
      return next;
    });
  };

  useEffect(() => { setReplyText(""); setShowReply(false); setAssignId(""); setReplyChannels(new Set(["email"])); setReplyImages([]); }, [reportId]);

  if (isLoading) return (
    <div className="flex h-full items-center justify-center py-20">
      <Loader2 className="animate-spin text-brand-400" size={28} />
    </div>
  );
  if (!report) return null;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await reply.mutateAsync({ id: report.id, body: { reply_text: replyText, via: [...replyChannels].join(","), images: replyImages.length > 0 ? replyImages : undefined } });
    toast.success("Reply sent");
    setReplyText(""); setShowReply(false); setReplyImages([]);
  };

  const handleAssign = async () => {
    if (!assignId) return;
    await assign.mutateAsync({ id: report.id, admin_id: Number(assignId) });
    toast.success("Assigned successfully");
    setAssignId("");
  };

  const handleStatus = async (s: ReportStatus) => {
    await status.mutateAsync({ id: report.id, body: { status: s } });
    toast.success(`Status → ${s}`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-white/[0.03] dark:to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{report.subject}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              #{report.id} · {CATEGORY_LABELS[report.category]} · {fmtDate(report.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <StatusBadge status={report.status} />
            <PriorityBadge priority={report.priority} />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-5 py-4">
        {/* Reporter Info */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Name",  value: report.reporter_name  },
            { label: "Email", value: report.reporter_email },
            { label: "Phone", value: report.reporter_phone },
            { label: "Assigned To", value: report.assigned_to_admin_name },
          ].map(({ label, value }) => value ? (
            <div key={label} className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
            </div>
          ) : null)}
        </div>

        {/* Description */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Description</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{report.description}</p>
          {/* Report-level images */}
          {report.images && report.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {report.images.map((src, i) => (
                <a key={i} href={toPublicUrl(src)} target="_blank" rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md">
                  <img src={toPublicUrl(src)} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Replies thread */}
        {report.replies && report.replies.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Replies</p>
            {report.replies.map(r => (
              <div key={r.id} className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{r.admin_name || "Admin"}</p>
                  <span className="text-[10px] text-gray-400">{fmtDate(r.created_at)}</span>
                  <span className="ml-auto text-[10px] text-gray-400 uppercase">{r.reply_via}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.reply_text}</p>
                {/* Reply images */}
                {r.images && r.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.images.map((src, i) => (
                      <a key={i} href={toPublicUrl(src)} target="_blank" rel="noopener noreferrer"
                        className="block h-14 w-14 overflow-hidden rounded-lg border border-brand-200/50 dark:border-brand-500/20 transition-shadow hover:shadow-md">
                        <img src={toPublicUrl(src)} alt={`Reply image ${i + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowReply(v => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition"
          >
            <MessageSquare size={13} /> Reply
          </button>

          {/* Status Quick-Actions */}
          {(["open", "in_progress", "resolved", "closed"] as ReportStatus[])
            .filter(s => s !== report.status)
            .map(s => (
              <button
                key={s}
                type="button"
                disabled={status.isPending}
                onClick={() => handleStatus(s)}
                className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition", STATUS_CONFIG[s].cls)}
              >
                {STATUS_CONFIG[s].icon} → {STATUS_CONFIG[s].label}
              </button>
            ))
          }

          {isSuperAdmin && (
            <button
              type="button"
              disabled={del.isPending}
              onClick={async () => { if (confirm("Delete this report?")) await del.mutateAsync(report.id); }}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 transition"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/5 p-4 space-y-3">
            <textarea
              rows={4}
              placeholder="Type your reply…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
            {/* Reply image attachment row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {replyImages.map((file, i) => (
                <div key={i} className="group relative h-12 w-12 rounded-lg border border-brand-200/50 bg-white overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt={`att-${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setReplyImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {replyImages.length < 4 && (
                <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-brand-300 bg-white/60 text-brand-400 transition hover:border-brand-500 hover:bg-brand-50">
                  <ImagePlus size={16} />
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; setReplyImages(prev => [...prev, ...files].slice(0, 4)); }} />
                </label>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Via:</label>
              {(["email", "sms"] as const).map(v => {
                const active = replyChannels.has(v);
                const disabled = v === "sms" && !report.reporter_phone;
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={disabled}
                    title={disabled ? "Reporter has no phone number" : undefined}
                    onClick={() => toggleChannel(v)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold border transition",
                      disabled ? "opacity-40 cursor-not-allowed border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800" :
                      active ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" :
                      "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800"
                    )}
                  >
                    {active && <span className="mr-1">✓</span>}{v.toUpperCase()}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={reply.isPending || !replyText.trim()}
                onClick={handleReply}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition"
              >
                {reply.isPending ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Send
              </button>
              <button type="button" onClick={() => { setShowReply(false); setReplyImages([]); }}>
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Assign panel */}
        {(isSuperAdmin || true) && admins.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
              <UserCheck size={12} /> Assign / Reassign
            </p>
            <div className="flex gap-2">
              <select
                value={assignId}
                onChange={e => setAssignId(Number(e.target.value) || "")}
                className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                <option value="">-- Select Admin --</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {`${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || `Admin #${a.id}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!assignId || assign.isPending}
                onClick={handleAssign}
                className="px-4 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 disabled:opacity-60 transition"
              >
                {assign.isPending ? <Loader2 size={13} className="animate-spin" /> : "Assign"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────── //

type PageTab = "inbox" | "pool" | "assign";

export default function ReportsPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin  = hasRole("SUPER_ADMIN");
  const isAdmin       = hasRole("ADMIN");
  const isOrderManager = hasRole("ORDER_MANAGER");
  const canManagePool  = isSuperAdmin || isAdmin; // Pool tab: SUPER_ADMIN + ADMIN only
  const canAssign      = isSuperAdmin || isAdmin || isOrderManager; // Assign tab

  // Stat tab
  const [statTab, setStatTab] = useState<TabKey>("all");
  // Page-level tabs
  const [pageTab, setPageTab] = useState<PageTab>("inbox");
  // List state
  const [page, setPage]     = useState(1);
  const pageSize = 20;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Deep-link: auto-select report from ?reportId=X ───────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkId = searchParams.get("reportId") ? Number(searchParams.get("reportId")) : null;
  const deepLinkConsumedRef = useRef(false);

  // Counts
  const countsQ = useAdminReportCounts();
  const counts  = countsQ.data?.data;

  // Stat tabs
  const statTabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all",         label: "Total",       count: counts?.total       ?? 0 },
    { key: "unread",      label: "Unread",       count: counts?.unread      ?? 0 },
    { key: "unresolved",  label: "Unresolved",   count: counts?.unresolved  ?? 0 },
    { key: "open",        label: "Open",         count: counts?.open        ?? 0 },
    { key: "in_progress", label: "In Progress",  count: counts?.in_progress ?? 0 },
    { key: "resolved",    label: "Resolved",     count: counts?.resolved    ?? 0 },
  ];

  // Map stat tab → filter params
  const tabFilters = useCallback((): Partial<Filters> => {
    if (statTab === "unread")      return { is_read: "false" };
    if (statTab === "unresolved")  return {}; // special: status open+in_progress handled below
    if (statTab === "open")        return { status: "open" };
    if (statTab === "in_progress") return { status: "in_progress" };
    if (statTab === "resolved")    return { status: "resolved" };
    return {};
  }, [statTab]);

  const handleStatTab = (key: TabKey) => {
    setStatTab(key);
    setPage(1);
    if (key === "unresolved") {
      setFilters({});
    } else {
      setFilters(tabFilters());
    }
  };

  // Compose query params
  const listParams: GetReportsParams = {
    ...filters,
    ...(statTab === "unresolved" ? {} : {}), // status handled by filters
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };

  const listQ = useAdminReports(listParams);
  const rows  = listQ.data?.data ?? [];
  const total = listQ.data?.total ?? 0;

  // Auto-select first row
  useEffect(() => {
    if (!selectedId && rows.length > 0) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  // Auto-select deep-link report when rows arrive
  useEffect(() => {
    if (!deepLinkId || deepLinkConsumedRef.current || rows.length === 0) return;
    // The target report may be on a different page; select it directly by ID
    // even if it's not in the current page — the detail panel fetches it individually.
    deepLinkConsumedRef.current = true;
    setSelectedId(deepLinkId);
    setSearchParams((prev) => { prev.delete("reportId"); return prev; }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId, rows]);

  // Distribution pool hooks
  const settingsQ  = useReportDistributionSettings();
  const eligibleQ  = useReportEligibleAdmins();
  const updSettings = useUpdateReportDistributionSettings();
  const upsert     = useUpsertReportAgent();
  const remove     = useRemoveReportAgent();
  const redist     = useRedistributeReports();

  const settings = settingsQ.data?.data;
  const eligibleAdmins = (eligibleQ.data?.data ?? []).map(a => ({
    ...a,
    max_active_reports: a.max_active_reports,
  }));

  const handleRefresh = () => {
    countsQ.refetch();
    listQ.refetch();
  };

  const isRefetching = listQ.isFetching && !listQ.isLoading;

  return (
    <>
      <PageMeta
        title="Support Reports"
        description="Manage customer support reports — assign, reply, and track resolution"
      />
      <div className="w-full px-4 py-6 md:px-8">
        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Archive className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Support Reports</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage formal customer reports — assign, reply and track resolution.
            </p>
          </div>
        </div>

        {/* ── Stat Pills + Refresh ─────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {statTabs.map(tab => {
              const active = statTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleStatTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                    STAT_COLORS[tab.key],
                    active ? STAT_ACTIVE_BG[tab.key] : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60 hover:border-gray-300",
                  )}
                >
                  {STAT_ICONS[tab.key]}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    active ? "bg-white/60 dark:bg-black/20" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Page-level tabs — Pool & Assign hidden from non-admins */}
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
            {([
              { id: "inbox"  as const, label: "Inbox",             restricted: "none"   },
              { id: "pool"   as const, label: "Distribution Pool", restricted: "pool"   },
              { id: "assign" as const, label: "Assign",            restricted: "assign" },
            ] as const).filter(t => {
              if (t.restricted === "none")   return true;
              if (t.restricted === "pool")   return canManagePool;
              if (t.restricted === "assign") return canAssign;
              return false;
            }).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPageTab(t.id)}
                className={cn(
                  "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all",
                  pageTab === t.id
                    ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ─────────────────────────────────── */}
        {pageTab === "inbox" && (
          <div className="space-y-4">
            {/* Filters bar */}
            <FiltersBar
              filters={filters}
              onChange={patch => { setFilters(f => ({ ...f, ...patch })); setPage(1); }}
              onRefresh={handleRefresh}
              isRefetching={isRefetching}
            />

            {/* Split pane */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left: Inbox list */}
              <div className="flex flex-col lg:col-span-5">
                <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  {/* Inbox header */}
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
                    <Inbox size={16} className="text-brand-500" />
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Inbox</p>
                    <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {total}
                    </span>
                  </div>

                  {/* List */}
                  <div className="min-h-[320px] flex-1 overflow-y-auto">
                    {listQ.isLoading ? (
                      <div className="space-y-3 p-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                          </div>
                        ))}
                      </div>
                    ) : rows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
                        <Archive className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-400">No reports found.</p>
                      </div>
                    ) : (
                      rows.map(r => (
                        <ReportListItem
                          key={r.id}
                          report={r}
                          selected={selectedId === r.id}
                          onSelect={setSelectedId}
                        />
                      ))
                    )}
                  </div>
                </div>
                {/* Pagination */}
                <div className="mt-3">
                  <Pagination
                    totalItems={total}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={() => {}}
                  />
                </div>
              </div>

              {/* Right: Detail panel */}
              <div className="lg:col-span-7">
                <div className="min-h-[500px] overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  {selectedId ? (
                    <DetailPanel reportId={selectedId} isSuperAdmin={isSuperAdmin} />
                  ) : (
                    <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 px-5 py-10">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <Inbox className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </span>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {rows.length ? "Select a report to view details" : "No reports to display"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {pageTab === "pool" && canManagePool && (
          <SupportDistributionPoolTab
            domain="reports"
            isSuperAdmin={isSuperAdmin}
            settings={settings ? {
              auto_assign_enabled: settings.auto_assign_enabled,
              assign_on_create: settings.assign_on_report_create,
              include_admin_role: settings.include_admin_role,
              include_order_manager_role: settings.include_order_manager_role,
            } : null}
            settingsLoading={settingsQ.isLoading}
            admins={eligibleAdmins}
            adminsLoading={eligibleQ.isLoading}
            settingsPending={updSettings.isPending}
            redistributePending={redist.isPending}
            onToggleSetting={(key, val) => {
              const mapped: Record<string, string> = {
                auto_assign_enabled: "auto_assign_enabled",
                assign_on_create: "assign_on_report_create",
                include_admin_role: "include_admin_role",
                include_order_manager_role: "include_order_manager_role",
              };
              updSettings.mutate(
                { [mapped[key]]: val } as Parameters<typeof updSettings.mutate>[0],
                {
                  onSuccess: () => toast.success("Setting updated"),
                  onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed"),
                }
              );
            }}
            onAddToPool={async admin => {
              await upsert.mutateAsync({ adminId: admin.id, body: { auto_assign_enabled: true, status: true } });
              toast.success(`${admin.admin_name} added to report pool`);
            }}
            onRemoveFromPool={async admin => {
              await remove.mutateAsync(admin.id);
              toast.success(`${admin.admin_name} removed from report pool`);
            }}
            onToggleAutoAssign={async admin => {
              await upsert.mutateAsync({ adminId: admin.id, body: { auto_assign_enabled: !admin.pool_auto_assign } });
            }}
            onSaveConfig={async (admin, maxVal, serialVal) => {
              await upsert.mutateAsync({
                adminId: admin.id,
                body: {
                  ...(maxVal !== undefined ? { max_active_reports: maxVal ? Number(maxVal) : null } : {}),
                  ...(serialVal !== undefined ? { serial: Number(serialVal) || 1 } : {}),
                },
              });
              toast.success("Pool settings saved");
            }}
            onRedistribute={async () => {
              const res = await redist.mutateAsync();
              toast.success(res.message);
            }}
          />
        )}

        {pageTab === "assign" && canAssign && (
          <AssignReportsTab isSuperAdmin={isSuperAdmin} rows={rows} rowsLoading={listQ.isLoading} />
        )}
      </div>
    </>
  );
}

// ─── Assign Tab (Reports) — V2-039 ────────────────────────────────────────── //

function AssignReportsTab({ isSuperAdmin, rows, rowsLoading }: {
  isSuperAdmin: boolean;
  rows: Report[];
  rowsLoading: boolean;
}) {
  const { admin } = useAuth();
  const eligibleQ = useReportEligibleAdmins();
  const assignMut = useManualAssignReport();
  const { data: logsRes, isLoading: logsLoading } = useReportAssignmentLogs({ limit: 20 });

  const admins = (eligibleQ.data?.data ?? []).map(a => ({
    id: a.id,
    admin_name: a.admin_name,
    role_name:  a.role_name,
    active_count: a.active_report_count ?? 0,
  }));

  // Convert open/in-progress rows to AssignableItem[]
  const items = rows
    .filter(r => r.status === "open" || r.status === "in_progress")
    .map(r => ({
      id: r.id,
      label: r.reporter_name || r.reporter_email || r.reporter_phone || "Anonymous",
      subject: r.subject,
      assigned_to: r.assigned_to_admin_name ?? null,
    }));

  const logs = (logsRes?.data ?? []).map(l => ({
    id: l.id,
    entity_id: l.report_id,
    action_type: l.action_type,
    from_admin_name: l.from_admin_name,
    to_admin_name:   l.to_admin_name,
    changed_by_name: l.changed_by_name,
    created_at: l.created_at,
  }));

  const handleAssign = async (reportId: number, adminId: number) => {
    try {
      const res = await assignMut.mutateAsync({ report_id: reportId, admin_id: adminId });
      toast.success(res.message);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Assignment failed");
    }
  };

  return (
    <SupportAssignTab
      domain="reports"
      isSuperAdmin={isSuperAdmin}
      currentAdminId={admin?.id ?? 0}
      admins={admins}
      items={items}
      itemsLoading={rowsLoading}
      logs={logs}
      logsLoading={logsLoading}
      isPending={assignMut.isPending}
      onAssign={handleAssign}
    />
  );
}
