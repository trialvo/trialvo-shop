"use client";

import { useTranslation } from "@/hooks/useTranslation";
import type {
  ProductReviewsResponse,
  Review,
  StarBreakdown,
} from "@/lib/api/review/service";
import { reviewService } from "@/lib/api/review/service";
import { toPublicUrl } from "@/lib/utils";
import * as React from "react";
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiMessageCircle,
  FiStar,
} from "react-icons/fi";
import StarRating from "./StarRating";
import WriteReviewModal from "./WriteReviewModal";
import SelectDropdown from "@/components/common/form/SelectDropdown";

// ─── Props ───────────────────────────────────────────────────────────────── //

interface ReviewSectionProps {
  productId: number;
  /** When true, hides "Write a Review" buttons and the WriteReviewModal. */
  readOnly?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────── //

interface RatingBarProps {
  star: number;
  count: number;
  total: number;
  active: boolean;
  onClick: () => void;
}

const RatingBar: React.FC<RatingBarProps> = ({
  star,
  count,
  total,
  active,
  onClick,
}) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 w-full group rounded px-1 py-0.5 transition-colors ${active ? "bg-[#fdf6e3]" : "hover:bg-black/[0.02]"
        }`}
    >
      <span className="text-xs font-medium text-black/60 w-3 text-right">
        {star}
      </span>
      <FiStar className="w-3 h-3 text-[#d4a017] fill-[#d4a017]" />
      <div className="flex-1 h-[5px] bg-black/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#d4a017] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-black/40 w-7 text-right tabular-nums">
        {count}
      </span>
    </button>
  );
};

// ── Review Image Gallery ─────────────────────────────────────────────────── //

interface ReviewImageGalleryProps {
  images: { image_path: string }[];
}

const ReviewImageGallery: React.FC<ReviewImageGalleryProps> = ({ images }) => {
  if (!images.length) return null;
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {images.map((img, i) => (
        <a
          key={i}
          href={toPublicUrl(img.image_path) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-14 h-14 overflow-hidden border border-black/10 hover:border-black/30 transition-colors"
        >
          <img
            src={toPublicUrl(img.image_path) ?? ""}
            alt={`Review image ${i + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
};

// ── Review Card ──────────────────────────────────────────────────────────── //

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [expanded, setExpanded] = React.useState(false);
  const text = review.review_text || "";
  const isLong = text.length > 200;

