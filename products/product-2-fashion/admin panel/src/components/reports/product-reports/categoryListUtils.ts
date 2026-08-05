// src/components/reports/product-reports/report/categoryListUtils.ts

export function unwrapList<T>(payload: any): T[] {
  if (!payload) return [];

  // Common patterns
  if (Array.isArray(payload)) return payload as T[];

  // ListResponse often stores inside .data or .rows
  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.rows)) return payload.rows as T[];

  // Sometimes nested
  if (Array.isArray(payload.data?.data)) return payload.data.data as T[];
  if (Array.isArray(payload.data?.rows)) return payload.data.rows as T[];

  // Some APIs use "items"
  if (Array.isArray(payload.items)) return payload.items as T[];
  if (Array.isArray(payload.data?.items)) return payload.data.items as T[];

  return [];
}

export function toSelectOptions<T extends { id: number; name: string }>(
  items: T[],
  allLabel: string
): Array<{ value: string; label: string }> {
  return [{ value: "all", label: allLabel }, ...items.map((x) => ({ value: String(x.id), label: x.name }))];
}
