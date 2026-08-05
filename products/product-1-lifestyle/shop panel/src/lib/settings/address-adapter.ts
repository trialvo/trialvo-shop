import type {
  AddressItem,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@/lib/api/address/service";
import type { Address, AddressUsage } from "@/types";

type AddressType = CreateAddressPayload["type"];

const DEFAULT_COUNTRY = "United Arab Emirates";

export function toUiAddress(address: AddressItem): Address {
  const usage = toAddressUsage(address.address_type);

  return {
    id: String(address.id),
    label: toLabel(usage),
    usage,
    fullName: address.name || "Customer",
    phone: address.phone_number ?? "",
    street: address.full_address ?? "",
    city: address.city ?? "",
    state: "",
    zip: address.zip_code ?? "",
    country: DEFAULT_COUNTRY,
    isDefault: Boolean(address.is_default),
  };
}

export function toCreateAddressPayload(address: Omit<Address, "id">): CreateAddressPayload {
  return {
    name: address.fullName.trim(),
    phone: address.phone.trim() || undefined,
    type: toAddressType(address.usage),
    full_address: address.street.trim(),
    city: address.city.trim() || undefined,
    zip_code: address.zip.trim() || undefined,
    location_mapping_id: null,
  };
}

export function toUpdateAddressPayload(address: Address): UpdateAddressPayload {
  return {
    name: address.fullName.trim(),
    phone: address.phone.trim() || undefined,
    type: toAddressType(address.usage),
    full_address: address.street.trim(),
    city: address.city.trim() || undefined,
    zip_code: address.zip.trim() || undefined,
    location_mapping_id: null,
  };
}

function toAddressUsage(type: AddressItem["address_type"]): AddressUsage {
  if (type === "home") return "shipping";
  if (type === "office") return "billing";
  return "both";
}

function toLabel(usage: AddressUsage): string {
  if (usage === "shipping") return "Shipping";
  if (usage === "billing") return "Billing";
  return "Shipping & Billing";
}

function toAddressType(usage: AddressUsage): AddressType {
  if (usage === "shipping") return "home";
  if (usage === "billing") return "office";
  return "n/a";
}
