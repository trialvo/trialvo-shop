import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { fetchPublicPolicyByKey } from "@/lib/api/policy";

export const metadata: Metadata = {
  title: "Privacy Policy – Lifestyle",
  description: "Learn how Lifestyle collects, uses, and protects your personal information.",
};

// ── Static Fallback Sections ─────────────────────────────────────────────────

const FALLBACK_SECTIONS = [
  {
    title: "Information We Collect",
    content: [
      "When you create an account or place an order, we collect personal information such as your name, email address, shipping address, and payment information.",
      "We automatically collect certain technical data when you visit our site, including your IP address, browser type, device information, pages visited, and referring URLs.",
      "We may also collect information you voluntarily provide through contact forms, reviews, or customer surveys.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "To process and fulfil your orders, including sending order confirmations, shipping notifications, and delivery updates.",
      "To provide customer support and respond to your enquiries, complaints, or feedback.",
      "To personalise your shopping experience and show you relevant products, offers, and promotions.",
      "To improve our website, products, and services through analytics and user feedback.",
      "To send you marketing communications (only if you've opted in), which you can unsubscribe from at any time.",
      "To comply with legal obligations and prevent fraud.",
    ],
  },
  {
    title: "Sharing Your Information",
    content: [
      "We do not sell, rent, or trade your personal information to third parties for their marketing purposes.",
      "We share your information only with trusted service providers who assist us in operating our website and serving you — such as payment processors, shipping carriers, and email service providers. These partners are contractually bound to keep your information confidential.",
      "We may disclose your information if required by law, court order, or to protect the rights, property, or safety of Lifestyle or others.",
    ],
  },
  {
    title: "Cookies & Tracking",
    content: [
      "We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyse website traffic.",
      "Essential cookies are required for the website to function properly. You may reject non-essential cookies through your browser settings, though this may affect certain features.",
      "We use analytics tools such as Google Analytics to understand how visitors interact with our site. This data is aggregated and anonymised where possible.",
    ],
  },
  {
    title: "Data Security",
    content: [
      "We implement industry-standard security measures including SSL/TLS encryption, secure payment processing (PCI-DSS compliant), and access controls to protect your personal data.",
      "While we take reasonable precautions, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.",
      "In the event of a data breach that affects your rights or freedoms, we will notify you and the relevant authorities as required by law.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "Access: You have the right to request a copy of the personal data we hold about you.",
      "Rectification: You can request that we correct any inaccurate or incomplete information.",
      "Deletion: You may request that we delete your personal data, subject to certain legal obligations.",
      "Portability: You can request your data in a structured, machine-readable format.",
      "Objection / Restriction: You may object to or request restriction of certain processing activities.",
      "To exercise any of these rights, please contact us at privacy@lifestyle.com.",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy, or as required by law.",
      "Order records are retained for seven years for accounting and legal compliance purposes.",
      "Account data is retained until you request deletion. Inactive accounts may be deleted after two years of inactivity.",
    ],
  },
  {
    title: "Third-Party Links",
    content: [
      "Our website may contain links to third-party websites. This Privacy Policy does not apply to those sites, and we are not responsible for their privacy practices.",
      "We encourage you to read the privacy policies of any third-party sites you visit.",
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. When we make changes, we will update the 'Last Updated' date below and, where appropriate, notify you by email.",
      "Continued use of our website after any changes constitutes your acceptance of the updated policy.",
    ],
  },
];

export default async function PrivacyPolicyPage() {
  // Fetch dynamic content from API, fall back to static
  const policyData = await fetchPublicPolicyByKey("privacy_policy");
  const hasDynamic = policyData?.content && policyData.content.trim().length > 0;
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
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors"><Home size={12} /> Home</Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">Privacy Policy</span>
        </nav>

        {/* Prose content */}
        <div>

          {/* Header */}
          <div className="mb-10 pb-8 border-b border-border">
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-[12px] text-muted-foreground mb-4">Last updated: {lastUpdated}</p>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              At Lifestyle, we are committed to protecting your privacy. This policy explains what personal information we collect, how we use it, and your rights regarding it. By using our website, you agree to the practices described here.
            </p>
          </div>

          {/* Dynamic content from API */}
          {hasDynamic ? (
            <div
              id="cookies"
              className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_p]:text-[13px] [&_p]:leading-[1.85] [&_ul]:space-y-2.5 [&_li]:text-[13px] [&_li]:leading-[1.85]"
              dangerouslySetInnerHTML={{ __html: policyData!.content! }}
            />
          ) : (
            /* Static fallback sections */
            <div className="space-y-9" id="cookies">
              {FALLBACK_SECTIONS.map(({ title, content }, idx) => (
                <div key={title}>
                  <h2 className="font-display text-[15px] font-bold text-foreground mb-3">
                    {idx + 1}. {title}
                  </h2>
                  <ul className="space-y-2.5">
                    {content.map((para, i) => (
                      <li key={i} className="text-[13px] text-muted-foreground leading-[1.85] flex gap-2.5">
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
            <h3 className="font-semibold text-foreground text-[14px] mb-2">Contact Our Privacy Team</h3>
            <p className="text-[13px] text-muted-foreground mb-1">
              Email:{" "}
              <a href="mailto:privacy@lifestyle.com" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
                privacy@lifestyle.com
              </a>
            </p>
            <p className="text-[13px] text-muted-foreground">Lifestyle FZ-LLC, Dubai Media City, Dubai, UAE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
