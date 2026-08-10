import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

// ───- Types ────────────────────────────────────────────────────────────────────

export interface Address {
  id: number;
  user_id: number;
  label?: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  is_default: boolean;
}

export interface AddressPayload {
  label?: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  is_default?: boolean;
}

export interface AddressListResponse {
  success: boolean;
  addresses: Address[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAddresses() {
  return useQuery<AddressListResponse>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await apiClient.get("/addresses");
      return data;
    },
    enabled:
      typeof window !== "undefined" && !!localStorage.getItem("shop_token"),
    staleTime: 2 * 60_000,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; address: Address },
    Error,
    AddressPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/addresses", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; address: Address },
    Error,
    { id: number; payload: Partial<AddressPayload> }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.put(`/addresses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/addresses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
