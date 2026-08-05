export type PolicyType =
  | "privacy"
  | "terms"
  | "return"
  | "refund"
  | "delivery"
  | "warranty";

export type PolicyStep = Readonly<{
  title: string;
  detail: string;
}>;

export type PolicyFaq = Readonly<{
  question: string;
  answer: string;
}>;

export type PolicyDocument = Readonly<{
  type: PolicyType;
  title: string;
  description: string;
  /** Short friendly summary under the title */
  summary: string;
  highlights: readonly string[];
  /** Actionable how-to steps */
  steps: readonly PolicyStep[];
  allowed: readonly string[];
  notAllowed: readonly string[];
  faqs: readonly PolicyFaq[];
  sections: readonly string[];
  updatedAt: string;
  primaryCta: Readonly<{ label: string; href: string }>;
  secondaryCta?: Readonly<{ label: string; href: string }>;
}>;

/**
 * Storefront legal / help policies — shared by /policies/[type].
 */
export const POLICY_DOCUMENTS: Record<PolicyType, PolicyDocument> = {
  privacy: {
    type: "privacy",
    title: "Privacy Policy",
    description:
      "Learn how ShopLinkBD collects, uses, and protects your personal information.",
    summary:
      "We collect only what we need to deliver your order — and we never sell your data.",
    highlights: [
      "Order data only",
      "No card storage",
      "Delete anytime",
    ],
    steps: [
      {
        title: "You shop with us",
        detail: "We collect name, phone, email, and address to process the order.",
      },
      {
        title: "We fulfill securely",
        detail: "Payment runs through secure gateways; card details are not stored here.",
      },
      {
        title: "You stay in control",
        detail: "Contact support anytime to update or delete your personal data.",
      },
    ],
    allowed: [
      "Using your details for delivery and order updates",
      "Sharing address with courier partners only",
      "Cookies for a better browsing experience",
    ],
    notAllowed: [
      "Selling your personal data to third parties",
      "Storing full card numbers on our servers",
      "Using your data for unrelated marketing without consent",
    ],
    faqs: [
      {
        question: "Can I delete my account data?",
        answer:
          "Yes. Contact support and we will help remove your account and personal data.",
      },
      {
        question: "Who sees my address?",
        answer:
          "Only ShopLinkBD and the courier partner needed to deliver your order.",
      },
    ],
    sections: [
      "At ShopLinkBD, we respect your privacy and are committed to protecting your personal information.",
      "We collect your name, phone number, email, and address only to process and deliver your orders.",
      "We do not share your personal data with third parties except for delivery partners required to fulfill your order.",
      "Your payment information is processed securely and we do not store card details on our servers.",
      "We use cookies to improve your browsing experience and provide personalized product recommendations.",
      "You can request deletion of your account and personal data at any time by contacting our support team.",
    ],
    updatedAt: "March 2026",
    primaryCta: { label: "Contact support", href: "/contact" },
  },
  terms: {
    type: "terms",
    title: "Terms & Conditions",
    description: "Read the terms and conditions for using ShopLinkBD online store.",
    summary:
      "Simple rules for shopping with us — accurate details, fair pricing, and clear responsibilities.",
    highlights: [
      "Stock can vary",
      "Accurate address needed",
      "BD law applies",
    ],
    steps: [
      {
        title: "Browse & order",
        detail: "Prices and availability may update; checkout confirms your final total.",
      },
      {
        title: "Provide correct info",
        detail: "Delivery depends on a reachable phone number and accurate address.",
      },
      {
        title: "Receive & review",
        detail: "Check your parcel on delivery and contact us quickly if something is wrong.",
      },
    ],
    allowed: [
      "Placing orders for personal use with correct details",
      "Requesting cancellation when stock or pricing issues occur",
      "Contacting support for order help",
    ],
    notAllowed: [
      "Providing false delivery information",
      "Misusing promotions or payment methods",
      "Reselling in ways that violate brand or local law",
    ],
    faqs: [
      {
        question: "Can an order be cancelled?",
        answer:
          "Yes, if stock is unavailable or a pricing error is found. We will notify you promptly.",
      },
      {
        question: "Why might product color look different?",
        answer:
          "Photos are for reference. Screen settings and lighting can slightly change how colors appear.",
      },
    ],
    sections: [
      "By using ShopLinkBD, you agree to these terms and conditions.",
      "All products are subject to availability. Prices may change without prior notice.",
      "We reserve the right to cancel orders if products are out of stock or pricing errors occur.",
      "Users must provide accurate delivery information. We are not responsible for failed deliveries due to incorrect addresses.",
      "Product images are for reference only. Actual products may vary slightly in color due to photography and screen settings.",
      "All disputes shall be governed by the laws of Bangladesh.",
    ],
    updatedAt: "March 2026",
    primaryCta: { label: "Contact support", href: "/contact" },
    secondaryCta: { label: "Browse shop", href: "/shop" },
  },
  return: {
    type: "return",
    title: "Return Policy",
    description:
      "ShopLinkBD offers a 7-day return policy. Learn about our return process and conditions.",
    summary:
      "Changed your mind about a defective or wrong item? You have 7 days from delivery to start a return.",
    highlights: [
      "7-day window",
      "Original box required",
      "Free return shipping*",
    ],
    steps: [
      {
        title: "Contact us within 7 days",
        detail: "Message support with your Order ID and clear product photos.",
      },
      {
        title: "Get return approval",
        detail: "We confirm eligibility and share pickup or drop-off instructions.",
      },
      {
        title: "Send the product back",
        detail: "Keep original packaging, accessories, and tags intact.",
      },
      {
        title: "Refund or exchange",
        detail: "After inspection, we process refund/exchange within 5–7 business days.",
      },
    ],
    allowed: [
      "Manufacturing defects",
      "Wrong item delivered",
      "Damaged product on arrival",
    ],
    notAllowed: [
      "Opened / used products without defect",
      "Missing accessories, tags, or box",
      "Requests after 7 days from delivery",
    ],
    faqs: [
      {
        question: "Who pays return shipping?",
        answer:
          "ShopLinkBD covers return shipping for defective or wrong items. Other cases may differ — we will confirm when you contact us.",
      },
      {
        question: "How fast is the refund?",
        answer:
          "Typically 5–7 business days after we receive and approve the returned product.",
      },
      {
        question: "What should I send when contacting support?",
        answer:
          "Your Order ID, a short description of the issue, and clear photos of the product and packaging.",
      },
    ],
    sections: [
      "We offer a 7-day return policy from the date of delivery.",
      "Products must be returned in original, unopened packaging with all accessories and tags.",
      "Returns are accepted only for manufacturing defects, wrong items, or damaged products.",
      "To initiate a return, contact our support team with your Order ID and product photos.",
      "Refunds will be processed within 5-7 business days after receiving the returned product.",
      "Shipping costs for returns are covered by ShopLinkBD for defective/wrong items.",
    ],
    updatedAt: "March 2026",
    primaryCta: { label: "Start a return", href: "/contact" },
    secondaryCta: { label: "Track order", href: "/order-tracking" },
  },
  refund: {
    type: "refund",
    title: "Refund Policy",
    description:
      "Understand how refunds work at ShopLinkBD — processing times, methods, and conditions.",
    summary:
      "Once your return is approved, we refund the same way you paid — usually within 5–7 business days.",
    highlights: [
      "After inspection",
      "bKash / Nagad for COD",
      "5–7 business days",
    ],
    steps: [
      {
        title: "Return is received",
        detail: "We inspect the product and packaging against the return rules.",
      },
      {
        title: "Refund is approved",
        detail: "You get a confirmation once the return passes inspection.",
      },
      {
        title: "Money is sent",
        detail: "COD → bKash/Nagad; online pay → original payment method.",
      },
    ],
    allowed: [
      "Full refund for approved returns",
      "Refund to original online payment method",
      "Mobile-wallet refund for COD orders",
    ],
    notAllowed: [
      "Refund before product inspection",
      "Refund for ineligible / incomplete returns",
      "Instant cash refunds at the door",
    ],
    faqs: [
      {
        question: "Where does a COD refund go?",
        answer:
          "To your registered bKash or Nagad number after approval.",
      },
      {
        question: "Can I get a partial refund?",
        answer:
          "Yes, if the product is returned with minor damage or missing accessories.",
      },
    ],
    sections: [
      "Refunds are processed after the returned product is received and inspected.",
      "For COD orders, refunds will be sent via bKash or Nagad to your registered number.",
      "For online payments, refunds will be credited to the original payment method.",
      "Refund processing takes 5-7 business days from the date of return approval.",
      "Partial refunds may be issued for products returned with minor damage or missing accessories.",
    ],
    updatedAt: "March 2026",
    primaryCta: { label: "Ask about a refund", href: "/contact" },
    secondaryCta: { label: "Read return policy", href: "/policies/return" },
  },
  delivery: {
    type: "delivery",
    title: "Delivery Policy",
    description:
      "ShopLinkBD delivery information — shipping times, fees, and coverage across Bangladesh.",
    summary:
      "Fast delivery across Bangladesh — usually 1–2 days inside Dhaka, with SMS before arrival.",
    highlights: [
      "1–2 days in Dhaka",
      "Free over ৳5,000",
      "Pre-delivery SMS",
    ],
    steps: [
      {
        title: "Order confirmed",
        detail: "We pack authentic products and hand them to a trusted courier.",
      },
      {
        title: "On the way",
        detail: "Inside Dhaka 1–2 days; outside Dhaka usually 3–5 business days.",
      },
      {
        title: "Delivered to you",
        detail: "You get an SMS/call before delivery so you can receive the parcel.",
      },
    ],
    allowed: [
      "Delivery to all 64 districts (timing may vary)",
      "Free shipping on eligible orders above ৳5,000",
      "COD where available",
    ],
    notAllowed: [
      "Guaranteed same-day delivery everywhere",
      "Delivery without a reachable phone number",
      "Holding parcels indefinitely at the courier hub",
    ],
    faqs: [
      {
        question: "What are delivery charges?",
        answer: "৳60 inside Dhaka and ৳120 outside Dhaka, unless free-shipping rules apply.",
      },
      {
        question: "Which couriers do you use?",
        answer: "Trusted partners such as Pathao, RedX, and Steadfast.",
      },
    ],
    sections: [
      "Inside Dhaka: Standard delivery within 1-2 business days.",
      "Outside Dhaka: Standard delivery within 3-5 business days.",
      "Remote areas may require 5-7 business days for delivery.",
      "Delivery charges: ৳60 inside Dhaka, ৳120 outside Dhaka. Free shipping on orders above ৳5,000.",
      "We partner with trusted courier services including Pathao, RedX, and Steadfast for reliable delivery.",
      "You will receive SMS/phone confirmation before delivery.",
    ],
    updatedAt: "March 2026",
    primaryCta: { label: "Track an order", href: "/order-tracking" },
    secondaryCta: { label: "Contact support", href: "/contact" },
  },
  warranty: {
    type: "warranty",
    title: "Warranty Policy",
    description:
      "All ShopLinkBD products come with manufacturer warranty. Learn about warranty coverage and claims.",
    summary:
      "Every product includes official manufacturer warranty — we help you claim it when something goes wrong.",
    highlights: [
      "Official brand warranty",
      "Defects covered",
      "Claim with Order ID",
    ],
    steps: [
      {
        title: "Contact us",
        detail: "Send Order ID, photos, and a short description of the issue.",
      },
      {
        title: "We verify warranty",
        detail: "Coverage depends on brand terms and the type of defect.",
      },
      {
        title: "Repair or replace",
        detail: "Processed via brand service center or our support team.",
      },
    ],
    allowed: [
      "Manufacturing defects within the warranty period",
      "Claims with valid Order ID and proof of purchase",
      "Service through official brand channels when required",
    ],
    notAllowed: [
      "Physical damage or liquid damage",
      "Misuse or unauthorized repair",
      "Claims after the warranty period ends",
    ],
    faqs: [
      {
        question: "How long is the warranty?",
        answer:
          "Usually 6 months to 2 years depending on the brand and product.",
      },
      {
        question: "Does warranty cover drops?",
        answer:
          "No. Warranty covers manufacturing defects — not accidental or physical damage.",
      },
    ],
    sections: [
      "All products sold on ShopLinkBD come with official manufacturer warranty.",
      "Warranty periods vary by product: typically 6 months to 2 years depending on the brand.",
      "Warranty covers manufacturing defects only. Physical damage, water damage, and misuse are not covered.",
      "To claim warranty, contact us with your Order ID, product photos, and description of the issue.",
      "Warranty claims are processed through the official brand service center or our in-house support team.",
      "Replacement or repair will be provided based on the brand's warranty terms.",
    ],
    updatedAt: "March 2026",
    primaryCta: { label: "Start a warranty claim", href: "/contact" },
    secondaryCta: { label: "Track order", href: "/order-tracking" },
  },
};

export const POLICY_TYPES = Object.keys(POLICY_DOCUMENTS) as PolicyType[];

export function getPolicyDocument(type: string): PolicyDocument | null {
  if (type in POLICY_DOCUMENTS) {
    return POLICY_DOCUMENTS[type as PolicyType];
  }
  return null;
}

export function listOtherPolicies(current: PolicyType): PolicyDocument[] {
  return POLICY_TYPES.filter((t) => t !== current).map(
    (t) => POLICY_DOCUMENTS[t],
  );
}
