"use client";

import { addressService } from "@/lib/api/address/service";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import type { Address } from "@/types";
import {
  toCreateAddressPayload,
  toUiAddress,
  toUpdateAddressPayload,
} from "@/lib/settings/address-adapter";
import { authKeys } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const accountAddressKeys = {
  all: ["account-addresses"] as const,
  list: () => [...accountAddressKeys.all, "list"] as const,
};

export type AccountAddressWriteResult = {
  message?: string;
  defaultAddressError?: string;
};

export function useAccountAddresses(enabled: boolean) {
  const queryClient = useQueryClient();

  const listQuery = useQuery<Address[], Error>({
    queryKey: accountAddressKeys.list(),
    enabled,
    queryFn: async () => {
      const response = await addressService.getAddresses({ limit: 50, offset: 0 });

      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to load addresses");
      }

      return response.data.map(toUiAddress);
    },
  });

  const invalidateAccountData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: accountAddressKeys.list() }),
      queryClient.invalidateQueries({ queryKey: authKeys.user() }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async (address: Omit<Address, "id">): Promise<AccountAddressWriteResult> => {
      const response = await addressService.createAddress(toCreateAddressPayload(address));

      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to create address");
      }

      const createdId = getCreatedAddressId(response);
      const defaultAddressError =
        address.isDefault && createdId ? await trySetDefaultAddress(createdId) : undefined;

      return { message: response.message, defaultAddressError };
    },
    onSettled: invalidateAccountData,
  });

  const updateMutation = useMutation({
    mutationFn: async (address: Address): Promise<AccountAddressWriteResult> => {
      const id = toAddressId(address.id);
      const response = await addressService.updateAddress(id, toUpdateAddressPayload(address));

      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to update address");
      }

      const defaultAddressError = address.isDefault ? await trySetDefaultAddress(id) : undefined;

      return { message: response.message, defaultAddressError };
    },
    onSettled: invalidateAccountData,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await addressService.deleteAddress(toAddressId(id));

      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to delete address");
      }

      return response;
    },
    onSuccess: invalidateAccountData,
  });

  return {
    addresses: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutateAsync,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

function toAddressId(id: string): number {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid address id");
  }
  return numericId;
}

function getCreatedAddressId(response: { address_id?: unknown; data?: unknown }) {
  if (typeof response.address_id === "number") return response.address_id;

  if (typeof response.data === "object" && response.data !== null) {
    const data = response.data as { address_id?: unknown; id?: unknown };
    if (typeof data.address_id === "number") return data.address_id;
    if (typeof data.id === "number") return data.id;
  }

  return null;
}

async function trySetDefaultAddress(id: number): Promise<string | undefined> {
  try {
    const response = await addressService.setDefaultAddress(id);
    if (!response.success) {
      return response.error || response.message || "Address saved, but default address was not changed";
    }
    return undefined;
  } catch (error) {
    return getUnknownErrorMessage(
      error,
      "Address saved, but default address was not changed",
    );
  }
}
