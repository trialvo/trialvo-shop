// src/pages/Products/ReviewsPage.tsx — V2-050
// Product Reviews management — split-pane inbox style.

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Eye, EyeOff, Loader2, MessageSquare, Pin, PinOff,
  RefreshCw, Search, SlidersHorizontal, Star, Trash2, X,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import { Pagination } from "@/components/ui";
import {
  useAdminReviews,
  useAdminReview,
  useAdminReplyReview,
  useAdminTogglePin,
  useAdminToggleHide,
  useAdminDeleteReview,
} from "@/hooks/useReviews";
import type { GetReviewsParams, AdminReviewListItem } from "@/api/reviews.api";

// ─── Helpers ──────────────────────────────────────────────────────────────── //

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700",
          )}
        />
      ))}
    </div>
  );
}

// ─── Filters Bar ──────────────────────────────────────────────────────────── //

type Filters = Omit<GetReviewsParams, "offset" | "limit">;

function FiltersBar({
  filters, onChange, onRefresh, isRefetching,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onRefresh: () => void;
  isRefetching: boolean;
}) {
  const [showAdv, setShowAdv] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, user, review text…"
            value={filters.search ?? ""}
            onChange={e => onChange({ search: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdv(v => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
            showAdv
              ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
              : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
          )}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefetching}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{isRefetching ? "Refreshing…" : "Refresh"}</span>
        </button>
      </div>

      {showAdv && (
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.rating ?? "all"}
              onChange={e => onChange({ rating: e.target.value === "all" ? undefined : Number(e.target.value) })}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="all">All Ratings</option>
              {[5, 4, 3, 2, 1].map(r => (
                <option key={r} value={r}>{r} Star{r !== 1 && "s"}</option>
              ))}
            </select>

            <select
              value={filters.is_hidden ?? "all"}
              onChange={e => onChange({ is_hidden: e.target.value as "all" | "true" | "false" })}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="all">Visible + Hidden</option>
              <option value="false">Visible Only</option>
              <option value="true">Hidden Only</option>
            </select>

            <select
              value={filters.is_pinned ?? "all"}
              onChange={e => onChange({ is_pinned: e.target.value as "all" | "true" | "false" })}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="all">All Pin Status</option>
              <option value="true">Pinned Only</option>
              <option value="false">Not Pinned</option>
            </select>

            <select
              value={filters.mentions_seller ?? "all"}
              onChange={e => onChange({ mentions_seller: e.target.value as "all" | "true" | "false" })}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="all">Any @seller</option>
              <option value="true">@seller Mentions</option>
              <option value="false">No @seller</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Review List Item ─────────────────────────────────────────────────────── //

function ReviewListItem({
  review, selected, onSelect,
}: {
  review: AdminReviewListItem; selected: boolean; onSelect: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(review.id)}
      className={cn(
        "w-full text-left px-4 py-3.5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0",
        selected
          ? "bg-brand-50 dark:bg-brand-500/10"
          : "hover:bg-gray-50 dark:hover:bg-white/[0.02]",
        review.is_hidden && "opacity-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Product thumbnail */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 overflow-hidden dark:bg-gray-800">
          {review.product_image ? (
            <img src={toPublicUrl(review.product_image)} alt="" className="h-full w-full object-cover" />
          ) : (
            <Star size={14} className="text-gray-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
              {review.user_name}
            </p>
            <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(review.created_at)}</span>
          </div>

          <p className="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5">{review.product_name}</p>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {review.rating != null && <Stars rating={review.rating} size={12} />}
            {review.is_verified_buyer ? (
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                ✓ Verified
              </span>
            ) : (
              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                💬 Comment
              </span>
            )}
            {review.is_pinned && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                📌 Pinned
              </span>
            )}
            {review.is_hidden && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Hidden
              </span>
            )}
            {review.mentions_seller && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                @seller
              </span>
            )}
            {review.reply_count > 0 && (
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                ✓ Replied
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────── //

function DetailPanel({ reviewId, isSuperAdmin }: { reviewId: number; isSuperAdmin: boolean }) {
  const { data, isLoading } = useAdminReview(reviewId);
  const review = data?.review;
  const reply = useAdminReplyReview();
  const togglePin = useAdminTogglePin();
  const toggleHide = useAdminToggleHide();
  const del = useAdminDeleteReview();

  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    setReplyText("");
    setShowReply(false);
  }, [reviewId]);

  if (isLoading) return (
    <div className="flex h-full items-center justify-center py-20">
      <Loader2 className="animate-spin text-brand-400" size={28} />
    </div>
  );
  if (!review) return null;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await reply.mutateAsync({ id: review.id, reply_text: replyText });
    toast.success("Reply sent & email notification dispatched");
    setReplyText("");
    setShowReply(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-white/[0.03] dark:to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              Review by {review.user_name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              #{review.id} · {fmtDate(review.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {review.rating != null ? (
              <Stars rating={review.rating} size={16} />
            ) : (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                💬 Comment
              </span>
            )}
            {review.is_verified_buyer && (
              <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-600 dark:bg-green-500/10 dark:text-green-400">
                ✓ Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-5 py-4">
        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "User", value: `${review.user_name} (${review.user_email})` },
            { label: "Product", value: review.product_name },
            { label: "Purchased", value: [review.purchased_color, review.purchased_variant].filter(Boolean).join(" · ") || "—" },
            { label: "Rating", value: review.rating != null ? `${review.rating}/5 star${review.rating !== 1 ? "s" : ""}` : "Comment only" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Review text */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Review</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {review.review_text || <span className="text-gray-400 italic">No text provided — rating only</span>}
          </p>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {review.images.map((img, i) => (
                <a
                  key={i}
                  href={toPublicUrl(img.image_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md"
                >
                  <img src={toPublicUrl(img.image_path)} alt={`Review ${i + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Existing replies */}
        {review.replies && review.replies.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Admin Replies</p>
            {review.replies.map(r => (
              <div key={r.id} className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{r.admin_name || "Admin"}</p>
                  <span className="text-[10px] text-gray-400">{fmtDate(r.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.reply_text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowReply(v => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition"
          >
            <MessageSquare size={13} /> Reply
          </button>

          <button
            type="button"
            disabled={togglePin.isPending}
            onClick={async () => {
              await togglePin.mutateAsync(review.id);
              toast.success(review.is_pinned ? "Unpinned" : "Pinned");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition",
              review.is_pinned
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
            )}
          >
            {review.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
            {review.is_pinned ? "Unpin" : "Pin"}
          </button>

          <button
            type="button"
            disabled={toggleHide.isPending}
            onClick={async () => {
              await toggleHide.mutateAsync(review.id);
              toast.success(review.is_hidden ? "Review visible" : "Review hidden");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition",
              review.is_hidden
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
            )}
          >
            {review.is_hidden ? <Eye size={13} /> : <EyeOff size={13} />}
            {review.is_hidden ? "Show" : "Hide"}
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              disabled={del.isPending}
              onClick={async () => {
                if (confirm("Permanently delete this review?")) {
                  await del.mutateAsync(review.id);
                  toast.success("Review deleted");
                }
              }}
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
              placeholder="Type your reply… (customer will receive an email notification)"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                disabled={reply.isPending || !replyText.trim()}
                onClick={handleReply}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition"
              >
                {reply.isPending ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                Send Reply
              </button>
              <button type="button" onClick={() => setShowReply(false)}>
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────── //

export default function ReviewsPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("SUPER_ADMIN");

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const listParams: GetReviewsParams = {
    ...filters,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };

  const listQ = useAdminReviews(listParams);
  const rows = listQ.data?.reviews ?? [];
  const total = listQ.data?.total ?? 0;

  const isRefetching = listQ.isFetching && !listQ.isLoading;

  // Auto-select first row
  useEffect(() => {
    if (!selectedId && rows.length > 0) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  return (
    <>
      <PageMeta
        title="Product Reviews"
        description="Manage customer product reviews — reply, pin, hide, and delete"
      />
      <div className="w-full px-4 py-6 md:px-8">
        {/* Page Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Product Reviews</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage customer reviews — reply, pin featured reviews, hide inappropriate content.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <FiltersBar
            filters={filters}
            onChange={patch => { setFilters(f => ({ ...f, ...patch })); setPage(1); }}
            onRefresh={() => listQ.refetch()}
            isRefetching={isRefetching}
          />
        </div>

        {/* Split pane */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: inbox list */}
          <div className="flex flex-col lg:col-span-5">
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
                <Star size={16} className="text-amber-500" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">Reviews</p>
                <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  {total}
                </span>
              </div>

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
                    <Star className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400">No reviews found.</p>
                  </div>
                ) : (
                  rows.map(r => (
                    <ReviewListItem
                      key={r.id}
                      review={r}
                      selected={selectedId === r.id}
                      onSelect={setSelectedId}
                    />
                  ))
                )}
              </div>
            </div>

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
                <DetailPanel reviewId={selectedId} isSuperAdmin={isSuperAdmin} />
              ) : (
                <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 px-5 py-10">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <Star className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </span>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {rows.length ? "Select a review to view details" : "No reviews to display"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
