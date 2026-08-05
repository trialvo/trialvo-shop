/**
 * Invoice data model types.
 *
 * Used by the invoice HTML generator and print/download utilities.
 */

export type InvoiceItem = {
  name: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  couponDiscount: number;
  delivery: number;
  grandTotal: number;
  paid: number;
  due: number;
};

export type InvoiceCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type InvoiceAddress = {
  fullAddress: string;
  city: string;
  zip: string;
};

export type InvoiceData = {
  orderId: string;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customer: InvoiceCustomer;
  shippingAddress: InvoiceAddress;
  items: InvoiceItem[];
  totals: InvoiceTotals;
};
