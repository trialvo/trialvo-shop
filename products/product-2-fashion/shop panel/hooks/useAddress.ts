"use client";

import { authKeys } from "@/hooks/useAuth";
import type { ApiResponse, User } from "@/lib/api/auth/service";
import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useCallback } from "react";

import type { Address } from "@/components/account/types";
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

import { getUnknownErrorMessage } from "@/lib/api/errors";

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

type AddressCacheContext = {
  previousLists: Array<[QueryKey, AddressItem[] | undefined]>;
  previousUser?: User;
  previousDetail?: SingleAddressResponse;
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

const normalizeAddressType = (
  type?: string,
  fallback: AddressItem["address_type"] = "home",
): AddressItem["address_type"] => {
  const s = String(type ?? "").trim().toLowerCase();
  if (s === "home" || s === "office" || s === "n/a") return s;
  if (s === "na") return "n/a";
  return fallback;
};

const toDashboardAddress = (item: AddressItem): Address => ({
  id: item.id,
  phone_id: item.phone_id,
  name: item.name,
  address_type: item.address_type,
  full_address: item.full_address,
  city: item.city,
  zip_code: item.zip_code,
});

export const useAddress = (params?: { limit?: number; offset?: number }) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const ui = useAppSelector((s) => s.ui);
  const isLoading = ui.isLoading;
  const error = ui.error;
  const success = ui.success;

  const isAuthenticated = AuthCookies.isAuthenticated();

  const clearUi = () => dispatch(resetAuthUi());

  const snapshotAddressLists = (): AddressCacheContext["previousLists"] =>
    queryClient.getQueriesData<AddressItem[]>({ queryKey: addressKeys.all });

  const restoreAddressLists = (
    previousLists: AddressCacheContext["previousLists"],
  ) => {
    for (const [key, data] of previousLists) {
      queryClient.setQueryData(key, data);
    }
  };

  const patchAddressLists = (
    updater: (items: AddressItem[]) => AddressItem[],
  ) => {
    const lists = queryClient.getQueriesData<AddressItem[]>({
      queryKey: [...addressKeys.all, "list"],
    });
    for (const [key, data] of lists) {
      if (!Array.isArray(data)) continue;
      queryClient.setQueryData(key, updater(data));
    }
  };

  const syncUserFromAddressItems = (items: AddressItem[]) => {
    const user = queryClient.getQueryData<User>(authKeys.user());
    if (!user) return;

    const addresses = items.map(toDashboardAddress);
    const defaultItem = items.find((item) => item.is_default === 1);
    const default_address = defaultItem
      ? toDashboardAddress(defaultItem)
      : user.default_address;

    const next: User = {
      ...user,
      addresses,
      default_address,
    };
    queryClient.setQueryData<User>(authKeys.user(), next);
    AuthCookies.setUser(next);
  };

  const syncUserIfReturned = (res: unknown) => {
    const u = extractUserIfAny(res);
    if (!u) return;

    AuthCookies.setUser(u);
    queryClient.setQueryData<User>(authKeys.user(), u);
  };

  const revalidateCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: addressKeys.all }),
      queryClient.invalidateQueries({ queryKey: authKeys.user() }),
    ]);
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
    onMutate: async (payload): Promise<AddressCacheContext> => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));

      await queryClient.cancelQueries({ queryKey: addressKeys.all });
      await queryClient.cancelQueries({ queryKey: authKeys.user() });

      const previousLists = snapshotAddressLists();
      const previousUser = queryClient.getQueryData<User>(authKeys.user());

      const tempId = -Date.now();
      const optimisticItem: AddressItem = {
        id: tempId,
        name: payload.name,
        address_type: normalizeAddressType(payload.type),
        full_address: payload.full_address,
        city: payload.city ?? "",
        zip_code: payload.zip_code ?? "",
        created_at: new Date().toISOString(),
        phone_id: 0,
        phone_number: payload.phone ?? "",
        is_verified: 0,
        is_default: 0,
      };

      patchAddressLists((items) => [optimisticItem, ...items]);
      const firstList = queryClient.getQueryData<AddressItem[]>(
        addressKeys.list(params),
      );
      if (firstList) syncUserFromAddressItems(firstList);

      return { previousLists, previousUser };
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Create address failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Address created successfully!"));
      syncUserIfReturned(res);
      await revalidateCaches();
    },
    onError: (err: unknown, _payload, context) => {
      if (context) {
        restoreAddressLists(context.previousLists);
        if (context.previousUser) {
          queryClient.setQueryData(authKeys.user(), context.previousUser);
          AuthCookies.setUser(context.previousUser);
        }
      }
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
    onMutate: async ({
      id,
      payload,
    }): Promise<AddressCacheContext> => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));

      await queryClient.cancelQueries({ queryKey: addressKeys.all });
      await queryClient.cancelQueries({ queryKey: authKeys.user() });

      const previousLists = snapshotAddressLists();
      const previousUser = queryClient.getQueryData<User>(authKeys.user());
      const previousDetail = queryClient.getQueryData<SingleAddressResponse>(
        addressKeys.detail(id),
      );

      patchAddressLists((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                name: payload.name ?? item.name,
                full_address: payload.full_address ?? item.full_address,
                city: payload.city ?? item.city,
                zip_code: payload.zip_code ?? item.zip_code,
                address_type: payload.type
                  ? normalizeAddressType(payload.type, item.address_type)
                  : item.address_type,
                phone_number: payload.phone ?? item.phone_number,
              }
            : item,
        ),
      );

      if (previousDetail?.address) {
        queryClient.setQueryData<SingleAddressResponse>(addressKeys.detail(id), {
          ...previousDetail,
          address: {
            ...previousDetail.address,
            name: payload.name ?? previousDetail.address.name,
            full_address:
              payload.full_address ?? previousDetail.address.full_address,
            city: payload.city ?? previousDetail.address.city,
            zip_code: payload.zip_code ?? previousDetail.address.zip_code,
            type: payload.type
              ? normalizeAddressType(
                  payload.type,
                  previousDetail.address.type,
                )
              : previousDetail.address.type,
            phone: previousDetail.address.phone
              ? {
                  ...previousDetail.address.phone,
                  number:
                    payload.phone ?? previousDetail.address.phone.number,
                }
              : previousDetail.address.phone,
            location_mapping_id:
              payload.location_mapping_id !== undefined
                ? payload.location_mapping_id
                : previousDetail.address.location_mapping_id,
          },
        });
      }

      const firstList = queryClient.getQueryData<AddressItem[]>(
        addressKeys.list(params),
      );
      if (firstList) syncUserFromAddressItems(firstList);

      return { previousLists, previousUser, previousDetail };
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Update address failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Address updated successfully!"));
      syncUserIfReturned(res);
      await revalidateCaches();
    },
    onError: (err: unknown, variables, context) => {
      if (context) {
        restoreAddressLists(context.previousLists);
        if (context.previousUser) {
          queryClient.setQueryData(authKeys.user(), context.previousUser);
          AuthCookies.setUser(context.previousUser);
        }
        if (context.previousDetail) {
          queryClient.setQueryData(
            addressKeys.detail(variables.id),
            context.previousDetail,
          );
        }
      }
      dispatch(setError(getUnknownErrorMessage(err, "Update address failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => addressService.deleteAddress(id),
    onMutate: async (id): Promise<AddressCacheContext> => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));

      await queryClient.cancelQueries({ queryKey: addressKeys.all });
      await queryClient.cancelQueries({ queryKey: authKeys.user() });

      const previousLists = snapshotAddressLists();
      const previousUser = queryClient.getQueryData<User>(authKeys.user());

      patchAddressLists((items) => items.filter((item) => item.id !== id));
      const firstList = queryClient.getQueryData<AddressItem[]>(
        addressKeys.list(params),
      );
      if (firstList) syncUserFromAddressItems(firstList);

      return { previousLists, previousUser };
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Delete address failed"));
        return;
      }

      if (res?.message) {
        dispatch(setSuccess(res.message || "Address deleted successfully!"));
      }

      await revalidateCaches();
    },
    onError: (err: unknown, _id, context) => {
      if (context) {
        restoreAddressLists(context.previousLists);
        if (context.previousUser) {
          queryClient.setQueryData(authKeys.user(), context.previousUser);
          AuthCookies.setUser(context.previousUser);
        }
      }
      dispatch(setError(getUnknownErrorMessage(err, "Delete address failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number | string) => addressService.setDefaultAddress(id),
    onMutate: async (id): Promise<AddressCacheContext> => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));

      await queryClient.cancelQueries({ queryKey: addressKeys.all });
      await queryClient.cancelQueries({ queryKey: authKeys.user() });

      const previousLists = snapshotAddressLists();
      const previousUser = queryClient.getQueryData<User>(authKeys.user());
      const numId = Number(id);

      patchAddressLists((items) =>
        items.map((item) => ({
          ...item,
          is_default: item.id === numId ? 1 : 0,
        })),
      );
      const firstList = queryClient.getQueryData<AddressItem[]>(
        addressKeys.list(params),
      );
      if (firstList) syncUserFromAddressItems(firstList);

      return { previousLists, previousUser };
    },
    onSuccess: async (res: AddressMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Set default failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Default address updated!"));
      syncUserIfReturned(res);
      await revalidateCaches();
    },
    onError: (err: unknown, _id, context) => {
      if (context) {
        restoreAddressLists(context.previousLists);
        if (context.previousUser) {
          queryClient.setQueryData(authKeys.user(), context.previousUser);
          AuthCookies.setUser(context.previousUser);
        }
      }
      dispatch(setError(getUnknownErrorMessage(err, "Set default failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

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
    addresses: addressesQuery.data ?? [],
    addressesLoading: addressesQuery.isLoading,
    addressesError: addressesQuery.error,

    useAddressById,

    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,

    isLoading,
    error,
    success,
    clearUi,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
  };
};
