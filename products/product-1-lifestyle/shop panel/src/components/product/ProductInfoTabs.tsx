"use client";

import { StarRating } from "@/components/ui/StarRating";
import { IMAGE_URL } from "@/config/env";
import type { Review, StarBreakdown } from "@/lib/api/review/service";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";

type TabKey = "description" | "details" | "reviews";

interface ProductInfoTabsProps {
  description?: string | null;
  details?: string[];
  reviews: Review[];
  starBreakdown?: StarBreakdown;
  avgRating?: number;
  className?: string;
}

const isFemaleName = (name: string): boolean => {
  const lower = name.toLowerCase().trim();
  const firstWord = lower.split(/\s+/)[0];

  const commonFemaleNames = new Set([
    "sara", "sarah", "maria", "mary", "linda", "jessica", "elizabeth", "emily",
    "karen", "susan", "helen", "patricia", "jane", "jennifer", "jess", "sophie",
    "amy", "emma", "olivia", "sophia", "mia", "isabella", "ava", "chloe", "lucy",
    "ruby", "lily", "zoe", "grace", "amelia", "anna", "bella", "clara", "diana",
    "ella", "fiona", "hannah", "julia", "laura", "luna", "nina", "stella", "tina"
  ]);

  if (commonFemaleNames.has(firstWord)) return true;

  const femaleEndings = ["anna", "elle", "ette", "ina", "issa", "ica", "via", "sha", "nia", "ria", "lta", "nda"];
  if (femaleEndings.some(ending => firstWord.endsWith(ending))) return true;

  if (firstWord.endsWith("a") || firstWord.endsWith("i") || firstWord.endsWith("y")) {
    const commonMaleWithYOrA = new Set(["billy", "bobby", "danny", "gary", "harry", "larry", "roy", "tony", "toby", "ray", "jay", "guy", "joey", "joshua", "mustafa", "ali", "sami", "ahad", "rabbi"]);
    if (!commonMaleWithYOrA.has(firstWord)) {
      return true;
    }
  }

  return false;
};

const getFallbackAvatar = (name: string): string => {
  const isFemale = isFemaleName(name);
  const seed = encodeURIComponent(name);
  if (isFemale) {
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;
  }
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
};

const toImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${IMAGE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export function ProductInfoTabs({
  description,
  details = [],
  reviews = [],
  starBreakdown,
  avgRating,
  className,
}: ProductInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");

  const computedAvgRating = avgRating !== undefined
    ? avgRating
    : reviews.length
      ? Math.round((reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10) / 10
      : 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "details", label: "Details" },
    { key: "reviews", label: `Reviews (${reviews.length})` },
  ];

  const computedBreakdown = starBreakdown || {
    1: reviews.filter((r) => r.rating === 1).length,
    2: reviews.filter((r) => r.rating === 2).length,
    3: reviews.filter((r) => r.rating === 3).length,
    4: reviews.filter((r) => r.rating === 4).length,
    5: reviews.filter((r) => r.rating === 5).length,
  };

  const totalBreakdownReviews = Object.values(computedBreakdown).reduce((a, b) => a + b, 0) || reviews.length || 1;

  return (
    <div className={cn("border-t border-border pt-8", className)}>

      {/* Tab bar — simple underline style matching root theme */}
      <div className="flex border-b border-border mb-7">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-5 py-3 text-[12px] tracking-[0.12em] uppercase font-semibold transition-all duration-200 cursor-pointer border-b-2 -mb-px",
              activeTab === key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">

        {/* Description */}
        {activeTab === "description" && (
          description ? (
            <div
              className="text-[14px] text-muted-foreground leading-[1.9] space-y-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="text-[14px] text-muted-foreground italic">No description available for this product.</p>
          )
        )}

        {/* Details */}
        {activeTab === "details" && (
          details.length > 0 ? (
            <ul className="space-y-2.5">
              {details.map((d) => (
                <li key={d} className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" />
                  <span className="text-[13px] text-foreground/80 leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-muted-foreground italic">No specifications or details available for this product.</p>
          )
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          reviews.length > 0 ? (
            <div className="space-y-5">
              {/* Summary row */}
              <div className="flex items-center gap-6 pb-5 border-b border-border">
                <div className="text-center shrink-0">
                  <p className="text-4xl font-bold text-foreground font-display">{computedAvgRating}</p>
                  <StarRating rating={computedAvgRating} size={11} className="justify-center mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = computedBreakdown[star as keyof StarBreakdown] ?? 0;
                    const pct = Math.round((count / totalBreakdownReviews) * 100);
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-3">{star}</span>
                        <Star size={9} className="text-warning fill-warning shrink-0" />
                        <div className="flex-1 h-1 bg-border">
                          <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-5 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review cards */}
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="pb-4 border-b border-border last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={r.user_avatar ? toImageUrl(r.user_avatar) : getFallbackAvatar(r.user_name)}
                          alt={r.user_name}
                          className="w-8 h-8 object-cover shrink-0 border border-border"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[13px] font-semibold text-foreground leading-none">{r.user_name}</p>
                            {r.is_verified_buyer && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-success uppercase tracking-wider">
                                <CheckCircle2 size={10} className="fill-success/20 text-success shrink-0" />
                                Verified
                              </span>
                            )}
                          </div>
                          <StarRating rating={r.rating ?? 0} size={10} className="mt-1" />
                          {(r.purchased_color || r.purchased_variant) && (
                            <p className="text-[10.5px] text-muted-foreground mt-0.5 font-medium">
                              Purchased: {[r.purchased_color, r.purchased_variant].filter(Boolean).join(" / ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed pl-[42px]">{r.review_text || "No review text provided."}</p>

                    {/* Review Images */}
                    {r.images && r.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pl-[42px]">
                        {r.images.map((img) => (
                          <a
                            key={img.id}
                            href={toImageUrl(img.image_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-14 h-14 bg-secondary border border-border overflow-hidden block shrink-0"
                          >
                            <img
                              src={toImageUrl(img.image_path)}
                              alt="Review attachment"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Admin Replies */}
                    {r.replies && r.replies.length > 0 && (
                      <div className="mt-4 pl-[42px] space-y-3">
                        {r.replies.map((reply) => (
                          <div key={reply.id} className="bg-secondary/40 border-l-2 border-foreground/30 p-3 text-[12px]">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-foreground">
                                {reply.admin_name}{" "}
                                <span className="text-[10px] text-muted-foreground font-normal">(Response)</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{reply.reply_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-muted-foreground italic">No reviews yet. Be the first to review this product!</p>
          )
        )}
      </div>
    </div>
  );
}
