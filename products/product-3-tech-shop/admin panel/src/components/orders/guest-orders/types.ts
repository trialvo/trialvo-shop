export type GuestOrderStatus = "pending" | "complete" | "cancelled";

export type SortBy = "date_desc" | "date_asc";

export type GuestOrder = {
  id: string;
  orderId?: number | null;
  customerName: string;
  email: string;
  phone: string;
  createdAt: Date;
  timeLabel: string;
  cartTotal: string;
  status: GuestOrderStatus;
  locationLabel: string;
  paymentStatus?: string;
  paymentType?: string;
  isDeleted?: boolean;
};
