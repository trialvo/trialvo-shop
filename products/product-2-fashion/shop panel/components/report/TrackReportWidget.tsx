"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IMAGE_URL } from "@/config/env";
import {
  reportService,
  type TrackedReport,
  type ReportStatus,
  type ReportPriority,
} from "@/lib/api/report/service";
import {
  getSavedReportTokens,
  removeReportToken,
  type SavedToken,
} from "@/lib/reportTokenStore";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

const CATEGORY_LABELS: Record<string, string> = {
  product_issue: "Product Issue",
  order_issue: "Order Issue",
  fraud: "Fraud",
  general: "General",
  other: "Other",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function imgUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${IMAGE_URL}${path}`;
}

function ImageGallery({ images, label }: { images: string[]; label?: string }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="mt-3">
      {label && (
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          <ImageIcon className="h-3 w-3" /> {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {images.map((src, i) => (
          <a
            key={i}
            href={imgUrl(src)}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-16 w-16 overflow-hidden border border-black/[0.06] transition-shadow hover:shadow-md sm:h-20 sm:w-20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(src)} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

const STATUS_ORDER: ReportStatus[] = ["open", "in_progress", "resolved", "closed"];

function SavedTokensList({
  onSelect,
  activeToken,
}: {
  onSelect: (token: string) => void;
  activeToken: string;
}) {
  const [saved, setSaved] = useState<SavedToken[]>([]);

  useEffect(() => {
    setSaved(getSavedReportTokens());
  }, []);

  if (saved.length === 0) return null;

  const handleRemove = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    removeReportToken(token);
    setSaved(getSavedReportTokens());
  };

  return (
    <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Your Saved Reports
        </p>
        <span className="flex h-4.5 min-w-[18px] items-center justify-center bg-black px-1 text-[10px] font-bold tabular-nums text-white">
          {saved.length}
        </span>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {saved.map((s) => {
          const isActive = s.token === activeToken;
          return (
            <button
              key={s.token}
              type="button"
              onClick={() => onSelect(s.token)}
              className={[
                "group flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left transition-colors",
                isActive ? "bg-black/[0.02]" : "hover:bg-black/[0.01]",
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={[
                    "truncate text-sm",
                    isActive ? "font-bold text-black" : "font-medium text-black/80",
                  ].join(" ")}
                >
                  {s.subject || "No subject"}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-mono">#{s.report_id}</span>
                  <span className="text-gray-300">·</span>
                  <span>{shortDate(s.submitted_at)}</span>
                </div>
              </div>
              <div className="mt-0.5 flex shrink-0 items-center gap-2">
                {isActive && (
                  <span className="border border-black/20 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                    Viewing
                  </span>
                )}
                <button
                  type="button"
                  title="Remove from saved list"
                  onClick={(e) => handleRemove(e, s.token)}
                  className="p-1 text-gray-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-black/[0.04] px-5 py-2.5">
        <p className="text-[11px] text-gray-400">
          Tokens are saved locally in your browser. Clearing browser data will
          remove them.
        </p>
      </div>
    </div>
  );
}

interface Props {
  initialToken?: string;
}

export default function TrackReportWidget({ initialToken = "" }: Props) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TrackedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialToken.trim()) {
      trackToken(initialToken.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  async function trackToken(t: string) {
    if (!t) {
      setError("Please enter your tracking token.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await reportService.trackReport(t);
      setReport(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Report not found.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackToken(token.trim());
  };

  const handleSelectSaved = (t: string) => {
    setToken(t);
    trackToken(t);
  };

  const statusCfg = report ? STATUS_CONFIG[report.status] : null;
  const priorityCfg = report ? PRIORITY_CONFIG[report.priority] : null;

  return (
    <div className="space-y-3">
      <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
        <div className="border-b border-black/[0.04] px-5 py-4">
          <p className="text-sm text-gray-500">
            Enter the tracking token you received when you submitted your
            report to check its current status and view any replies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="track-token-input">Tracking Token</Label>
            <div className="flex gap-2">
              <Input
                id="track-token-input"
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. a3f2b8c1d9e0f7a4b1c2d3e4f5a6b7c8"
                aria-invalid={!!error}
                className="flex-1 font-mono"
              />
              <Button
                type="submit"
                isLoading={loading}
                loadingText="Searching…"
                className="shrink-0 rounded-none"
              >
                <Search className="h-4 w-4" />
                Track
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-500">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </form>
      </div>

      <SavedTokensList onSelect={handleSelectSaved} activeToken={token} />

      {report && statusCfg && priorityCfg && (
        <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
          <div className="border-b border-black/[0.04] px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Report #{report.id}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {CATEGORY_LABELS[report.category] ?? report.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-black">
                  {report.subject}
                </h3>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <span
                  className={[
                    "inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold leading-none",
                    statusCfg.cls,
                  ].join(" ")}
                >
                  {statusCfg.icon} {statusCfg.label}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${priorityCfg.dot}`}
                  />
                  {priorityCfg.label}
                </span>
                {report.is_replied && (
                  <span className="inline-flex items-center gap-1 border border-green-100 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    <MessageSquare className="h-2.5 w-2.5" /> Replied
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-black/[0.04] px-5 py-4">
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Submitted
              </p>
              <p className="text-xs font-medium text-black">
                {fmtDate(report.created_at)}
              </p>
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Last Updated
              </p>
              <p className="text-xs font-medium text-black">
                {fmtDate(report.updated_at)}
              </p>
            </div>
          </div>

          {/* Report-level images */}
          {report.images && report.images.length > 0 && (
            <div className="border-b border-black/[0.04] px-5 py-4">
              <ImageGallery images={report.images} label="Attached Images" />
            </div>
          )}

          <div className="border-b border-black/[0.04] px-5 py-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Progress
            </p>
            <div className="flex items-center">
              {STATUS_ORDER.map((s, i) => {
                const cfg = STATUS_CONFIG[s];
                const active = report.status === s;
                const passed = STATUS_ORDER.indexOf(report.status) > i;
                return (
                  <React.Fragment key={s}>
                    <div
                      className="flex flex-col items-center text-center"
                      style={{ flex: 1 }}
                    >
                      <div
                        className={[
                          "flex h-7 w-7 items-center justify-center transition-colors",
                          active
                            ? "bg-black text-white"
                            : passed
                              ? "bg-black/10 text-black"
                              : "bg-gray-100 text-gray-400",
                        ].join(" ")}
                      >
                        <span className="h-3 w-3">{cfg.icon}</span>
                      </div>
                      <span
                        className={[
                          "mt-1.5 text-[10px] font-medium leading-tight",
                          active
                            ? "font-bold text-black"
                            : passed
                              ? "text-black/60"
                              : "text-gray-400",
                        ].join(" ")}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <div
                        className={[
                          "h-[2px] flex-1 -mt-4 transition-colors",
                          passed || active ? "bg-black/15" : "bg-gray-100",
                        ].join(" ")}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Replies{" "}
              {report.replies.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center bg-black px-1 text-[9px] font-bold text-white">
                  {report.replies.length}
                </span>
              )}
            </p>

            {report.replies.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center bg-black/[0.03]">
                  <FileText className="h-6 w-6 text-gray-300" />
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  No replies yet. Our team will respond soon.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {report.replies.map((r, i) => (
                  <div
                    key={i}
                    className="border border-black/[0.04] bg-gray-50/50 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-black">
                        Support Team
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="capitalize">{r.via}</span>
                        <span className="text-gray-300">·</span>
                        <span>{fmtDate(r.sent_at)}</span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {r.text}
                    </p>
                    <ImageGallery images={r.images} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-black/[0.04] bg-gray-50/40 px-5 py-3">
            <p className="text-center text-sm text-gray-400">
              Need to submit a new report?{" "}
              <Link
                href="/submit-report"
                className="font-semibold text-black transition-opacity hover:opacity-60"
              >
                Submit a report →
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
