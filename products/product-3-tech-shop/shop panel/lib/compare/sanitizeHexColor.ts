/**
 * Allow only safe CSS hex colors (#RGB / #RRGGBB / #RRGGBBAA).
 * Prevents CSS injection via `style={{ background }}`.
 */
export function sanitizeHexColor(
  hex: string | null | undefined,
): string | null {
  if (!hex || typeof hex !== "string") return null;
  const trimmed = hex.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}
