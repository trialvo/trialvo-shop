import { z } from "zod";
import type {
  AddressItem,
  AddressListApiRow,
  AddressPhone,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@/lib/api/address/service";
import {
  BD_DIVISIONS,
  getDistrictsForDivision,
  isBdDivision,
} from "@/lib/geo/bdLocations";
import { phoneSchema } from "@/lib/phone/schema";
import { parsePhoneValue, toApiPhoneNumber } from "@/lib/phone/parse";
import { sanitizeAuthText } from "@/lib/security/auth";

export {
  BD_DIVISIONS,
  BD_DISTRICTS_BY_DIVISION,
  getDistrictsForDivision,
  isBdDivision,
} from "@/lib/geo/bdLocations";
export type { BdDivision } from "@/lib/geo/bdLocations";

export type AddressType = "home" | "office" | "n/a";

export const ADDRESS_TYPES: readonly AddressType[] = [
  "home",
  "office",
  "n/a",
] as const;

export type AccountAddressFormValues = {
  name: string;
  phone: string;
  type: AddressType;
  address: string;
  district: string;
  division: string;
  zipCode: string;
};

export type AccountAddressViewModel = {
  id: number;
  name: string;
  type: AddressType;
  typeLabel: string;
  line: string;
  /** Display number, or empty when missing. */
  phoneLabel: string;
  phoneId: number | null;
  hasPhone: boolean;
  isPhoneVerified: boolean;
  isDefault: boolean;
  cityLabel: string;
};

const addressTypeSchema = z.enum(["home", "office", "n/a"]);

export const accountAddressFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  phone: phoneSchema,
  type: addressTypeSchema,
  address: z
    .string()
    .trim()
    .min(1, "Address is required.")
    .min(5, "Address must be at least 5 characters.")
    .max(300, "Address is too long."),
  district: z
    .string()
    .trim()
    .min(1, "District is required.")
    .max(100, "District is too long."),
  division: z
    .string()
    .trim()
    .min(1, "Division is required.")
    .refine((value) => isBdDivision(value), {
      message: "Select a valid division.",
    }),
  zipCode: z.string().trim().max(20).optional().or(z.literal("")),
});

export type AccountAddressFormSchema = z.infer<typeof accountAddressFormSchema>;

export function emptyAddressFormValues(): AccountAddressFormValues {
  return {
    name: "",
    phone: "",
    type: "home",
    address: "",
    district: "",
    division: "",
    zipCode: "",
  };
}

function resolveType(raw: string | null | undefined): AddressType {
  if (raw === "home" || raw === "office" || raw === "n/a") return raw;
  return "home";
}

function typeLabel(type: AddressType): string {
  switch (type) {
    case "home":
      return "Home";
    case "office":
      return "Office";
    default:
      return "Other";
  }
}

function asBooleanFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

/**
 * List API returns flat phone columns; detail API nests `phone`.
 * Normalize once so the rest of the UI can stay type-safe.
 */
export function normalizeAddressItem(row: AddressListApiRow): AddressItem {
  const nested = row.phone ?? null;
  const phoneId =
    nested?.id ??
    (typeof row.phone_id === "number" && row.phone_id > 0 ? row.phone_id : null);
  const phoneNumber = (nested?.number ?? row.phone_number ?? "").trim();
  const isVerified = nested
    ? Boolean(nested.is_verified)
    : asBooleanFlag(row.is_verified);

  const phone: AddressPhone | null =
    phoneId && phoneNumber
      ? {
          id: phoneId,
          number: phoneNumber,
          is_verified: isVerified,
        }
      : null;

  return {
    id: row.id,
    name: row.name ?? "",
    type: resolveType(row.type ?? row.address_type),
    full_address: row.full_address ?? "",
    city: row.city ?? "",
    zip_code: row.zip_code ?? "",
    location_mapping_id: row.location_mapping_id ?? null,
    area_name: row.area_name ?? null,
    created_at: row.created_at ?? "",
    phone,
    is_default: asBooleanFlag(row.is_default),
  };
}

function phoneFromItem(item: AddressItem): string {
  const number = item.phone?.number?.trim() ?? "";
  if (!number) return "";
  return parsePhoneValue(number, "BD").e164 || number;
}

/** Guard mutation phone ids from tampered client input. */
export function assertValidPhoneId(id: unknown): number {
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new Error("Invalid phone id.");
  }
  return n;
}

