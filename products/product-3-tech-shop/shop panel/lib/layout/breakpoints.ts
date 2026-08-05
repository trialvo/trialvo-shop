/**
 * Layout breakpoints — aligned with Tailwind defaults + `laptop` alias.
 *
 * | Token           | Range           | Header chrome                                      |
 * |-----------------|-----------------|----------------------------------------------------|
 * | phone           | `< 768px`       | Center brand, stacked search, bottom nav           |
 * | tablet          | `768–1023px`    | Brand left + inline search + menu (no mega menu)   |
 * | laptop (`lg+`)  | `≥ 1024px`      | Brand left + search + actions + mega menu          |
 */
export const BREAKPOINT_PX = {
  md: 768,
  lg: 1024,
  laptop: 1024,
  xl: 1280,
} as const;

export type BreakpointName = keyof typeof BREAKPOINT_PX;

/**
 * Shared Tailwind fragments for width-based header chrome.
 */
export const HEADER_CHROME = {
  /** Bottom nav — phone + tablet (`< lg`). */
  bottomNav: "lg:hidden",

  /** Desktop mega menu — laptop and up. */
  megaMenu: "hidden border-t border-border bg-card lg:block",

  /** Page padding clearing the bottom nav below `lg`. */
  pageBottomPad:
    "pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0",
} as const;

export type HeaderChromeKey = keyof typeof HEADER_CHROME;
