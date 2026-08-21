/**
 * Header / search layout breakpoints (mobile-first min-widths).
 * Match Tailwind arbitrary classes: min-[576px], min-[768px], …
 */
export const HEADER_BREAKPOINTS = {
  /** Small / large mobile */
  sm: 576,
  /** Medium / tablet */
  md: 768,
  /** Large / small laptop */
  lg: 992,
  /** Extra large / desktop */
  xl: 1200,
  /** Extra extra large / widescreen */
  xxl: 1400,
} as const;

export type HeaderBreakpoint = keyof typeof HEADER_BREAKPOINTS;