/**
 * Split API full_address into form street / district / division when possible.
 * Falls back safely without inventing data.
 */
export function splitFullAddress(full: string): {
  address: string;
  district: string;
  division: string;
} {
  const parts = full
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const division = parts[parts.length - 1] ?? "";
    const district = parts[parts.length - 2] ?? "";
    const address = parts.slice(0, -2).join(", ");
    return { address, district, division };
  }

  if (parts.length === 2) {
    return {
      address: parts[0] ?? "",
      district: parts[1] ?? "",
      division: "",
    };
  }

  return { address: full.trim(), district: "", division: "" };
}

/**
 * Resolve street / district / division from a saved address for form selects.
 * Prefer trailing parts of `full_address` (street, district, division).
 */
export function resolveAddressLocationFields(item: AddressItem): {
  address: string;
  district: string;
  division: string;
} {
  const split = splitFullAddress(item.full_address || "");
  let division = sanitizeAuthText(split.division || "", 100);
  let district = sanitizeAuthText(
    split.district || item.city || item.area_name || "",
    100,
  );
  const address = sanitizeAuthText(
    split.address || item.full_address || "",
    300,
  );

  // Match division to canonical BD_DIVISIONS label
  const matchedDivision = BD_DIVISIONS.find(
    (d) => d.toLowerCase() === division.toLowerCase(),
  );
  if (matchedDivision) {
    division = matchedDivision;
  } else if (!matchedDivision && district) {
    // Infer division when only district/city is known
    for (const div of BD_DIVISIONS) {
      const hit = getDistrictsForDivision(div).find(
        (d) => d.toLowerCase() === district.toLowerCase(),
      );
      if (hit) {
        division = div;
        district = hit;
        break;
      }
    }
  }

  if (isBdDivision(division)) {
    const hit = getDistrictsForDivision(division).find(
      (d) => d.toLowerCase() === district.toLowerCase(),
    );
    if (hit) district = hit;
  } else {
    division = "";
  }

  return { address, district, division };
}

export function toAddressFormValues(
  item: AddressItem,
): AccountAddressFormValues {
  const location = resolveAddressLocationFields(item);
  return {
    name: sanitizeAuthText(item.name ?? "", 80),
    phone: phoneFromItem(item),
    type: resolveType(item.type),
    address: location.address,
    district: location.district,
    division: location.division,
    zipCode: sanitizeAuthText(item.zip_code ?? "", 20),
  };
}

export function toAddressViewModel(item: AddressItem): AccountAddressViewModel {
  const type = resolveType(item.type);
  const phone = item.phone?.number?.trim() ?? "";
  return {
    id: item.id,
    name: sanitizeAuthText(item.name ?? "Address", 80) || "Address",
    type,
    typeLabel: typeLabel(type),
    line: sanitizeAuthText(item.full_address ?? "", 500),
    phoneLabel: phone ? sanitizeAuthText(phone, 20) : "",
    phoneId: item.phone?.id ?? null,
    hasPhone: Boolean(item.phone?.id && phone),
    isPhoneVerified: Boolean(item.phone?.is_verified),
    isDefault: Boolean(item.is_default),
    cityLabel: sanitizeAuthText(item.city ?? "", 100),
  };
}

function buildFullAddress(values: AccountAddressFormValues): string {
  const street = sanitizeAuthText(values.address, 300);
  const district = sanitizeAuthText(values.district, 100);
  const division = sanitizeAuthText(values.division, 100);
  return [street, district, division].filter(Boolean).join(", ");
}

/**
 * Form → create/update API payload (sanitized).
 */
export function toAddressMutationPayload(
  values: AccountAddressFormValues,
): CreateAddressPayload {
  const phone = values.phone.trim();
  return {
    name: sanitizeAuthText(values.name, 80),
    phone: phone ? toApiPhoneNumber(phone) : undefined,
    type: values.type,
    full_address: buildFullAddress(values),
    city: sanitizeAuthText(values.district || values.division, 100),
    zip_code: values.zipCode.trim()
      ? sanitizeAuthText(values.zipCode, 20)
      : undefined,
  };
}

export function toUpdateAddressPayload(
  values: AccountAddressFormValues,
): UpdateAddressPayload {
  return toAddressMutationPayload(values);
}

/** Guard mutation ids from tampered client input. */
export function assertValidAddressId(id: unknown): number {
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new Error("Invalid address id.");
  }
  return n;
}
