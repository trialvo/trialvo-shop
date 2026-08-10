import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: ShopUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getShopToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shop_token");
}

export function setShopToken(token: string) {
  localStorage.setItem("shop_token", token);
}

export function removeShopToken() {
  localStorage.removeItem("shop_token");
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useShopLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/auth/login", payload);
      return data;
    },
    onSuccess: (data) => {
      setShopToken(data.token);
      queryClient.setQueryData(["shop-me"], data.user);
    },
  });
}

export function useShopRegister() {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, RegisterPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/auth/register", payload);
      return data;
    },
    onSuccess: (data) => {
      setShopToken(data.token);
      queryClient.setQueryData(["shop-me"], data.user);
    },
  });
}

export function useShopMe() {
  return useQuery<ShopUser>({
    queryKey: ["shop-me"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data.user;
    },
    enabled: !!getShopToken(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useShopLogout() {
  const queryClient = useQueryClient();
  return () => {
    removeShopToken();
    queryClient.clear();
  };
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; user: ShopUser },
    Error,
    Partial<ShopUser>
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put("/auth/me", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["shop-me"], data.user);
    },
  });
}

export function useChangePassword() {
  return useMutation<
    { success: boolean },
    Error,
    { currentPassword: string; newPassword: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put("/auth/me/password", payload);
      return data;
    },
  });
}
