/**
 * Custom flat-style SVG icons for the QuickView modal.
 *
 * Each icon is a pure functional React component that accepts standard
 * SVG sizing + className props for full composability with Tailwind.
 * The designs follow the "flaticon" aesthetic — solid filled shapes,
 * no strokes, minimal detail, bold silhouettes.
 */

import type { FC, SVGProps } from "react";

/** Common props shared by all flat icons. */
export interface FlatIconProps extends SVGProps<SVGSVGElement> {
  /** Width & height in px (square). Falls back to 16. */
  size?: number;
}

/** Helper that merges size into SVG root attributes. */
const svgRoot = (size: number, props: Omit<FlatIconProps, "size">) => ({
  xmlns: "http://www.w3.org/2000/svg" as const,
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true as const,
  ...props,
});

/* ─────────────────────── Shopping Bag (flat) ─────────────────────── */
export const FlatBagIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, rest)}>
    <path d="M8 6V4a4 4 0 1 1 8 0v2h3a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1h3Zm2 0h4V4a2 2 0 1 0-4 0v2Z" />
  </svg>
);

/* ─────────────────────── Heart / Wishlist (flat) ─────────────────── */
export const FlatHeartIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, rest)}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
  </svg>
);

/* ─────────────────────── Heart outline (flat) ────────────────────── */
export const FlatHeartOutlineIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, { ...rest, fill: "none" })}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─────────────────────── Lightning / Shop Now (flat) ─────────────── */
export const FlatBoltIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, rest)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

/* ─────────────────────── Checkmark (flat) ────────────────────────── */
export const FlatCheckIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, rest)}>
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
  </svg>
);

/* ─────────────────────── Spinner (flat) ──────────────────────────── */
export const FlatSpinnerIcon: FC<FlatIconProps> = ({ size = 16, className = "", ...rest }) => (
  <svg {...svgRoot(size, { ...rest, className: `animate-spin ${className}`, fill: "none" })}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* ─────────────────────── Minus (flat) ────────────────────────────── */
export const FlatMinusIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, rest)}>
    <rect x="5" y="11" width="14" height="2" rx="1" />
  </svg>
);

/* ─────────────────────── Plus (flat) ─────────────────────────────── */
export const FlatPlusIcon: FC<FlatIconProps> = ({ size = 16, ...rest }) => (
  <svg {...svgRoot(size, rest)}>
    <path d="M13 5a1 1 0 1 0-2 0v6H5a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V5Z" />
  </svg>
);
