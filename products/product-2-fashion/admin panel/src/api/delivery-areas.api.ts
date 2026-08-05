// src/api/delivery-areas.api.ts
import { api } from "./client";

export type DeliveryAreaItem = {
  id: number;           // location_mapping_id
  area_name: string;
};

export type DeliveryCityGroup = {
  city_name: string;
  areas: DeliveryAreaItem[];
};

export type DeliveryAreasResponse = {
  success: boolean;
  data: DeliveryCityGroup[];
};

export async function getDeliveryAreas(): Promise<DeliveryAreasResponse> {
  const res = await api.get<DeliveryAreasResponse>("/delivery-areas");
  return res.data;
}
