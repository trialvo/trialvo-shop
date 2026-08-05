import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export type AddressPhone = {
  id: number;
  number: string;
  is_verified: boolean;
};

export type SingleAddress = {
  id: number;
  name: string;
  type: "home" | "office" | "n/a";
  full_address: string;
  city: string;
  zip_code: string;
  location_mapping_id: number | null;
  area_name: string | null;
  created_at: string;
  phone: AddressPhone | null;
  is_default: boolean;
};

/**
 * Normalized address row used across the storefront.
 * Raw list responses are flat (`phone_id`, `phone_number`); adapters normalize them here.
 */
export type AddressItem = SingleAddress;

/** Raw list row from GET /user/addresses before normalization. */
export type AddressListApiRow = {
  id: number;
  name: string;
  address_type?: string;
  type?: string;
  full_address: string;
  city?: string | null;
  zip_code?: string | null;
  created_at?: string;
  phone_id?: number | null;
  phone_number?: string | null;
  is_verified?: boolean | number | null;
  phone?: AddressPhone | null;
  is_default?: boolean | number | null;
  location_mapping_id?: number | null;
  area_name?: string | null;
};

export type AddressListResponse = {
  success: boolean;
  pagination?: Pagination;
  data: AddressItem[];
  message?: string;
  error?: string;
  flag?: number;
};

export type AddressDetailResponse = {
  success: boolean;
  data: AddressItem;
  message?: string;
  error?: string;
  flag?: number;
};

export type SingleAddressResponse = {
  success: boolean;
  address: SingleAddress;
  message?: string;
  error?: string;
  flag?: number;
};

export type AddressMutationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  flag?: number;
  data?: unknown;
};

export type CreateAddressPayload = {
  name: string;
  phone?: string;
  type: string;
  full_address: string;
  city?: string;
  zip_code?: string;
  location_mapping_id?: number | null;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

const ADDRESS_BASE = "/user/address";
const DEFAULT_BASE = "/user/setDefaultAddress";

type AddressListApiResponse = Omit<AddressListResponse, "data"> & {
  data: AddressListApiRow[];
};

class AddressService {
  async getAddresses(params?: { limit?: number; offset?: number }): Promise<AddressListApiResponse> {
    try {
      const response = await api.get<AddressListApiResponse>('/user/addresses', {
        params: {
          limit: params?.limit ?? 10,
          offset: params?.offset ?? 0,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get addresses"));
    }
  }

  async getAddressById(id: number): Promise<SingleAddressResponse> {
    try {
      const response = await api.get<SingleAddressResponse>(`${ADDRESS_BASE}/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get address"));
    }
  }

  async createAddress(payload: CreateAddressPayload): Promise<AddressMutationResponse> {
    try {
      const response = await api.post<AddressMutationResponse>(ADDRESS_BASE, payload);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to create address"));
    }
  }

  async updateAddress(id: number, payload: UpdateAddressPayload): Promise<AddressMutationResponse> {
    try {
      const response = await api.put<AddressMutationResponse>(`${ADDRESS_BASE}/${id}`, payload);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to update address"));
    }
  }

  async deleteAddress(id: number): Promise<AddressMutationResponse> {
    try {
      const response = await api.delete<AddressMutationResponse>(`${ADDRESS_BASE}/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to delete address"));
    }
  }

  async setDefaultAddress(id: number | string): Promise<AddressMutationResponse> {
    try {
      const response = await api.patch<AddressMutationResponse>(
        `${DEFAULT_BASE}`, {
        address_id: id
      },
      );
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to set default address"));
    }
  }
}

export const addressService = new AddressService();
