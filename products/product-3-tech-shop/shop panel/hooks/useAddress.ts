"use client";

import {
  addressService,
  type AddressItem,
  type CreateAddressPayload,
  type UpdateAddressPayload,
  type AddressMutationResponse,
} from "@/lib/api/address/service";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import {
  assertValidAddressId,
  normalizeAddressItem,
} from "@/lib/adapters/accountAddress";

export const addressKeys = {
  all: ["address"] as const,
  list: () => [...addressKeys.all, "list"] as const,
  detail: (id: number) => [...addressKeys.all, "detail", id] as const,
};

export const useAddress = () => {
  const queryClient = useQueryClient();
  
  const { isAuthenticated } = useAuth();

  const addressesQuery = useQuery({
    queryKey: addressKeys.list(),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AddressItem[]> => {
      const res = await addressService.getAddresses({ limit: 50 });
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to load addresses");
      }
      const rows = Array.isArray(res.data) ? res.data : [];
      // List API is flat; normalize so cards always get nested phone + type.
      return rows.map((row) => normalizeAddressItem(row));
    },
  });

  const createAddress = useMutation<AddressMutationResponse, Error, CreateAddressPayload>({
    mutationFn: async (payload) => {
      const res = await addressService.createAddress(payload);
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to create address");
      }
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to create address"));
    },
  });

  const updateAddress = useMutation<AddressMutationResponse, Error, { id: number; payload: UpdateAddressPayload }>({
    mutationFn: async ({ id, payload }) => {
      const safeId = assertValidAddressId(id);
      const res = await addressService.updateAddress(safeId, payload);
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to update address");
      }
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to update address"));
    },
  });

  const deleteAddress = useMutation<AddressMutationResponse, Error, number>({
    mutationFn: async (id) => {
      const safeId = assertValidAddressId(id);
      const res = await addressService.deleteAddress(safeId);
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to delete address");
      }
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to delete address"));
    },
  });

  const setDefaultAddress = useMutation<AddressMutationResponse, Error, number>({
    mutationFn: async (id) => {
      const safeId = assertValidAddressId(id);
      const res = await addressService.setDefaultAddress(safeId);
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to set default address");
      }
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to set default address"));
    },
  });

  return {
    addresses: addressesQuery.data ?? [],
    addressesLoading: addressesQuery.isLoading,
    addressesError: addressesQuery.error,
    refetchAddresses: addressesQuery.refetch,

    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
};
