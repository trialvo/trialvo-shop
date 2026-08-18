import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";

function parseJsonField<T>(value: unknown, fallback: T): T {
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

function rowToProduct(row: any): Product {
  const imagesRaw = parseJsonField<{ admin?: string[]; shop?: string[] }>(row.images, {});
  const name = parseJsonField(row.name, { bn: "", en: "" });
  const shortDescription = parseJsonField(row.short_description, { bn: "", en: "" });
  const features = parseJsonField(row.features, { bn: [] as string[], en: [] as string[] });
  const facilities = parseJsonField(row.facilities, { bn: [] as string[], en: [] as string[] });
  const seo = parseJsonField(row.seo, {
    title: { bn: "", en: "" },
    description: { bn: "", en: "" },
    keywords: { bn: [] as string[], en: [] as string[] },
  });
  const demo = parseJsonField(row.demo, [] as Product["demo"]);
  const faq = parseJsonField(row.faq, [] as Product["faq"]);
  const deployConfig = parseJsonField<Record<string, unknown> | null>(row.deploy_config, null);

  return {
    id: row.id,
    slug: row.slug || "",
    category: row.category || "",
    priceBDT: Number(row.price_bdt) || 0,
    priceUSD: Number(row.price_usd) || 0,
    discountPercent: Number(row.discount_percent) || 0,
    thumbnail: row.thumbnail || "",
    images: {
      admin: Array.isArray(imagesRaw?.admin) ? imagesRaw.admin : [],
      shop: Array.isArray(imagesRaw?.shop) ? imagesRaw.shop : [],
    },
    videoUrl: row.video_url || undefined,
    demo: Array.isArray(demo) ? demo : [],
    name: {
      bn: name?.bn ?? "",
      en: name?.en ?? "",
    },
    shortDescription: {
      bn: shortDescription?.bn ?? "",
      en: shortDescription?.en ?? "",
    },
    features: {
      bn: Array.isArray(features?.bn) ? features.bn : [],
      en: Array.isArray(features?.en) ? features.en : [],
    },
    facilities: {
      bn: Array.isArray(facilities?.bn) ? facilities.bn : [],
      en: Array.isArray(facilities?.en) ? facilities.en : [],
    },
    faq: Array.isArray(faq) ? faq : [],
    seo: {
      title: { bn: seo?.title?.bn ?? "", en: seo?.title?.en ?? "" },
      description: { bn: seo?.description?.bn ?? "", en: seo?.description?.en ?? "" },
      keywords: {
        bn: Array.isArray(seo?.keywords?.bn) ? seo.keywords.bn : [],
        en: Array.isArray(seo?.keywords?.en) ? seo.keywords.en : [],
      },
    },
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    isTrialable: Boolean(row.is_trialable),
    sortOrder: Number(row.sort_order || 0),
    deployConfig: deployConfig && typeof deployConfig === "object" ? deployConfig : null,
    createdAt: row.created_at,
  };
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const data = await api.get<any[]>("/admin/products");
      return data.map(rowToProduct);
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Record<string, any>) => {
      return await api.post("/admin/products", product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Record<string, any>) => {
      return await api.put(`/admin/products/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/admin/products/${id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useBulkToggleProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      field,
      value,
    }: {
      ids: string[];
      field: "is_active" | "is_featured";
      value: boolean;
    }) => {
      return await api.post<{ message: string }>("/admin/products/bulk", {
        ids,
        field,
        value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useReorderProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      return await api.put<{ message: string }>("/admin/products/reorder", {
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}
