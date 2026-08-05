/**
 * Auth types matching the API model from gcp_graduatefashion_api.
 * These are the shapes returned by the backend — keep in sync with
 * lib/api/auth/service.ts (which has its own copy for internal use).
 *
 * Deprecated/compat fields are kept so existing UI components
 * compile without changes (no UI modifications allowed).
 */

export interface Phone {
  id: number;
  phone_number: string;
  is_verified: boolean;
  /** @deprecated Compat alias for phone_number */
  number?: string;
}

export interface Address {
  id: number;
  full_address: string;
  city: string;
  zip_code: string;
  address_type: string;
  is_default: boolean;
  location_mapping_id?: number | null;
  area_name?: string | null;
  name?: string;
  type?: "home" | "office" | "n/a";
  phone?: string | { id: number; number: string; is_verified: boolean } | null;
  created_at?: string;

  /* ── Compat aliases for old UI components ── */
  /** @deprecated Use full_address */
  street?: string;
  /** @deprecated Use city */
  state?: string;
  /** @deprecated Use zip_code */
  zip?: string;
  /** @deprecated */
  country?: string;
  /** @deprecated Use name */
  label?: string;
  /** @deprecated Use name */
  fullName?: string;
  /** @deprecated Use is_default */
  isDefault?: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  img_path: string | null;
  status: "active" | "inactive" | "suspended" | "pending";
  has_password: boolean;
  gender: "male" | "female" | "unspecified" | "other";
  dob: string | null;
  is_email_verified: boolean;
  is_fully_verified: boolean;
  total_spent: number;
  default_phone: Phone | null | string;
  phones: Phone[];
  default_address: Address | null;
  addresses: Address[];

  /* ── Compat aliases for old UI components ── */
  /** @deprecated Use first_name + last_name */
  name?: string;
  /** @deprecated Use img_path */
  avatar?: string;
  /** @deprecated Use phones[0]?.phone_number */
  phone?: string;
  /** @deprecated Use default_address?.full_address */
  address?: string;
}
