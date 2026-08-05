/**
 * Shared breadcrumb trail types — used by layout Breadcrumbs + page callers.
 */
export type BreadcrumbItem = Readonly<{
  /** Visible label (already humanized). */
  label: string;
  /**
   * Link target. Omit (or leave undefined) for the current page crumb —
   * it renders as non-interactive text.
   */
  href?: string;
}>;

export type BreadcrumbTrail = readonly BreadcrumbItem[];
