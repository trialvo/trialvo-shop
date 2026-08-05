/**
 * Ensures button text always contrasts with its fill.
 * Solid fills → paired *-foreground; soft/outline → readable dark/light text.
 */

export type ButtonFillTone =
  | "primary"
  | "accent"
  | "destructive"
  | "secondary"
  | "success"
  | "none";

/**
 * Match solid utilities only:
 * - `bg-primary` / `gradient-primary` ✅
 * - `bg-primary-foreground` ❌ (different token)
 * - `bg-primary/10` ❌ (translucent wash)
 */
const FILL_PATTERNS: Array<{ tone: ButtonFillTone; re: RegExp }> = [
  { tone: "accent", re: /(?:^|\s)(?:gradient-accent|bg-accent)(?=\s|$)/ },
  { tone: "primary", re: /(?:^|\s)(?:gradient-primary|bg-primary)(?=\s|$)/ },
  { tone: "destructive", re: /(?:^|\s)bg-destructive(?=\s|$)/ },
  { tone: "success", re: /(?:^|\s)bg-success(?=\s|$)/ },
  { tone: "secondary", re: /(?:^|\s)bg-secondary(?=\s|$)/ },
];

const CONTRAST_TEXT: Record<Exclude<ButtonFillTone, "none">, string> = {
  primary: "text-primary-foreground",
  accent: "text-accent-foreground",
  destructive: "text-destructive-foreground",
  success: "text-success-foreground",
  secondary: "text-secondary-foreground",
};

/** Text utilities that can collide with a solid fill */
const CONFLICTING_TEXT =
  /\b(?:text-primary|text-accent|text-destructive|text-success|text-secondary|text-foreground|text-muted-foreground|text-card-foreground|text-white|text-black|text-primary-foreground|text-accent-foreground|text-destructive-foreground|text-success-foreground|text-secondary-foreground)(?![/\w-])/g;

const HOVER_FILL_PRIMARY = /(?:^|\s)hover:bg-primary(?=\s|$)/;
const HOVER_FILL_ACCENT = /(?:^|\s)hover:bg-accent(?=\s|$)/;
const HOVER_FILL_DESTRUCTIVE = /(?:^|\s)hover:bg-destructive(?=\s|$)/;

export function detectButtonFillTone(
  className: string | undefined,
): ButtonFillTone {
  if (!className) return "none";
  for (const { tone, re } of FILL_PATTERNS) {
    if (re.test(className)) return tone;
  }
  return "none";
}

/**
 * Strips text-* utilities that may match the fill, then applies the
 * correct contrasting foreground (+ hover pairs when needed).
 */
export function resolveContrastingButtonClasses(
  className: string | undefined,
): string {
  if (!className) return "";

  const fill = detectButtonFillTone(className);
  let next = className;

  if (fill !== "none") {
    next = next.replace(CONFLICTING_TEXT, "").replace(/\s+/g, " ").trim();
    next = `${next} ${CONTRAST_TEXT[fill]}`.trim();
  }

  const hoverParts: string[] = [];
  if (HOVER_FILL_PRIMARY.test(className)) {
    hoverParts.push("hover:text-primary-foreground");
  }
  if (HOVER_FILL_ACCENT.test(className)) {
    hoverParts.push("hover:text-accent-foreground");
  }
  if (HOVER_FILL_DESTRUCTIVE.test(className)) {
    hoverParts.push("hover:text-destructive-foreground");
  }

  return hoverParts.length ? `${next} ${hoverParts.join(" ")}`.trim() : next;
}

/** @deprecated Prefer resolveContrastingButtonClasses */
export function inferButtonForegroundClass(
  className: string | undefined,
): string | undefined {
  const fill = detectButtonFillTone(className);
  if (fill === "none") {
    const parts: string[] = [];
    if (className && HOVER_FILL_ACCENT.test(className)) {
      parts.push("hover:text-accent-foreground");
    }
    if (className && HOVER_FILL_PRIMARY.test(className)) {
      parts.push("hover:text-primary-foreground");
    }
    if (className && HOVER_FILL_DESTRUCTIVE.test(className)) {
      parts.push("hover:text-destructive-foreground");
    }
    return parts.length ? parts.join(" ") : undefined;
  }
  return CONTRAST_TEXT[fill];
}
