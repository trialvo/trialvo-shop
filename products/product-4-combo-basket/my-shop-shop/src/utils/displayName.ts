/**
 * dn — display name helper
 * Always returns the English (main) name.
 */
export function dn(item: { name: string; name_bn?: string | null }): string {
  return item.name;
}
