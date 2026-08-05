import { FiHome, FiTruck } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";

export type DeliveryOption = {
  id: string;
  title: string;
  price: string;
  icon: React.ElementType;
  note: string;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: "pickup",
    title: "Shop Pickup",
    price: "Free",
    icon: FiHome,
    note: "Same day",
  },
  {
    id: "inside-dhaka",
    title: "Inside Dhaka",
    price: "BDT 80.00",
    icon: HiOutlineLocationMarker,
    note: "1–2 days",
  },
  {
    id: "outside-dhaka",
    title: "Outside Dhaka",
    price: "BDT 130.00",
    icon: FiTruck,
    note: "2–4 days",
  },
];
