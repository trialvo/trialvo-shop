/**
 * Format a BDT amount for compare / budget UIs.
 */
export function fmtBdt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `৳${Number(n).toLocaleString()}`;
}