  return (
    <div className="py-4 border-b border-black/[0.06] last:border-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center shrink-0 text-xs font-medium text-black/50 overflow-hidden">
          {review.user_avatar ? (
            <img
              src={toPublicUrl(review.user_avatar) ?? ""}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            review.user_name?.charAt(0)?.toUpperCase() || "U"
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-black">
              {review.user_name}
            </span>
            {review.is_pinned && (
              <span className="text-[10px] font-medium text-black/50 bg-black/[0.04] px-1.5 py-px">
                📌 Pinned
              </span>
            )}
            {review.is_verified_buyer ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#2d7a2d] bg-[#2d7a2d]/[0.06] px-1.5 py-px">
                <FiCheck className="w-2.5 h-2.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-black/40 bg-black/[0.03] px-1.5 py-px">
                <FiMessageCircle className="w-2.5 h-2.5" /> Comment
              </span>
            )}
          </div>

          {/* Rating + Date */}
          <div className="flex items-center gap-2 mt-0.5">
            {review.rating != null && (
              <StarRating rating={review.rating} size={13} />
            )}
            <span className="text-[11px] text-black/35">
              {new Date(review.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Purchased variant info (rated reviews only) */}
          {review.rating != null &&
            (review.purchased_color || review.purchased_variant) && (
              <p className="text-[11px] text-black/35 mt-1">
                Purchased:{" "}
                {[review.purchased_color, review.purchased_variant]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

          {/* Review text */}
          {text && (
            <div className="mt-2">
              <p className="text-sm text-black/70 leading-relaxed whitespace-pre-line">
                {isLong && !expanded ? text.slice(0, 200) + "…" : text}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-1 text-xs font-medium text-black/40 hover:text-black transition-colors"
                >
                  {expanded ? (
                    <>
                      Show less <FiChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Read more <FiChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Images */}
          <ReviewImageGallery images={review.images || []} />

          {/* Replies */}
          {review.replies?.length > 0 && (
            <div className="mt-3 ml-1 pl-3 border-l-2 border-black/[0.08]">
              {review.replies.map((reply) => (
                <div key={reply.id} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-1.5">
                    <FiMessageCircle className="w-3 h-3 text-black/30" />
                    <span className="text-xs font-medium text-black/70">
                      {reply.admin_name || "Store Team"}
                    </span>
                    <span className="text-[10px] text-black/30">
                      {new Date(reply.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-black/60 mt-0.5 whitespace-pre-line">
                    {reply.reply_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────── //

const ReviewSection: React.FC<ReviewSectionProps> = ({
  productId,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [data, setData] = React.useState<ProductReviewsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(0);
  const [starFilter, setStarFilter] = React.useState<number | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortOrder, setSortOrder] = React.useState("DESC");
  const [showWriteModal, setShowWriteModal] = React.useState(false);
  const [showList, setShowList] = React.useState(false);

  const LIMIT = 5;
  const isSortOnlyRef = React.useRef(false);

  const fetchReviews = React.useCallback(async (skipLoading = false) => {
    if (!skipLoading) setLoading(true);
    try {
      const result = await reviewService.getProductReviews(productId, {
        rating: starFilter,
        limit: LIMIT,
        offset: page * LIMIT,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(result);
    } catch {
      // silently fail
    } finally {
      if (!skipLoading) setLoading(false);
    }
  }, [productId, starFilter, page, sortBy, sortOrder]);

  React.useEffect(() => {
    if (isSortOnlyRef.current) {
      isSortOnlyRef.current = false;
      fetchReviews(true);
    } else {
      fetchReviews();
    }
  }, [fetchReviews]);

  const handleStarClick = (star: number) => {
    setStarFilter(starFilter === star ? undefined : star);
    setPage(0);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const totalComments = data ? data.total : 0;

  return (
    <section className="w-full mt-6 mb-8" id="reviews">
      {/* Section Header — matches SectionHeader pattern */}
      <div className="py-2.5 border-b border-[#CACACA] flex items-center justify-between">
        <h3 className="text-base font-medium text-black flex items-center gap-2">
          Customer Reviews
          {data && data.total_reviews > 0 && (
            <span className="text-sm font-normal text-black/40">
              ({data.total_reviews})
            </span>
          )}
        </h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowWriteModal(true)}
            className="px-4 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/90 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Summary Panel */}
      {data && data.total_reviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-5 py-5 border-b border-black/[0.06]">
          {/* Big Rating */}
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <div className="text-3xl font-semibold text-black tracking-tight">
              {data.avg_rating.toFixed(1)}
            </div>
            <StarRating rating={data.avg_rating} size={16} className="mt-1" />
            <div className="text-[11px] text-black/40 mt-1">
              {data.total_reviews} review
              {data.total_reviews !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 flex flex-col gap-0.5">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <RatingBar
                key={star}
                star={star}
                count={
                  (data.star_breakdown as StarBreakdown)[star] || 0
                }
                total={data.total_reviews}
                active={starFilter === star}
                onClick={() => handleStarClick(star)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No reviews state */}
      {!loading && (!data || data.total_reviews === 0) && (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 bg-black/[0.03] rounded-full flex items-center justify-center">
            <FiStar className="w-6 h-6 text-black/20" />
          </div>
          <h3 className="text-sm font-medium text-black mb-1">
            No reviews yet
          </h3>
          <p className="text-xs text-black/40 mb-4">
            {readOnly
              ? "No reviews have been posted for this product yet."
              : "Be the first to review this product"}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowWriteModal(true)}
              className="px-4 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/90 transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      {/* Collapsible Reviews List */}
      {data && (data.total_reviews > 0 || totalComments > 0) && (
        <div>
          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="w-full flex items-center justify-between py-3 hover:bg-black/[0.01] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FiMessageCircle className="w-4 h-4 text-black/40" />
              <span className="text-sm font-medium text-black">
                Reviews & Comments
              </span>
              {totalComments > 0 && (
                <span className="text-[11px] font-medium text-black/40 bg-black/[0.04] px-1.5 py-px">
                  {totalComments}
                </span>
              )}
            </div>
            <FiChevronDown
              className={`w-4 h-4 text-black/40 transition-transform duration-200 ${showList ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Expanded content */}
          {showList && (
            <div className="pb-4">
              {/* Filter Controls */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {starFilter && (
                  <button
                    onClick={() => {
                      setStarFilter(undefined);
                      setPage(0);
                    }}
                    className="text-[11px] font-medium text-black/60 bg-black/[0.04] px-2 py-1 hover:bg-black/[0.08] transition-colors"
                  >
                    ✕ Clear {starFilter}★ filter
                  </button>
                )}
                <div className="ml-auto w-40">
                  <SelectDropdown
                    value={`${sortBy}_${sortOrder}`}
                    onChange={(val) => {
                      const lastUnderscore = val.lastIndexOf("_");
                      isSortOnlyRef.current = true;
                      setSortBy(val.substring(0, lastUnderscore));
                      setSortOrder(val.substring(lastUnderscore + 1));
                    }}
                    options={[
                      { value: "created_at_DESC", label: "Newest First" },
                      { value: "created_at_ASC", label: "Oldest First" },
                      { value: "rating_DESC", label: "Highest Rated" },
                      { value: "rating_ASC", label: "Lowest Rated" },
                    ]}
                    placeholder="Sort reviews"
                    searchPlaceholder="Sort By:"
                    emptyText="No options"
                    triggerClassName="h-8 w-full justify-between rounded-none border-0 p-0 shadow-none text-left text-xs"
                    contentClassName="w-44 z-[1000]"
                    listMaxHeightClassName="max-h-52"
                    side="bottom"
                    sideOffset={-2}
                    closeOnSelect={true}
                  />
                </div>
              </div>

              {/* Reviews List */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex gap-3 py-4 border-b border-black/[0.04]"
                    >
                      <div className="w-8 h-8 rounded-full bg-black/[0.06]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-black/[0.06] w-1/4" />
                        <div className="h-3 bg-black/[0.04] w-1/6" />
                        <div className="h-3 bg-black/[0.04] w-3/4 mt-2" />
                        <div className="h-3 bg-black/[0.04] w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-black/40">
                    {starFilter
                      ? `No ${starFilter}★ reviews found`
                      : "No reviews yet"}
                  </p>
                </div>
              ) : (
                <div>
                  {data.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-black/[0.06]">
                      <button
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1 text-xs font-medium border border-[#CACACA] hover:bg-black/[0.02] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-black/40">
                        Page {page + 1} of {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1 text-xs font-medium border border-[#CACACA] hover:bg-black/[0.02] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Write Review Modal */}
      {!readOnly && showWriteModal && (
        <WriteReviewModal
          productId={productId}
          onClose={() => setShowWriteModal(false)}
          onSuccess={() => {
            setShowWriteModal(false);
            setPage(0);
            setStarFilter(undefined);
            fetchReviews();
          }}
        />
      )}
    </section>
  );
};

export default ReviewSection;
