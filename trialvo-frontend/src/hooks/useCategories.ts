import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface LocalizedText {
  bn?: string;
  en?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  icon: string | null;
  sort_order: number;
  is_active: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

// PostgreSQL returns JSONB columns already parsed, but guard against string form
// in case a driver/proxy serializes them differently.
function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function normalize(row: any): Category {
  return {
    ...row,
    name: parseJson<LocalizedText>(row.name, {}),
    description: parseJson<LocalizedText | null>(row.description, null),
    product_count: row.product_count != null ? Number(row.product_count) : undefined,
  };
}

// ── Public ────────────────────────────────────────────────────────────────
async function fetchPublicCategories(): Promise<Category[]> {
  const data = await api.get<any[]>("/categories");
  return data.map(normalize);
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories", "public"],
    queryFn: fetchPublicCategories,
    staleTime: 1000 * 60,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────
async function fetchAdminCategories(): Promise<Category[]> {
  const data = await api.get<any[]>("/admin/categories");
  return data.map(normalize);
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["categories", "admin"],
    queryFn: fetchAdminCategories,
    staleTime: 1000 * 30,
  });
}

export interface CategoryInput {
  slug?: string;
  name?: LocalizedText;
  description?: LocalizedText;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const create = useMutation({
    mutationFn: (input: CategoryInput) => api.post<Category>("/admin/categories", input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      api.put<Category>(`/admin/categories/${id}`, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/admin/categories/${id}`),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      api.put<{ message: string }>("/admin/categories/reorder", { items }),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder };
}
