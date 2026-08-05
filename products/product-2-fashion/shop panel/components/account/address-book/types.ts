export type AddressTag = "Home" | "Office" | "N/A";

export type AddressItem = {
  id: number;
  name: string;
  address_type: "home" | "office" | "n/a";
  full_address: string;
  city: string;
  zip_code: string;

  created_at: string;  
  phone_id: number;
  phone_number: string;

  is_verified: 0 | 1;
  is_default: 0 | 1;
};


export type AddressBookData = {
  delivery: AddressItem[];
  billing: AddressItem[];
};
