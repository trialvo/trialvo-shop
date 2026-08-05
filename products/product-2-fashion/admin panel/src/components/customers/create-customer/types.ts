// src/components/customers/create-customer/types.ts

export type Gender = "unspecified" | "male" | "female" | "other";
export type UserStatus = "active" | "inactive";

export interface CreateCustomerForm {
  user_profile: File | null;

  email: string;
  password: string;

  first_name: string;
  last_name: string;

  gender: Gender;
  phone: string;

  dob: string; // YYYY-MM-DD
  is_active: UserStatus; // "active" | "inactive"
}
