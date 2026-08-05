import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type DeliveryChargeItem = {
  id: number;
  title: string;
  type: string;
  customer_charge: number;
  img_path?: string | null;
  weight_free_kg?: number | null;
  extra_per_kg?: number | null;
  default_weight_kg?: number | null;
  extra_charge_per_kg?: number | null;
};

export type DeliveryChargesResponse = {
  success: boolean;
  delivery_charges: DeliveryChargeItem[];
  message?: string;
  error?: string;
  flag?: number;
};

export type DeliveryArea = {
  id: number;
  area_name: string;
};

export type DeliveryCity = {
  city_name: string;
  areas: DeliveryArea[];
};

export type DeliveryAreasResponse = {
  success: boolean;
  data: DeliveryCity[];
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

class DeliveryService {
  async getCharges(): Promise<DeliveryChargesResponse> {
    try {
      const res = await api.get<DeliveryChargesResponse>("/user/delivery/charges");
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get delivery charges"));
    }
  }

  async getAreas(search?: string): Promise<DeliveryAreasResponse> {
    try {
      const params = search ? { search } : {};
      const res = await api.get<DeliveryAreasResponse>("/delivery-areas", { params });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get delivery areas"));
    }
  }
}

export const deliveryService = new DeliveryService();
