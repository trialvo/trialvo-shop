/**
 * ── Centralised theme constants ─────────────────────────────────────────────
 *
 * Single source of truth for domain-specific style maps that were previously
 * duplicated across many component files. Every constant maps a semantic key
 * to Tailwind utility classes that reference the CSS custom-property tokens
 * defined in globals.css.
 *
 * Usage:
 *   import { BADGE_STYLES } from "@/lib/theme";
 *   const cls = BADGE_STYLES[product.badge?.toUpperCase() ?? ""];
 */

/* ────────────────────────────────────────────────────────────────────────── */
/*  Product badge styles (NEW / SALE / HOT / TRENDING)                       */
/* ────────────────────────────────────────────────────────────────────────── */

export const BADGE_STYLES: Record<string, string> = {
  NEW:      "bg-success text-success-foreground",
  SALE:     "bg-sale text-sale-foreground",
  HOT:      "bg-warning text-warning-foreground",
  TRENDING: "bg-accent text-accent-foreground",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Order status badge styles                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export const STATUS_STYLES: Record<string, string> = {
  processing: "bg-accent/20 text-accent",
  shipped:    "bg-info/20 text-info",
  delivered:  "bg-success/20 text-success",
  cancelled:  "bg-destructive/20 text-destructive",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Confirmation modal variant styles                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export const CONFIRMATION_STYLES: Record<string, { icon: string; btn: string }> = {
  danger:  { icon: "text-destructive",  btn: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  warning: { icon: "text-warning",      btn: "bg-warning text-warning-foreground hover:bg-warning/90" },
  info:    { icon: "text-accent",       btn: "bg-primary text-primary-foreground hover:bg-primary/90" },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Password strength meter levels                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export interface StrengthLevel {
  threshold: number;
  label: string;
  color: string;
}

export const PASSWORD_STRENGTH_LEVELS: StrengthLevel[] = [
  { threshold: 8,  label: "Weak",   color: "bg-destructive"  },
  { threshold: 12, label: "Fair",   color: "bg-warning"      },
  { threshold: 16, label: "Strong", color: "bg-success"      },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Reusable UI class-string tokens                                          */
/*                                                                           */
/*  These ensure every card, button, dropdown, and icon container shares     */
/*  the same radius / border / shadow language — driven by globals.css       */
/*  --radius-* tokens.                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/** Product / wishlist card container. */
export const CARD_CLASSES =
  "bg-background rounded-2xl border border-border/60 overflow-hidden shadow-sm" as const;

/** Hover enhancement for interactive cards. Compose with CARD_CLASSES. */
export const CARD_HOVER_CLASSES =
  "hover:shadow-md hover:shadow-foreground/6 transition-all duration-300" as const;

/** Icon action button (wishlist heart, quick-view eye, etc.). */
export const ICON_BUTTON_CLASSES =
  "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-colors cursor-pointer active:scale-95 shrink-0" as const;

/** Pill / CTA button inside card overlays (e.g. "Add to Cart"). */
export const CARD_ACTION_BUTTON_CLASSES =
  "h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer active:scale-[0.98] text-[11px] font-semibold tracking-wide" as const;

/** Dropdown / popover panel (account menu, search results). */
export const DROPDOWN_PANEL_CLASSES =
  "bg-background border border-border rounded-2xl shadow-2xl shadow-foreground/10 overflow-hidden" as const;

/** Single item row inside a dropdown menu. */
export const DROPDOWN_ITEM_CLASSES =
  "flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary/80 transition-colors" as const;

/** Small icon container (feature strips, search chips). */
export const ICON_CONTAINER_CLASSES =
  "rounded-xl flex items-center justify-center shrink-0" as const;
