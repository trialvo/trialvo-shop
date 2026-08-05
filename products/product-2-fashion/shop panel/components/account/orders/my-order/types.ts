export type OrderInvoiceStatusPill = {
  label: string;
  className: string;
};

export type OrderInvoiceMeta = {
  orderId: string;
  placedOn: string;
  orderStatus: OrderInvoiceStatusPill;
  paymentStatus: OrderInvoiceStatusPill;
  estimateDeliveryDate: string;
};

export type OrderInvoiceItem = {
  id: string;
  title: string;
  imageSrc: string;
  size: string;
  color: string;
  unitPrice: number;
  qty: number;
  totalPrice: number;
};

export type OrderInvoiceTotals = {
  subtotal: number;
  discount: number;
  delivery?: number;
  weightKg?: number;
  weightExtraCharge?: number;
  bulkDiscount?: number;
  comboDiscount?: number;
  cartWideDiscount?: number;
  couponDiscount?: number;
  total: number;
};

export type OrderInvoice = {
  orderId: string;
  currency: string;

  brand: {
    name: string;
    logoSrc: string;
    address: string;
    email: string;
    phone: string;
  };

  meta: OrderInvoiceMeta;

  invoiceTo: {
    tag: string;
    name: string;
    phone: string;
    address: string;
  };

  items: OrderInvoiceItem[];
  totals: OrderInvoiceTotals;
};
