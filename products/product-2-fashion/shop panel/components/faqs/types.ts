import type { LucideIcon } from "lucide-react";

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export type FAQCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: FAQItem[];
};
