export type AccountNavKey =
  | "account-details"
  | "my-order"
  | "address-book"
  | "favorite-list"
  | "payment-method"
  | "change-password"
  | "phone-book"
  | "my-reports"
  | "my-contact";

export type Address = {
  id: number;
  phone_id: number;
  name: string;
  address_type: "home" | "office" | "n/a";
  full_address: string;
  city: string;
  zip_code: string;
};

export type RecentOrder = {
  id: string;
  placedOn: string;
  QTY: number;
  itemThumbSrc: string;
  total: number;
  paymentStatus: string;
  order_status: string;
};
