// src/components/customers/customers-list/types.ts

export type UserStatusTab = "ALL" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export type AdminStatus = "active" | "inactive" | "suspended" | string;

export type Gender = "unspecified" | "male" | "female" | "other" | string;

export interface CustomerRow {
  id: number;

  email: string;
  first_name: string;
  last_name: string;
  name: string;

  img_path: string | null;

  status: AdminStatus;
  gender: Gender;
  dob: string | null;

  is_email_verified: boolean;
  is_fully_verified: boolean;
  has_password: boolean;

  total_spent: number;

  phone: string | null;
  phone_verified: boolean;

  created_at: string;
  deleted_at: string | null;

  isDeleted: boolean;
}

export type TabConfig = {
  key: UserStatusTab;
  label: string;
};
