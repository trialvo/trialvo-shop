import { FiHome } from "react-icons/fi";

export type PaymentMethod = {
  id: string;
  label: string;
  icon: React.ElementType;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "bkash",
    label: "bKash",
    icon: FiHome,
  },
  {
    id: "nagad",
    label: "Nagad",
    icon: FiHome,
  },
  {
    id: "rocket",
    label: "Rocket",
    icon: FiHome,
  },
  {
    id: "sslcommerz",
    label: "Sslcommerz",
    icon: FiHome,
  },
  {
    id: "cod",
    label: "Cash On Delivery",
    icon: FiHome,
  },
];
