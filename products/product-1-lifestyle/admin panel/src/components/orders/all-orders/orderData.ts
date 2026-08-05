// src/components/orders/all-orders/orderData.ts

import type { OrderStatus } from "./types";

export const STATUS_OPTIONS: { id: OrderStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "processing", label: "Processing" },
  { id: "packaging", label: "Packaging" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "returned", label: "Returned" },
  { id: "cancelled", label: "Cancelled" },
  { id: "on_hold", label: "On hold" },
  { id: "trash", label: "Trash" },
];

export const PAYMENT_STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "unpaid", label: "Unpaid" },
  { id: "partial_paid", label: "Partial paid" },
  { id: "paid", label: "Paid" },
] as const;

export const PAYMENT_TYPE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "gateway", label: "Gateway" },
  { id: "cod", label: "COD" },
  { id: "mixed", label: "Mixed" },
] as const;

export const PAYMENT_PROVIDER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "sslcommerz", label: "SSLCommerz" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "shurjopay", label: "ShurjoPay" },
  { id: "rocket", label: "Rocket" },
] as const;

export const FRAUD_OPTIONS = [
  { id: "all", label: "All" },
  { id: "0", label: "Not fraud" },
  { id: "1", label: "Fraud" },
] as const;

export const ORDER_TYPE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "regular", label: "Regular" },
  { id: "guest", label: "Guest" },
  { id: "admin_regular", label: "Admin (Registered)" },
  { id: "admin_stranger", label: "Admin (Stranger)" },
  { id: "single_page", label: "Single Page" },
] as const;
