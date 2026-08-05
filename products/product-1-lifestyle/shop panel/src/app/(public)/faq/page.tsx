import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ – Lifestyle",
  description: "Frequently asked questions about orders, shipping, returns, and more.",
};

const FAQS = [
  {
    category: "Orders",
    items: [
      { q: "How do I place an order?", a: "Browse our catalogue, select your size and colour, then click 'Add To Cart'. Once you're ready, proceed to checkout and fill in your shipping and payment details." },
      { q: "Can I modify or cancel my order?", a: "Orders can be modified or cancelled within 1 hour of placement. Please contact our support team immediately at hello@lifestyle.com with your order number." },
      { q: "How do I track my order?", a: "Once your order is shipped you'll receive a confirmation email with a tracking link. You can also visit the 'My Orders' page in your account dashboard." },
    ],
  },
  {
    category: "Shipping",
    items: [
      { q: "Do you offer free shipping?", a: "Yes! We offer free standard shipping on all orders over $150. Orders below this threshold have a flat shipping fee of $8." },
      { q: "How long does delivery take?", a: "Standard shipping takes 3–5 business days. Express shipping (available at checkout) typically arrives within 1–2 business days." },
      { q: "Do you ship internationally?", a: "Currently we ship to the UAE, Saudi Arabia, Kuwait, Bahrain, Oman, and Qatar. We're actively expanding — check back soon for more countries." },
    ],
  },
  {
    category: "Returns & Exchanges",
    items: [
      { q: "What is your return policy?", a: "We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags still attached." },
      { q: "How do I start a return?", a: "Go to 'My Orders', select the item you wish to return, and click 'Request Return'. You'll receive a prepaid return label within 24 hours." },
      { q: "How long do refunds take?", a: "Once we receive and inspect the returned item, refunds are processed within 5–7 business days to your original payment method." },
    ],
  },
  {
    category: "Products",
    items: [
      { q: "How do I find the right size?", a: "Each product page includes a size chart with measurements. If you're between sizes, we recommend sizing up for a more comfortable fit." },
      { q: "Are your products authentic?", a: "Absolutely. Every item sold on Lifestyle is 100% authentic and sourced directly from verified brand partners and manufacturers." },
      { q: "Do you restock sold-out items?", a: "We regularly restock popular items. You can sign up for restock notifications on any product page by clicking 'Notify Me'." },
    ],
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and PayPal. All transactions are secured with SSL encryption." },
      { q: "Is it safe to save my card details?", a: "Yes. We never store your full card details on our servers. All payment data is handled by our PCI-DSS certified payment partners." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-10">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">FAQ</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Can't find your answer?{" "}
            <Link href="/contact" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
              Contact our support team
            </Link>
            {" "}— we're happy to help.
          </p>
        </div>

        {/* FAQ groups */}
        <div className="space-y-10">
          {FAQS.map(({ category, items }) => (
            <div key={category}>
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-1 pb-2 border-b border-border">
                {category}
              </h2>
              <Accordion items={items} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 border border-border p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground text-[14px] mb-1">Still have questions?</p>
            <p className="text-[13px] text-muted-foreground">Our team responds within 24 hours.</p>
          </div>
          <Link href="/contact"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-[12px] font-semibold tracking-wide px-5 py-2.5 hover:bg-accent/85 transition-colors whitespace-nowrap">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
