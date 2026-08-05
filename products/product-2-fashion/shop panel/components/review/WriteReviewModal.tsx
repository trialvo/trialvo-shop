"use client";

import type { EligibleItem } from "@/lib/api/review/service";
import { reviewService } from "@/lib/api/review/service";
import * as React from "react";
import {
  FiAlertCircle,
  FiCamera,
  FiLoader,
  FiMessageCircle,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import StarRating from "./StarRating";

// ─── Types ───────────────────────────────────────────────────────────────── //

interface WriteReviewModalProps {
  productId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = "loading" | "select" | "form" | "success" | "error";

type RatingValue = 1 | 2 | 3 | 4 | 5;

const RATING_LABELS: Readonly<Record<RatingValue, string>> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
} as const;

const MAX_IMAGES = 4 as const;
const MAX_TEXT_LENGTH = 2000 as const;
const TRANSITION_MS = 200 as const;

// ─── Component ───────────────────────────────────────────────────────────── //

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  onClose,
  onSuccess,
}) => {
  // ── Modal step / flow state ──
  const [step, setStep] = React.useState<ModalStep>("loading");
  const [eligibleItems, setEligibleItems] = React.useState<EligibleItem[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<EligibleItem | null>(
    null
  );
  const [isCommentOnly, setIsCommentOnly] = React.useState<boolean>(false);

  // ── Form state ──
  const [rating, setRating] = React.useState<number>(0);
  const [reviewText, setReviewText] = React.useState<string>("");
  const [images, setImages] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // ── Transition state ──
  const [visible, setVisible] = React.useState<boolean>(false);
  const [closing, setClosing] = React.useState<boolean>(false);

  // Check eligibility on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await reviewService.getReviewEligibility(productId);
        const items = res.eligible_items.filter(
          (r: EligibleItem) => r.can_review
        );
        setEligibleItems(items);

        if (items.length === 0) {
          setIsCommentOnly(true);
          setStep("form");
        } else if (items.length === 1) {
          setSelectedItem(items[0]);
          setStep("form");
        } else {
          setStep("select");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Unable to verify eligibility";
        if (msg.includes("INVALID_ACCESS_TOKEN") || msg.includes("401")) {
          setErrorMsg("Please sign in to write a review.");
        } else {
          setErrorMsg(msg);
        }
        setStep("error");
      }
    })();
  }, [productId]);

  // Cleanup preview URLs
  React.useEffect(() => {
    return () => previews.forEach((url: string) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []).slice(
      0,
      MAX_IMAGES - images.length
    );
    if (!files.length) return;
    setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES));
    setPreviews((prev) =>
      [...prev, ...files.map((f: File) => URL.createObjectURL(f))].slice(
        0,
        MAX_IMAGES
      )
    );
  };

  const removeImage = (idx: number): void => {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit: boolean = isCommentOnly
    ? reviewText.trim().length > 0
    : rating > 0;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await reviewService.submitReview({
        product_id: productId,
        order_item_id: isCommentOnly
          ? undefined
          : selectedItem?.order_item_id,
        rating: isCommentOnly ? undefined : rating,
        review_text: reviewText.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      });
      setStep("success");
      setTimeout(onSuccess, 1500);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Prevent body scroll
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const triggerClose = React.useCallback((): void => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, TRANSITION_MS);
  }, [closing, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) triggerClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200"
      onClick={handleBackdropClick}
      style={{
        backgroundColor: visible ? "rgba(0, 0, 0, 0.35)" : "rgba(0, 0, 0, 0)",
      }}
    >
      <div
        className="relative w-full max-w-md bg-white overflow-hidden border border-[#EDEDED] transition-[opacity,transform] duration-200 focus:outline-none"
        style={{
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.98)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#CACACA]">
          <h3 className="text-sm font-medium text-black">
            {step === "success"
              ? "Submitted!"
              : isCommentOnly
                ? "Leave a Comment"
                : "Write a Review"}
          </h3>
          <button
            onClick={triggerClose}
            className="p-1 hover:bg-black/[0.04] transition-colors"
          >
            <FiX className="w-4 h-4 text-black/50" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center py-10">
              <FiLoader className="w-6 h-6 text-black/30 animate-spin" />
              <p className="text-xs text-black/40 mt-3">
                Checking eligibility…
              </p>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-10 h-10 bg-red-50 flex items-center justify-center mb-3">
                <FiAlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm text-black/70 text-center">{errorMsg}</p>
              <button
                onClick={triggerClose}
                className="mt-4 px-4 py-1.5 text-xs font-medium border border-[#CACACA] text-black/70 hover:bg-black/[0.02] transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Select Order Item */}
          {step === "select" && (
            <div>
              <p className="text-sm text-black/50 mb-4">
                You&apos;ve purchased this product multiple times. Which order
                are you reviewing?
              </p>
              <div className="space-y-2">
                {eligibleItems.map((item: EligibleItem) => (
                  <button
                    key={item.order_item_id}
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsCommentOnly(false);
                      setStep("form");
                    }}
                    className="w-full text-left p-3 border border-[#CACACA] hover:border-black/30 hover:bg-black/[0.01] transition-colors"
                  >
                    <div className="text-sm font-medium text-black">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-black/40 mt-0.5">
                      {[item.color_name, item.variant_name]
                        .filter(Boolean)
                        .join(" · ")}
                      {" — "}
                      {new Date(item.delivered_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review / Comment Form */}
          {step === "form" && (
            <div className="space-y-5">
              {/* Comment-only notice */}
              {isCommentOnly && (
                <div className="flex items-start gap-3 border border-blue-200 bg-blue-50/50 p-3">
                  <FiMessageCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-black/70">
                      Comment Mode
                    </p>
                    <p className="text-[11px] text-black/45 mt-0.5 leading-relaxed">
                      You can leave a comment or question below. Star ratings
                      require a delivered purchase.
                    </p>
                  </div>
                </div>
              )}

              {/* Purchased item info (rated review only) */}
              {!isCommentOnly && selectedItem && (
                <div className="bg-black/[0.02] p-3">
                  <p className="text-[10px] font-medium text-black/35 uppercase tracking-wider mb-1">
                    Reviewing
                  </p>
                  <p className="text-sm font-medium text-black">
                    {selectedItem.product_name}
                  </p>
                  {(selectedItem.color_name || selectedItem.variant_name) && (
                    <p className="text-xs text-black/40 mt-0.5">
                      {[selectedItem.color_name, selectedItem.variant_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              )}

              {/* Star Rating (rated review only) */}
              {!isCommentOnly && (
                <div className="text-center">
                  <p className="text-sm font-medium text-black mb-2">
                    Rate this product
                  </p>
                  <StarRating
                    rating={rating}
                    size={32}
                    interactive
                    onChange={setRating}
                    className="justify-center"
                  />
                  {rating > 0 && (
                    <p className="text-xs text-[#d4a017] mt-1.5 font-medium">
                      {RATING_LABELS[rating as RatingValue]}
                    </p>
                  )}
                </div>
              )}

              {/* Text */}
              <div>
                <label className="text-sm font-medium text-black block mb-1.5">
                  {isCommentOnly ? "Your Comment" : "Your Review"}{" "}
                  {!isCommentOnly && (
                    <span className="text-black/30 font-normal">
                      (optional)
                    </span>
                  )}
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReviewText(e.target.value)
                  }
                  placeholder={
                    isCommentOnly
                      ? "Ask a question or share your thoughts about this product…"
                      : "Share your experience with this product…"
                  }
                  rows={4}
                  maxLength={MAX_TEXT_LENGTH}
                  className="w-full border border-[#CACACA] px-3 py-2.5 text-sm text-black placeholder:text-black/25 resize-none focus:outline-none focus:border-black/40 transition-colors"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-black/30">
                    💡 Type{" "}
                    <span className="font-medium text-black/50">@seller</span>{" "}
                    to notify the seller directly
                  </p>
                  <span className="text-[10px] text-black/30 tabular-nums">
                    {reviewText.length}/{MAX_TEXT_LENGTH}
                  </span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <p className="text-sm font-medium text-black mb-2">
                  Add Photos{" "}
                  <span className="text-black/30 font-normal">
                    (up to {MAX_IMAGES})
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src: string, i: number) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 overflow-hidden border border-black/10 group"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <FiTrash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 border-2 border-dashed border-black/15 flex items-center justify-center hover:border-black/30 hover:bg-black/[0.01] transition-colors"
                    >
                      <FiCamera className="w-4 h-4 text-black/30" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImages}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs p-2.5">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 bg-[#2d7a2d]/[0.08] flex items-center justify-center mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2d7a2d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h4 className="text-sm font-medium text-black">Thank you!</h4>
              <p className="text-xs text-black/40 mt-1">
                {isCommentOnly
                  ? "Your comment has been posted."
                  : "Your review has been submitted successfully."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="px-5 py-3 border-t border-[#CACACA] flex justify-end gap-2">
            <button
              type="button"
              onClick={triggerClose}
              className="px-4 py-1.5 text-xs font-medium text-black/50 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="px-5 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {submitting && (
                <FiLoader className="w-3.5 h-3.5 animate-spin" />
              )}
              {isCommentOnly ? "Post Comment" : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteReviewModal;
