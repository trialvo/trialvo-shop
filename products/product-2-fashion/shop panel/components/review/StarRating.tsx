"use client";

import * as React from "react";

// ─── Types ───────────────────────────────────────────────────────────────── //

interface StarRatingProps {
  /** 0–5, supports decimals for display mode */
  rating: number;
  /** Total number of stars */
  max?: number;
  /** Pixel size of each star */
  size?: number;
  /** If true, stars are clickable */
  interactive?: boolean;
  /** Called with the new rating (1-indexed)  */
  onChange?: (rating: number) => void;
  /** Extra classNames on the wrapper */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────── //

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  size = 20,
  interactive = false,
  onChange,
  className = "",
}) => {
  const [hovered, setHovered] = React.useState<number | null>(null);

  const display = hovered ?? rating;

  return (
    <div
      className={`inline-flex items-center gap-[2px] ${className}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating: ${rating} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const fill = Math.min(1, Math.max(0, display - i)); // 0-1

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={`relative shrink-0 p-0 border-0 bg-transparent ${
              interactive ? "cursor-pointer hover:scale-110 transition-transform duration-150" : "cursor-default"
            }`}
            style={{ width: size, height: size }}
            aria-label={interactive ? `${starValue} star${starValue > 1 ? "s" : ""}` : undefined}
          >
            {/* Empty star (background) */}
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              className="absolute inset-0"
              fill="none"
              stroke="#ccc"
              strokeWidth="1.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Filled star (clipped for partial fill) */}
            {fill > 0 && (
              <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
              >
                <defs>
                  <linearGradient id={`star-grad-${i}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#c49515" />
                    <stop offset="100%" stopColor="#d4a017" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`url(#star-grad-${i})`}
                  stroke="#c49515"
                  strokeWidth="0.5"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
