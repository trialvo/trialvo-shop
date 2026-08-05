import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Returns & Exchanges – Lifestyle",
  description: "Learn about our 30-day return policy, exchange process, and refund timeline.",
};

const STEPS = [
  { step: "01", title: "Initiate Your Return", desc: "Log in to your account, go to 'My Orders', and click 'Request Return' next to the item. You can also email us at returns@lifestyle.com with your order number." },
  { step: "02", title: "Get Your Return Label", desc: "Within 24 hours we'll email you a prepaid return shipping label. Print it and attach it securely to your parcel." },
  { step: "03", title: "Pack & Drop Off", desc: "Pack the item in its original packaging with all tags attached. Drop the parcel off at any authorised carrier location." },
  { step: "04", title: "Inspection & Refund", desc: "Once we receive your return, we'll inspect it within 2 business days. Approved refunds are processed to your original payment method within 5–7 business days." },
];

const ELIGIBLE = [
  "Unworn and unwashed items",
  "Items in original packaging with all tags attached",
  "Items returned within 30 days of delivery",
  "Non-sale, non-final-sale items",
];

const INELIGIBLE = [
  "Items marked 'Final Sale' at the time of purchase",
  "Underwear, swimwear, and personalised/monogrammed items",
  "Items showing signs of wear, washing, or damage not caused by us",
  "Items returned after 30 days from delivery",
];

const FAQS = [
  { q: "Can I exchange for a different size or colour?", a: "Yes. During the return request, select 'Exchange' and choose your preferred size or colour. If the item is available, we'll ship the replacement as soon as your return is received. If unavailable, you'll receive a full refund." },
  { q: "What if I received a damaged or incorrect item?", a: "We sincerely apologise. Please contact us at returns@lifestyle.com within 48 hours of delivery with photos of the issue. We'll arrange a free return and a replacement or full refund immediately." },
  { q: "Do I have to pay for return shipping?", a: "Returns within the UAE are completely free — we provide a prepaid label. For international returns, a standard return shipping fee of AED 20 will be deducted from your refund." },
  { q: "Can I return an item bought during a sale?", a: "Sale items (non-final-sale) are eligible for return. Items marked 'Final Sale' are not eligible for returns or exchanges." },
  { q: "How will I know when my refund is processed?", a: "You'll receive an email notification when your return is inspected and your refund is initiated. Please allow 5–7 business days for it to appear in your account." },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-10">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors"><Home size={12} /> Home</Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">Returns & Exchanges</span>
        </nav>

        {/* Content */}
        <div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-3">
              Returns & Exchanges
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              We want you to love your purchase. If something isn't right, we offer a simple 30-day return and exchange policy.
            </p>
          </div>

          {/* Policy banner */}
          <div className="grid grid-cols-3 border border-border divide-x divide-border mb-12">
            {[
              { label: "Return Window",   value: "30 Days" },
              { label: "Refund Timeline", value: "5–7 Days" },
              { label: "Return Shipping", value: "Free (UAE)" },
            ].map(({ label, value }) => (
              <div key={label} className="p-5 text-center">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{label}</p>
                <p className="text-lg font-bold text-foreground font-display">{value}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="mb-12">
            <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-6 pb-2 border-b border-border">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STEPS.map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 border border-border p-5">
                  <span className="text-2xl font-bold text-border font-display shrink-0 leading-none">{step}</span>
                  <div>
                    <p className="text-[13px] font-bold text-foreground mb-1.5">{title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eligible / Ineligible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div>
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-4 pb-2 border-b border-border">
                Eligible for Return
              </h2>
              <ul className="space-y-2.5">
                {ELIGIBLE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                    <span className="text-success font-bold text-[11px] mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-4 pb-2 border-b border-border">
                Not Eligible
              </h2>
              <ul className="space-y-2.5">
                {INELIGIBLE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                    <span className="text-sale font-bold text-[11px] mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-12">
            <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-1 pb-2 border-b border-border">
              Common Questions
            </h2>
            <Accordion items={FAQS} />
          </div>

          {/* CTA */}
          <div className="border border-border p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground text-[14px] mb-1">Need help with a return?</p>
              <p className="text-[13px] text-muted-foreground">
                Email us at{" "}
                <a href="mailto:returns@lifestyle.com" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
                  returns@lifestyle.com
                </a>
              </p>
            </div>
            <Link href="/contact"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-[12px] font-semibold tracking-wide px-5 py-2.5 hover:bg-accent/85 transition-colors whitespace-nowrap">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
