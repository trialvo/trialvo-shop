"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  reportService,
  type MyReport,
  type ReportStatus,
  type ReportPriority,
  type ReportCategory,
} from "@/lib/api/report/service";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";

type StatusMeta = { label: string; cls: string; icon: React.ReactNode };
type PriorityMeta = { label: string; dot: string };

const STATUS_CONFIG: Record<ReportStatus, StatusMeta> = {
  open: {
    label: "Open",
    cls: "bg-blue-50 text-blue-700 border-blue-100",
    icon: <Inbox className="h-3 w-3" />,
  },
  in_progress: {
    label: "In Progress",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
    icon: <Clock className="h-3 w-3" />,
  },
  resolved: {
    label: "Resolved",
    cls: "bg-green-50 text-green-700 border-green-100",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  closed: {
    label: "Closed",
    cls: "bg-gray-50 text-gray-500 border-gray-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const PRIORITY_CONFIG: Record<ReportPriority, PriorityMeta> = {
  low: { label: "Low", dot: "bg-gray-300" },
  normal: { label: "Normal", dot: "bg-blue-400" },
  high: { label: "High", dot: "bg-orange-400" },
  urgent: { label: "Urgent", dot: "bg-red-500" },
};

const CATEGORY_LABELS: Record<ReportCategory | string, string> = {
  product_issue: "Product Issue",
  order_issue: "Order Issue",
  fraud: "Fraud",
  general: "General",
  other: "Other",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 border-b border-black/[0.04] px-5 py-4 last:border-0 animate-pulse">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-gray-100" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded bg-gray-100" />
          <div className="h-5 w-12 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-1 h-4 w-4 rounded bg-gray-100" />
    </div>
  );
}

function ReportRow({
  report,
  highlighted,
  highlightRef,
}: {
  report: MyReport;
  highlighted: boolean;
  highlightRef: React.RefObject<HTMLAnchorElement | null>;
}) {
  const sc = STATUS_CONFIG[report.status];
  const pc = PRIORITY_CONFIG[report.priority];
  const isUnread = !report.is_read;

  return (
    <Link
      ref={highlighted ? highlightRef : null}
      href={`/track-report?token=${report.tracking_token}`}
      className={[
        "group relative flex items-start justify-between gap-3",
        "border-b border-black/[0.04] px-5 py-4 last:border-0",
        "transition-all duration-200",
        highlighted
          ? "bg-amber-50/80"
          : "hover:bg-black/[0.015]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="mt-[7px] shrink-0">
          <span
            className={[
              "block h-[7px] w-[7px] rounded-full transition-colors",
              isUnread ? "bg-black" : "bg-transparent",
            ].join(" ")}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={[
                "truncate text-sm leading-snug",
                isUnread
                  ? "font-bold text-black"
                  : "font-medium text-black/75",
              ].join(" ")}
            >
              {report.subject}
            </p>
            <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
              {timeAgo(report.created_at)}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-gray-400">
            {CATEGORY_LABELS[report.category] ?? report.category}
            <span className="mx-1.5 text-gray-300">·</span>
            {formatDate(report.created_at)}
          </p>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span
              className={[
                "inline-flex items-center gap-1 border px-2 py-0.5",
                "text-[11px] font-semibold leading-none",
                sc.cls,
              ].join(" ")}
            >
              {sc.icon}
              {sc.label}
            </span>

            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${pc.dot}`} />
              {pc.label}
            </span>

            {!report.is_replied && (
              <span className="inline-flex items-center gap-1 border border-rose-100 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                <Clock className="h-2.5 w-2.5" />
                Awaiting Reply
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-black" />
    </Link>
  );
}

const PAGE_LIMIT = 10;

type Props = {
  highlightReportId?: number | null;
};

const MyReportsCard: React.FC<Props> = ({ highlightReportId }) => {
  const { user, isLoading: authLoading } = useAuth();

  const [reports, setReports] = useState<MyReport[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const highlightRef = useRef<HTMLAnchorElement | null>(null);

  const fetchReports = useCallback(async (uid: number, off: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.getMyReports(uid, PAGE_LIMIT, off);
      const rows = res.data ?? [];
      if (off === 0) {
        setReports(rows);
      } else {
        setReports((prev) => [...prev, ...rows]);
      }
      setTotal(
        rows.length < PAGE_LIMIT
          ? off + rows.length
          : off + PAGE_LIMIT + 1,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchReports(user.id, 0);
  }, [user?.id, fetchReports]);

  useEffect(() => {
    if (highlightReportId && reports.length > 0) {
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightReportId, reports.length]);

  const handleLoadMore = () => {
    if (!user?.id || loading) return;
    const next = offset + PAGE_LIMIT;
    setOffset(next);
    fetchReports(user.id, next);
  };

  const handleRefresh = () => {
    if (!user?.id || loading) return;
    setOffset(0);
    fetchReports(user.id, 0);
  };

  const hasMore = reports.length > 0 && reports.length % PAGE_LIMIT === 0;

  const stats = useMemo(() => {
    const unread = reports.filter((r) => !r.is_read).length;
    const awaitingReply = reports.filter((r) => !r.is_replied).length;
    return { unread, awaitingReply, total: reports.length };
  }, [reports]);

  void total;

  if (authLoading) {
    return (
      <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse bg-gray-100" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-black">My Reports</h3>
              {stats.unread > 0 && (
                <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center bg-black px-1 text-[10px] font-bold tabular-nums text-white">
                  {stats.unread}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Track your support reports and complaint history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center border border-black/[0.06] bg-white text-gray-500 transition-colors hover:bg-black hover:text-white disabled:opacity-40"
            aria-label="Refresh reports"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/submit-report"
            className="inline-flex items-center gap-1.5 border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            New Report
          </Link>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="flex items-center gap-4 border-b border-black/[0.04] bg-gray-50/50 px-5 py-2">
          <span className="text-[11px] text-gray-400">
            <span className="font-semibold tabular-nums text-black">{stats.total}</span> total
          </span>
          {stats.unread > 0 && (
            <span className="text-[11px] text-gray-400">
              <span className="font-semibold tabular-nums text-black">{stats.unread}</span> unread
            </span>
          )}
          {stats.awaitingReply > 0 && (
            <span className="text-[11px] text-gray-400">
              <span className="font-semibold tabular-nums text-rose-600">{stats.awaitingReply}</span> awaiting reply
            </span>
          )}
        </div>
      )}

      {error ? (
        <div className="flex items-start gap-3 px-5 py-8">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-black">
              Something went wrong
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-black hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        </div>
      ) : loading && reports.length === 0 ? (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center bg-black/[0.03]">
            <FileText className="h-7 w-7 text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-bold text-black">
            No reports yet
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-400">
            Submit a support report if you have a product issue, order problem,
            or need assistance.
          </p>
          <Link
            href="/submit-report"
            className="mt-5 inline-flex items-center gap-2 bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            <Plus className="h-4 w-4" />
            Submit Your First Report
          </Link>
        </div>
      ) : (
        <>
          <div>
            {reports.map((r) => (
              <ReportRow
                key={r.id}
                report={r}
                highlighted={r.id === highlightReportId}
                highlightRef={highlightRef}
              />
            ))}
          </div>

          {hasMore && (
            <div className="border-t border-black/[0.04] px-5 py-3 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-black transition-opacity hover:underline disabled:opacity-40"
              >
                {loading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {loading ? "Loading…" : "Load More Reports"}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-black/[0.04] bg-gray-50/40 px-5 py-3">
            <Link
              href="/track-report"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-60"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Track a report with token
            </Link>
            <Link
              href="/submit-report"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit new report
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default MyReportsCard;
