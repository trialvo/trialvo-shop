"use client";

import { authKeys } from "@/hooks/useAuth";
import type { ApiResponse, User } from "@/lib/api/auth/service";
import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { useCallback } from "react";

import { AddressItem } from "@/components/account/address-book/types";
import {
  addressService,
  SingleAddressResponse,
  type AddressListResponse,
  type AddressMutationResponse,
  type CreateAddressPayload,
  type UpdateAddressPayload,
} from "@/lib/api/address/service";
import {
  resetAuthUi,
  setError,
  setLoading,
  setSuccess,
} from "@/redux/slices/uiSlice";

import {
  type ApiErrorResponse,
  getAxiosErrorMessage,
  getUnknownErrorMessage,
} from "@/lib/api/errors";

export const addressKeys = {
  all: ["address"] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    [
      ...addressKeys.all,
      "list",
      params?.limit ?? 10,
      params?.offset ?? 0,
    ] as const,
  detail: (id: number) => [...addressKeys.all, "detail", id] as const,
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isApiResponse = <T>(v: unknown): v is ApiResponse<T> => {
  if (!isPlainObject(v)) return false;
  return (
    "data" in v ||
    "success" in v ||
    "error" in v ||
    "message" in v ||
    "flag" in v
  );
};

const pickPayload = <T>(res: unknown): T | undefined => {
  if (isApiResponse<T>(res)) {
    const r = res as ApiResponse<T>;
    if (r.data !== undefined) return r.data;
    return res as unknown as T;
  }
  return res as T;
};

const extractAddressList = (res: AddressListResponse): AddressItem[] => {
  if (!res?.success) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

const extractUserIfAny = (res: unknown): User | null => {
  if (!isPlainObject(res)) return null;

  if (isApiResponse<{ user?: User }>(res)) {
    const payload = pickPayload<{ user?: User }>(res);
    const u = payload?.user ?? (res as ApiResponse<{ user?: User }>).data?.user;
    return u ?? null;
  }

  const data = (res as { data?: unknown }).data;
  if (isPlainObject(data) && "user" in data) {
    return (data as { user?: User }).user ?? null;
  }

  return null;
};

export const useAddress = (params?: { limit?: number; offset?: number }) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const ui = useAppSelector((s) => s.ui);
  const isLoading = ui.isLoading;
  const error = ui.error;
  const success = ui.success;

  const isAuthenticated = AuthCookies.isAuthenticated();

  const clearUi = () => dispatch(resetAuthUi());

  const revalidateUser = async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.user() });
  };

  const syncUserIfReturned = (res: unknown) => {
    const u = extractUserIfAny(res);
    if (!u) return;

    AuthCookies.setUser(u);
    queryClient.setQueryData<User>(authKeys.user(), u);
  };

  const addressesQuery = useQuery({
    queryKey: addressKeys.list(params),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AddressItem[]> => {
      const res = await addressService.getAddresses(params);

      if (!res?.success) {
        throw new Error(
          res?.error || res?.message || "Failed to load addresses",
        );
      }

      return extractAddressList(res);
    },
  });

  const useAddressById = (id: number) =>
    useQuery({
      queryKey: addressKeys.detail(id),
      enabled: isAuthenticated && Number.isFinite(id) && id > 0,
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<SingleAddressResponse> => {
        const res: SingleAddressResponse =
          await addressService.getAddressById(id);

        if (!res?.success) {
          throw new Error(res?.error || "Failed to load address");
        }

        if (!res.address) throw new Error("Address not found");

        return res;
      },
    });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      addressService.createAddress(payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Create address failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Address created successfully!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: addressKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Create address failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateAddressPayload;
    }) => addressService.updateAddress(id, payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Update address failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Address updated successfully!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: addressKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Update address failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => addressService.deleteAddress(id),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Delete address failed"));
        return;
      }

      if (res?.message) {
        dispatch(setSuccess(res.message || "Address deleted successfully!"));
      }

      await queryClient.invalidateQueries({ queryKey: addressKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Delete address failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number | string) => addressService.setDefaultAddress(id),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Set default failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Default address updated!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: addressKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Set default failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  // ---------------- Public APIs ----------------
  const createAddress = useCallback(
    (payload: CreateAddressPayload) => createMutation.mutateAsync(payload),
    [createMutation],
  );

  const updateAddress = useCallback(
    (id: number, payload: UpdateAddressPayload) =>
      updateMutation.mutateAsync({ id, payload }),
    [updateMutation],
  );

  const deleteAddress = useCallback(
    (id: number) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  const setDefaultAddress = useCallback(
    (id: number | string) => setDefaultMutation.mutateAsync(id),
    [setDefaultMutation],
  );

  return {
    // list
    addresses: addressesQuery.data ?? [],
    addressesLoading: addressesQuery.isLoading,
    addressesError: addressesQuery.error,

    // detail hook
    useAddressById,

    // actions
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,

    // ui
    isLoading,
    error,
    success,
    clearUi,

    // mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
  };
};
