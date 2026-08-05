import type { OrderInvoice } from "./types";

export const MOCK_ORDER_INVOICE: OrderInvoice = {
  orderId: "GF211226123456",
  currency: "BDT",

  brand: {
    name: "Graduate",
    logoSrc: "/logo-default.svg",
    address: "House 25, Road 5, Sector 11, Uttara, Dhaka Bangladesh",
    email: "companyemail@gmail.com",
    phone: "+8801755304840",
  },

  meta: {
    orderId: "GF211226123456",
    placedOn: "30/10/2025",
    orderStatus: { label: "Pending", className: "text-[#FF8A00]" },
    paymentStatus: { label: "Due", className: "text-[#FF383C]" },
    estimateDeliveryDate: "30/10/2025",
  },

  invoiceTo: {
    tag: "Home",
    name: "Aminul Islam",
    phone: "01755304840",
    address: "House 29, Road 05, Sector 11, Uttara, Dhaka 1230",
  },

  items: [
    {
      id: "1",
      title: "Essential oils for humidifier...",
      imageSrc: "/pant.png",
      size: "M",
      color: "Black",
      unitPrice: 1000,
      qty: 2,
      totalPrice: 2000,
    },
    {
      id: "2",
      title: "Essential oils for humidifier...",
      imageSrc: "/pant.png",
      size: "M",
      color: "Black",
      unitPrice: 1000,
      qty: 2,
      totalPrice: 2000,
    },
    {
      id: "3",
      title: "Essential oils for humidifier...",
      imageSrc: "/pant.png",
      size: "M",
      color: "Black",
      unitPrice: 1000,
      qty: 2,
      totalPrice: 2000,
    },
  ],

  totals: {
    subtotal: 154.25,
    discount: 0,
    total: 204.25,
  },
};
