import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getMegaSaleSettings,
  updateMegaSaleSettings,
  getMegaSaleProductsList,
  addMegaSaleProduct,
  updateMegaSaleProduct,
  deleteMegaSaleProduct,
  getMegaSaleProductSkus,
  updateSkuOverride,
  deleteSkuOverride,
} from "@/api/megasale.api";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const megaSaleKeys = {
  all: ["megaSale"] as const,
  settings: () => [...megaSaleKeys.all, "settings"] as const,
  productsList: (params?: Record<string, unknown>) =>
    [...megaSaleKeys.all, "productsList", params ?? {}] as const,
  productSkus: (megaSaleProductId: number) =>
    [...megaSaleKeys.all, "productSkus", megaSaleProductId] as const,
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useMegaSaleSettings() {
  return useQuery({
    queryKey: megaSaleKeys.settings(),
    queryFn: getMegaSaleSettings,
    staleTime: 30_000,
  });
}

export function useUpdateMegaSaleSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMegaSaleSettings,
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: megaSaleKeys.all });
    },
    onError: () => toast.error("Failed to save settings"),
  });
}

// ─── Browsable Products List ──────────────────────────────────────────────────

export function useMegaSaleProductsList(params: {
  page?: number;
  limit?: number;
  search?: string;
  enrolled?: "yes" | "no" | "";
}) {
  return useQuery({
    queryKey: megaSaleKeys.productsList(params as Record<string, unknown>),
    queryFn: () => getMegaSaleProductsList(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

// ─── Product Enrollment Mutations ─────────────────────────────────────────────

export function useAddMegaSaleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addMegaSaleProduct,
    onSuccess: () => {
      toast.success("Product added to Mega Sale");
      qc.invalidateQueries({ queryKey: megaSaleKeys.all });
    },
    onError: () => toast.error("Failed to add product"),
  });
}

export function useUpdateMegaSaleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; is_active?: boolean; end_at?: string | null; serial?: number }) =>
      updateMegaSaleProduct(id, body),
    onSuccess: () => {
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: megaSaleKeys.all });
    },
    onError: () => toast.error("Failed to update"),
  });
}

export function useDeleteMegaSaleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMegaSaleProduct,
    onSuccess: () => {
      toast.success("Product removed from Mega Sale");
      qc.invalidateQueries({ queryKey: megaSaleKeys.all });
    },
    onError: () => toast.error("Failed to remove product"),
  });
}

// ─── SKU Overrides ────────────────────────────────────────────────────────────

export function useMegaSaleProductSkus(megaSaleProductId: number | null) {
  return useQuery({
    queryKey: megaSaleKeys.productSkus(megaSaleProductId ?? 0),
    queryFn: () => getMegaSaleProductSkus(megaSaleProductId!),
    enabled: megaSaleProductId != null && megaSaleProductId > 0,
    staleTime: 15_000,
  });
}

export function useUpdateSkuOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      megaSaleProductId,
      skuId,
      ...body
    }: {
      megaSaleProductId: number;
      skuId: number;
      is_excluded?: boolean;
      end_at?: string | null;
    }) => updateSkuOverride(megaSaleProductId, skuId, body),
    onSuccess: () => {
      toast.success("SKU override saved");
      qc.invalidateQueries({ queryKey: megaSaleKeys.all });
    },
    onError: () => toast.error("Failed to save SKU override"),
  });
}

export function useDeleteSkuOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSkuOverride,
    onSuccess: () => {
      toast.success("SKU reset to inherit");
      qc.invalidateQueries({ queryKey: megaSaleKeys.all });
    },
    onError: () => toast.error("Failed to reset SKU"),
  });
}
