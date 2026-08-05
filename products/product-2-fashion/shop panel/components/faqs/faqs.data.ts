import { Box, CreditCard, Package, RotateCcw, Truck } from "lucide-react";
import type { FAQCategory } from "./types";

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    items: [
      {
        id: "q1",
        question: "What payment methods are available?",
        answer: "We currently offer Cash on Delivery (COD) across Bangladesh. Additional payment options may be added in the future.",
      },
      {
        id: "q2",
        question: "Is COD available everywhere in Bangladesh?",
        answer: "COD is available in most locations. Some remote areas may have limited service depending on courier availability.",
      },
      {
        id: "q3",
        question: "Is my payment information secure?",
        answer: "Yes. We do not store sensitive payment information. All transactions are handled securely.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Truck,
    items: [
      {
        id: "d1",
        question: "How long does delivery take?",
        answer: "Delivery usually takes 2–5 working days inside Dhaka and 3–7 working days outside Dhaka.",
      },
      {
        id: "d2",
        question: "What are the delivery charges?",
        answer: "Delivery charges may vary based on location and order size. Exact charges will be shown during checkout.",
      },
      {
        id: "d3",
        question: "Do you deliver nationwide?",
        answer: "Yes, we deliver across Bangladesh.",
      },
    ],
  },
  {
    id: "cancel-return",
    label: "Cancellation & Return",
    icon: RotateCcw,
    items: [
      {
        id: "c1",
        question: "Can I cancel my order after placing it?",
        answer: "Yes. Orders can be canceled before shipment by contacting our customer support as soon as possible.",
      },
      {
        id: "c2",
        question: "What is your return policy?",
        answer: "You can request a return or exchange within 48 hours of receiving the product if it is defective, damaged, or incorrect.",
      },
      {
        id: "c3",
        question: "Can I exchange a product for a different size?",
        answer: "Yes, size exchanges are allowed once per order, subject to availability.",
      },
    ],
  },
  {
    id: "my-orders",
    label: "My Orders",
    icon: Package,
    items: [
      {
        id: "o1",
        question: "How can I check my order status?",
        answer: "You can check your order status by logging into your account or contacting our customer support with your order number.",
      },
      {
        id: "o2",
        question: "Will I receive an order confirmation?",
        answer: "Yes. You will receive an order confirmation via SMS or email after placing your order.",
      },
      {
        id: "o3",
        question: "What should I do if my order is delayed?",
        answer: "Please contact our support team if your order is delayed beyond the expected delivery time.",
      },
    ],
  },
  {
    id: "products-services",
    label: "Products & Services",
    icon: Box,
    items: [
      {
        id: "p1",
        question: "Are the product colors exactly the same as shown on the website?",
        answer: "Slight color variations may occur due to lighting, photography, or screen settings.",
      },
      {
        id: "p2",
        question: "How do I choose the right size?",
        answer: "Please refer to the size chart available on each product page before placing your order.",
      },
      {
        id: "p3",
        question: "Do you sell both retail and wholesale/export products?",
        answer: "Yes. Graduate Fashion serves retail customers and also provides export-oriented garment supply.",
      },
      {
        id: "p4",
        question: "How do you ensure product quality?",
        answer: "We maintain strict quality control from fabric sourcing to final delivery to ensure high standards.",
      },
    ],
  },
];