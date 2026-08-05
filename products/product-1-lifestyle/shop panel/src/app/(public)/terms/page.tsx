import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { fetchPublicPolicyByKey } from "@/lib/api/policy";

export const metadata: Metadata = {
  title: "Terms & Conditions – Lifestyle",
  description:
    "Read the terms and conditions governing your use of the Lifestyle website and services.",
};

// ── Static Fallback ──────────────────────────────────────────────────────────

const FALLBACK_SECTIONS = [
  {
    title: "Acceptance of Terms",
    content: [
      "By accessing or using our website, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.",
      "We reserve the right to modify these terms at any time. Your continued use of the site after changes constitutes acceptance of the updated terms.",
    ],
  },
  {
    title: "Account Registration",
    content: [
      "To place orders, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to provide accurate and current information and to update your account details as needed.",
      "You must be at least 18 years old to create an account and make purchases.",
    ],
  },
  {
    title: "Products & Pricing",
    content: [
      "All product descriptions and images are provided for informational purposes. While we strive for accuracy, we do not warrant that descriptions or images are error-free.",
      "Prices are displayed in the local currency and are subject to change without notice. Prices exclude delivery charges unless otherwise stated.",
      "We reserve the right to refuse or cancel any order at our discretion, including orders identified as potentially fraudulent.",
    ],
  },
  {
    title: "Orders & Payment",
    content: [
      "An order is confirmed once you receive a confirmation email or SMS from us. We reserve the right to cancel orders due to stock unavailability or pricing errors.",
      "We accept various payment methods including Cash on Delivery (COD), bKash, Nagad, and card payments through our secure payment gateway.",
      "All payments are processed through secure, encrypted channels. We do not store your full payment details.",
    ],
  },
  {
    title: "Shipping & Delivery",
    content: [
      "Delivery times are estimates and may vary depending on your location and order volume.",
      "Free delivery is available on eligible orders as indicated on the product page. Standard delivery charges apply to all other orders.",
      "Risk of loss transfers to you upon delivery. Please inspect your package upon receipt.",
    ],
  },
  {
    title: "Returns & Refunds",
    content: [
      "Returns are accepted within 7 days of delivery, subject to our Returns Policy.",
      "Items must be unused, in their original packaging, and accompanied by the receipt or proof of purchase.",
      "Refunds will be processed within 7-14 business days after we receive the returned item.",
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "All content on this website — including logos, images, text, and design — is the property of Lifestyle and is protected by intellectual property laws.",
      "You may not reproduce, distribute, or create derivative works from any content without our express written consent.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "Lifestyle shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or services.",
      "Our total liability for any claim shall not exceed the amount paid by you for the specific product or service in question.",
    ],
  },
  {
    title: "Governing Law",
    content: [
      "These Terms and Conditions are governed by the laws of Bangladesh.",
      "Any disputes shall be resolved in the courts of Dhaka, Bangladesh.",
    ],
  },
];

export default async function TermsPage() {
  // Fetch dynamic content from API, fall back to static
  const policyData = await fetchPublicPolicyByKey("terms_and_conditions");
  const hasDynamic =
    policyData?.content && policyData.content.trim().length > 0;
  const lastUpdated = policyData?.updated_at
    ? new Date(policyData.updated_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "June 2026";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-10">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">
            Terms & Conditions
          </span>
        </nav>

        {/* Prose content */}
        <div>
          {/* Header */}
          <div className="mb-10 pb-8 border-b border-border">
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-2">
              Terms & Conditions
            </h1>
            <p className="text-[12px] text-muted-foreground mb-4">
              Last updated: {lastUpdated}
            </p>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Please read these terms carefully before using our website. By
              accessing or using our services, you agree to be bound by these
              terms.
            </p>
          </div>

          {/* Dynamic content from API */}
          {hasDynamic ? (
            <div
              className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_p]:text-[13px] [&_p]:leading-[1.85] [&_ul]:space-y-2.5 [&_li]:text-[13px] [&_li]:leading-[1.85]"
              dangerouslySetInnerHTML={{ __html: policyData!.content! }}
            />
          ) : (
            /* Static fallback sections */
            <div className="space-y-9">
              {FALLBACK_SECTIONS.map(({ title, content }, idx) => (
                <div key={title}>
                  <h2 className="font-display text-[15px] font-bold text-foreground mb-3">
                    {idx + 1}. {title}
                  </h2>
                  <ul className="space-y-2.5">
                    {content.map((para, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-muted-foreground leading-[1.85] flex gap-2.5"
                      >
                        <span className="text-border mt-2 shrink-0">—</span>
                        <span>{para}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Contact block */}
          <div className="mt-14 border border-border p-7">
            <h3 className="font-semibold text-foreground text-[14px] mb-2">
              Questions?
            </h3>
            <p className="text-[13px] text-muted-foreground mb-1">
              If you have questions about these terms, please{" "}
              <Link
                href="/contact"
                className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
              >
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
