import type { Address } from "@/components/address-selector/types";
import type { OrderItem, OrderTotals } from "@/components/order-summary/order.types";

export const MOCK_ADDRESSES: Address[] = [
  {
    id: "addr_home",
    label: "Home",
    name: "Aminul Islam",
    phone: "01755304840",
    address: "House 29, Road 05, Sector 11, Uttara, Dhaka 1230",
    isDefault: true,
  },
  {
    id: "addr_office",
    label: "Office",
    name: "Aminul Islam",
    phone: "01755304840",
    address: "House 29, Road 05, Sector 11, Uttara, Dhaka 1230",
    isDefault: false,
  },
  {
    id: "addr_other",
    label: "",
    name: "Aminul Islam",
    phone: "01755304840",
    address: "House 29, Road 05, Sector 11, Uttara, Dhaka 1230",
    isDefault: false,
  },
];

export const MOCK_ITEMS: OrderItem[] = [
  {
    id: "1",
    title: "Mens Sky Blue Formal Shirt",
    image: "/pant.png",
    quantity: 1,
    price: 1890,
    oldPrice: 1890,
  },
  {
    id: "2",
    title: "Mens Sky Blue Formal Shirt",
    image: "/pant.png",
    quantity: 1,
    price: 1890,
    oldPrice: 1890,
  },
  {
    id: "3",
    title: "Mens Sky Blue Formal Shirt",
    image: "/pant.png",
    quantity: 1,
    price: 1890,
    oldPrice: 1890,
  },
];

export const MOCK_TOTALS: OrderTotals = {
  subtotal: 1000,
  delivery: 1000,
  discount: 1000,
  total: 1000,
};
