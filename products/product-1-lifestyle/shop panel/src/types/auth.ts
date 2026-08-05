export type AddressUsage = "shipping" | "billing" | "both";

export interface Address {
  id: string;
  label: string;
  usage: AddressUsage;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
  addresses?: Address[];
}
