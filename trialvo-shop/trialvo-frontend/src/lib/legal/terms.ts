import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const TERMS_DOC: LocalizedLegalDoc = {
  bn: {
    title: "শর্তাবলী",
    updated: LEGAL_UPDATED.bn,
    intro:
      "এই শর্তাবলী Trialvo Shop-এর ওয়েবসাইট, রেডিমেড ইকমার্স প্রোডাক্ট, লাইভ ট্রায়াল পরিবেশ এবং সাপোর্ট সেবা ব্যবহারের নিয়ম নির্ধারণ করে। ওয়েবসাইট ব্রাউজ করা, ট্রায়াল নেওয়া বা কোনো প্রোডাক্ট কেনার মাধ্যমে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন। কেনার আগে সম্পূর্ণ শর্তাবলী পড়ে নেওয়ার অনুরোধ করছি।",
    sections: [
      {
        id: "definitions",
        heading: "১. সংজ্ঞা",
        blocks: [
          {
            type: "list",
            items: [
              "“আমরা”, “আমাদের”, “Trialvo Shop” — এই মার্কেটপ্লেস ও এর পরিচালনাকারী প্রতিষ্ঠান Trialvo।",
              "“আপনি”, “ক্রেতা”, “ব্যবহারকারী” — যে ব্যক্তি বা প্রতিষ্ঠান ওয়েবসাইট ব্যবহার করছে, ট্রায়াল নিচ্ছে বা প্রোডাক্ট কিনছে।",
              "“প্রোডাক্ট” — রেডিমেড ইকমার্স সলিউশন, যেখানে শপ ফ্রন্টএন্ড, অ্যাডমিন প্যানেল, ডাটাবেস স্ট্রাকচার ও সোর্স কোড অন্তর্ভুক্ত।",
              "“ট্রায়াল” — কেনার আগে প্রোডাক্ট পরীক্ষা করার জন্য সীমিত মেয়াদের চালু ইনস্ট্যান্স।",
              "“লাইসেন্স” — প্রোডাক্ট ব্যবহারের জন্য প্রদত্ত আজীবন, অ-হস্তান্তরযোগ্য অনুমতি।",
            ],
          },
        ],
      },
      {
        id: "eligibility",
        heading: "২. যোগ্যতা ও অ্যাকাউন্ট",
        blocks: [
          {
            type: "p",
            text: "প্রোডাক্ট কেনার জন্য আপনাকে আইনগতভাবে চুক্তি করার উপযুক্ত হতে হবে। ট্রায়াল অনুরোধ বা অর্ডারের সময় দেওয়া নাম, ইমেইল ও ফোন নম্বর সঠিক ও সক্রিয় হতে হবে, কারণ ডেলিভারি, লাইসেন্স ও সাপোর্ট যোগাযোগ এই তথ্যের ভিত্তিতেই হয়।",
          },
          {
            type: "p",
            text: "ভুল বা অন্যের তথ্য দিয়ে অর্ডার বা ট্রায়াল নিলে আমরা তা বাতিল করার অধিকার রাখি। একই ইমেইল দিয়ে একই প্রোডাক্টের একাধিক ট্রায়াল অনুরোধ করা হলে সেগুলো একত্র করা হতে পারে।",
          },
        ],
      },
      {
        id: "products",
        heading: "৩. প্রোডাক্ট ও ডেলিভারি",
        blocks: [
          {
            type: "p",
            text: "প্রতিটি প্রোডাক্ট একটি সম্পূর্ণ ইকমার্স সলিউশন — এতে গ্রাহকমুখী শপ, ব্যবস্থাপনার জন্য অ্যাডমিন প্যানেল এবং সংশ্লিষ্ট সোর্স কোড থাকে। প্রোডাক্ট পেজে উল্লেখিত ফিচার তালিকা ও সুবিধাসমূহই ডেলিভারির ভিত্তি।",
          },
          {
            type: "list",
            items: [
              "পেমেন্ট নিশ্চিত হওয়ার পর ডিজিটাল ডেলিভারি শুরু হয় — কোনো ফিজিক্যাল শিপমেন্ট নেই।",
              "ডেলিভারিতে সোর্স কোড, ডাটাবেস স্ট্রাকচার ও প্রয়োজনীয় সেটআপ ডকুমেন্টেশন অন্তর্ভুক্ত।",
              "ডেলিভারির লিংক ও নির্দেশনা অর্ডারে দেওয়া ইমেইলে পাঠানো হয়।",
              "থার্ড-পার্টি সেবা (ডোমেইন, হোস্টিং, পেমেন্ট গেটওয়ে, SMS বা ইমেইল প্রোভাইডার) প্রোডাক্ট মূল্যের অন্তর্ভুক্ত নয়, যদি প্রোডাক্ট পেজে আলাদাভাবে উল্লেখ না থাকে।",
            ],
          },
        ],
      },
      {
        id: "trials",
        heading: "৪. লাইভ ট্রায়ালের শর্ত",
        blocks: [
          {
            type: "p",
            text: "কেনার আগে ঝুঁকি কমানোর জন্য আমরা নির্দিষ্ট প্রোডাক্টে লাইভ ট্রায়াল দিই। ট্রায়াল একটি সীমিত মেয়াদের চালু পরিবেশ — এর উদ্দেশ্য প্রোডাক্ট মূল্যায়ন করা, বাণিজ্যিকভাবে ব্যবসা পরিচালনা করা নয়।",
          },
          {
            type: "list",
            items: [
              "ট্রায়ালের মেয়াদ ও ধরন প্রোডাক্ট ও সেটিংস অনুযায়ী নির্ধারিত হয় এবং অনুমোদনের সময় জানানো হয়।",
              "ট্রায়াল অনুরোধ অনুমোদন বা প্রত্যাখ্যান করার অধিকার আমাদের সংরক্ষিত।",
              "ট্রায়ালে তৈরি ডেমো ডেটা মেয়াদ শেষে মুছে ফেলা হতে পারে — গুরুত্বপূর্ণ তথ্য ট্রায়াল পরিবেশে রাখবেন না।",
              "ট্রায়াল মেয়াদ বাড়াতে আলাদা এক্সটেন্ড প্যাক প্রযোজ্য, যা পূর্ণ প্রোডাক্ট কেনার সমতুল্য নয়।",
              "ট্রায়াল পরিবেশ থেকে সোর্স কোড নিষ্কাশন, রিভার্স ইঞ্জিনিয়ারিং বা অনুলিপি করা নিষিদ্ধ।",
            ],
          },
        ],
      },
      {
        id: "pricing",
        heading: "৫. মূল্য ও পেমেন্ট",
        blocks: [
          {
            type: "p",
            text: "প্রতিটি প্রোডাক্ট এককালীন কেনাকাটা — কোনো মাসিক বা বার্ষিক ফি নেই। মূল বিলিং মুদ্রা বাংলাদেশি টাকা (BDT)। কিছু প্রোডাক্টে সুবিধার জন্য একটি ঘোষিত USD মূল্যও দেখানো হতে পারে; সেটি রূপান্তরিত হার নয়, আলাদাভাবে নির্ধারিত মূল্য।",
          },
          {
            type: "list",
            items: [
              "চেকআউটে দেখানো মোট মূল্যই চূড়ান্ত — এর বাইরে গোপন চার্জ নেই।",
              "ডিসকাউন্ট প্রযোজ্য থাকলে তা তালিকামূল্যের উপর শতকরা হারে বসে এবং চেকআউটে স্পষ্টভাবে দেখানো হয়।",
              "পেমেন্ট নিরাপদ পেমেন্ট গেটওয়ের মাধ্যমে প্রক্রিয়া হয়; আমরা আপনার সম্পূর্ণ কার্ড তথ্য সংরক্ষণ করি না।",
              "পেমেন্ট ব্যর্থ বা অসম্পূর্ণ হলে অর্ডার নিশ্চিত হয় না এবং ডেলিভারি শুরু হয় না।",
              "মূল্য পরিবর্তনের অধিকার আমাদের আছে, তবে ইতিমধ্যে সম্পন্ন অর্ডারের উপর তা প্রযোজ্য হবে না।",
            ],
          },
        ],
      },
      {
        id: "license-summary",
        heading: "৬. লাইসেন্স (সারসংক্ষেপ)",
        blocks: [
          {
            type: "p",
            text: "কেনার পর আপনি প্রোডাক্ট ব্যবহারের আজীবন লাইসেন্স পান — লাইসেন্সের মেয়াদ শেষ হয় না এবং নবায়ন ফি নেই। লাইসেন্স আপনাকে ব্যবহারের অধিকার দেয়, প্রোডাক্টের মালিকানা বা পুনঃবিক্রয়ের অধিকার দেয় না।",
          },
          {
            type: "note",
            text: "অনুমোদিত ও নিষিদ্ধ ব্যবহারের সম্পূর্ণ তালিকা লাইসেন্স চুক্তি পেজে দেওয়া আছে। কোনো অসামঞ্জস্য থাকলে লাইসেন্স চুক্তিই প্রাধান্য পাবে।",
          },
        ],
      },
      {
        id: "support-summary",
        heading: "৭. সাপোর্ট ও আপডেট",
        blocks: [
          {
            type: "p",
            text: "প্রতিটি প্রোডাক্টে আজীবন সাপোর্ট ও আজীবন আপডেট অন্তর্ভুক্ত। সাপোর্টের আওতায় প্রোডাক্টের নিজস্ব বাগ ফিক্স, সেটআপ গাইডেন্স এবং প্রকাশিত আপডেট গ্রহণ করা পড়ে।",
          },
          {
            type: "p",
            text: "নতুন ফিচার তৈরি, ডিজাইন পরিবর্তন, থার্ড-পার্টি ইন্টিগ্রেশন বা সার্ভার ব্যবস্থাপনা কাস্টম কাজ হিসেবে গণ্য এবং আলাদা চুক্তির বিষয়। বিস্তারিত সাপোর্ট নীতি পেজে দেওয়া আছে।",
          },
        ],
      },
      {
        id: "customer-duties",
        heading: "৮. ক্রেতার দায়িত্ব",
        blocks: [
          {
            type: "list",
            items: [
              "নিজের ডোমেইন, হোস্টিং ও SSL ব্যবস্থা করা এবং সেগুলোর নিরাপত্তা নিশ্চিত করা।",
              "অ্যাডমিন লগইন তথ্য গোপন রাখা এবং প্রথম লগইনের পর ডিফল্ট পাসওয়ার্ড পরিবর্তন করা।",
              "নিয়মিত ব্যাকআপ রাখা — লাইভ ডেটার ব্যাকআপের দায়িত্ব ক্রেতার।",
              "নিজের ব্যবসার জন্য প্রযোজ্য আইন, কর ও গ্রাহক অধিকার সংক্রান্ত বিধান মেনে চলা।",
              "প্রোডাক্টে আপলোড করা কনটেন্ট, ছবি ও পণ্যের তথ্যের বৈধতা নিশ্চিত করা।",
            ],
          },
        ],
      },
      {
        id: "ip",
        heading: "৯. মেধাসম্পদ",
        blocks: [
          {
            type: "p",
            text: "প্রোডাক্টের সোর্স কোড, ডিজাইন, স্ট্রাকচার, ডকুমেন্টেশন এবং Trialvo Shop-এর নাম, লোগো ও ব্র্যান্ড উপাদানের সমস্ত মেধাসম্পদ অধিকার আমাদের বা আমাদের লাইসেন্সদাতাদের। লাইসেন্স কেনা মানে মেধাসম্পদ হস্তান্তর নয়।",
          },
          {
            type: "p",
            text: "প্রোডাক্টে ব্যবহৃত ওপেন সোর্স উপাদানগুলো তাদের নিজস্ব লাইসেন্সের অধীনে থাকে; সেই লাইসেন্সগুলো মেনে চলা ক্রেতার দায়িত্ব।",
          },
        ],
      },
      {
        id: "liability",
        heading: "১০. দায়বদ্ধতার সীমা",
        blocks: [
          {
            type: "p",
            text: "প্রোডাক্ট “যেমন আছে” ভিত্তিতে সরবরাহ করা হয়। ব্যবসায়িক ক্ষতি, আয় হ্রাস, ডেটা হারানো, সার্ভার ডাউনটাইম বা থার্ড-পার্টি সেবার ব্যর্থতার জন্য Trialvo Shop দায়ী থাকবে না।",
          },
          {
            type: "p",
            text: "যেকোনো পরিস্থিতিতে আমাদের সর্বোচ্চ দায়বদ্ধতা সংশ্লিষ্ট প্রোডাক্টের জন্য আপনি যে পরিমাণ অর্থ পরিশোধ করেছেন তার চেয়ে বেশি হবে না।",
          },
        ],
      },
      {
        id: "termination",
        heading: "১১. সেবা বন্ধ বা লাইসেন্স বাতিল",
        blocks: [
          {
            type: "p",
            text: "গ্রহণযোগ্য ব্যবহার নীতি বা লাইসেন্স চুক্তির গুরুতর লঙ্ঘন হলে আমরা ট্রায়াল বন্ধ, সাপোর্ট স্থগিত বা লাইসেন্স বাতিল করতে পারি। সম্ভব হলে আগে নোটিশ ও সংশোধনের সুযোগ দেওয়া হবে।",
          },
        ],
      },
      {
        id: "changes-law",
        heading: "১২. পরিবর্তন ও প্রযোজ্য আইন",
        blocks: [
          {
            type: "p",
            text: "আমরা প্রয়োজনে এই শর্তাবলী হালনাগাদ করতে পারি এবং পরিবর্তিত সংস্করণ এই পেজে প্রকাশ করব; পেজের শীর্ষে সর্বশেষ আপডেটের তারিখ দেখা যাবে। এই শর্তাবলী বাংলাদেশের প্রচলিত আইন অনুযায়ী পরিচালিত হবে।",
          },
          {
            type: "p",
            text: "শর্তাবলী নিয়ে কোনো প্রশ্ন থাকলে যোগাযোগ পেজের মাধ্যমে অথবা ইমেইলে আমাদের জানান।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Terms & Conditions",
    updated: LEGAL_UPDATED.en,
    intro:
      "These terms govern your use of the Trialvo Shop website, our ready-made ecommerce products, live trial environments, and support services. By browsing the site, requesting a trial, or purchasing a product you agree to these terms. Please read them in full before you buy.",
    sections: [
      {
        id: "definitions",
        heading: "1. Definitions",
        blocks: [
          {
            type: "list",
            items: [
              "“We”, “us”, “Trialvo Shop” — this marketplace and Trialvo, the company that operates it.",
              "“You”, “buyer”, “user” — the person or organisation using the site, running a trial, or purchasing a product.",
              "“Product” — a ready-made ecommerce solution including the storefront, admin panel, database structure, and source code.",
              "“Trial” — a time-limited running instance provided so you can evaluate a product before buying.",
              "“License” — the lifetime, non-transferable permission granted to use a product.",
            ],
          },
        ],
      },
      {
        id: "eligibility",
        heading: "2. Eligibility and account details",
        blocks: [
          {
            type: "p",
            text: "You must be legally capable of entering into a contract to purchase a product. The name, email address, and phone number you provide when requesting a trial or placing an order must be accurate and active, because delivery, licensing, and support communication all rely on them.",
          },
          {
            type: "p",
            text: "We may cancel an order or trial that was created with false or someone else's details. Multiple trial requests for the same product from the same email address may be merged into one.",
          },
        ],
      },
      {
        id: "products",
        heading: "3. Products and delivery",
        blocks: [
          {
            type: "p",
            text: "Each product is a complete ecommerce solution: a customer-facing shop, an admin panel for managing it, and the associated source code. The feature list and inclusions shown on the product page define what is delivered.",
          },
          {
            type: "list",
            items: [
              "Digital delivery begins once payment is confirmed — there is no physical shipment.",
              "Delivery includes the source code, database structure, and the setup documentation needed to deploy.",
              "Delivery links and instructions are sent to the email address on the order.",
              "Third-party services (domain, hosting, payment gateway, SMS or email providers) are not included in the product price unless the product page states otherwise.",
            ],
          },
        ],
      },
      {
        id: "trials",
        heading: "4. Live trial terms",
        blocks: [
          {
            type: "p",
            text: "We offer live trials on selected products so you can reduce risk before buying. A trial is a time-limited running environment intended for evaluation, not for operating a commercial business.",
          },
          {
            type: "list",
            items: [
              "Trial length and type depend on the product and current settings, and are confirmed when the trial is approved.",
              "We reserve the right to approve or decline any trial request.",
              "Demo data created during a trial may be deleted when the trial ends — do not keep anything important in a trial environment.",
              "Extending a trial uses a separate extend pack, which is not equivalent to purchasing the full product.",
              "Extracting, reverse engineering, or copying source code from a trial environment is prohibited.",
            ],
          },
        ],
      },
      {
        id: "pricing",
        heading: "5. Pricing and payment",
        blocks: [
          {
            type: "p",
            text: "Every product is a one-time purchase — there are no monthly or annual fees. The primary billing currency is Bangladeshi Taka (BDT). Some products also show a declared USD price for convenience; that figure is set independently and is not a converted exchange rate.",
          },
          {
            type: "list",
            items: [
              "The total shown at checkout is final — there are no hidden charges beyond it.",
              "Where a discount applies it is a percentage off the list price and is shown clearly at checkout.",
              "Payments are processed through a secure payment gateway; we do not store your full card details.",
              "If a payment fails or remains incomplete the order is not confirmed and delivery does not begin.",
              "We may change prices at any time, but changes never apply retroactively to completed orders.",
            ],
          },
        ],
      },
      {
        id: "license-summary",
        heading: "6. License (summary)",
        blocks: [
          {
            type: "p",
            text: "After purchase you receive a lifetime license to use the product. The license does not expire and there is no renewal fee. It grants you the right to use the product; it does not transfer ownership or grant resale rights.",
          },
          {
            type: "note",
            text: "The full list of permitted and prohibited uses is on the License Agreement page. Where the two documents differ, the License Agreement prevails.",
          },
        ],
      },
      {
        id: "support-summary",
        heading: "7. Support and updates",
        blocks: [
          {
            type: "p",
            text: "Every product includes lifetime support and lifetime updates. Support covers defects in the product itself, setup guidance, and access to updates we release.",
          },
          {
            type: "p",
            text: "Building new features, redesign work, third-party integrations, and server administration are treated as custom work and are agreed separately. The Support Policy page sets out the detail.",
          },
        ],
      },
      {
        id: "customer-duties",
        heading: "8. Your responsibilities",
        blocks: [
          {
            type: "list",
            items: [
              "Arranging your own domain, hosting, and SSL, and keeping them secure.",
              "Keeping admin credentials confidential and changing default passwords after first login.",
              "Maintaining your own backups — backing up live data is your responsibility.",
              "Complying with the laws, tax rules, and consumer-rights obligations that apply to your business.",
              "Ensuring the content, images, and product information you upload are lawful and yours to use.",
            ],
          },
        ],
      },
      {
        id: "ip",
        heading: "9. Intellectual property",
        blocks: [
          {
            type: "p",
            text: "All intellectual property rights in the source code, design, structure, and documentation of the products, and in the Trialvo Shop name, logo, and brand assets, remain with us or our licensors. Buying a license does not transfer intellectual property.",
          },
          {
            type: "p",
            text: "Open source components used inside a product remain under their own licenses, and complying with those licenses is the buyer's responsibility.",
          },
        ],
      },
      {
        id: "liability",
        heading: "10. Limitation of liability",
        blocks: [
          {
            type: "p",
            text: "Products are provided on an “as is” basis. Trialvo Shop is not liable for business losses, lost revenue, lost data, server downtime, or failures of third-party services.",
          },
          {
            type: "p",
            text: "In any circumstance our maximum liability will not exceed the amount you actually paid for the product concerned.",
          },
        ],
      },
      {
        id: "termination",
        heading: "11. Suspension and license termination",
        blocks: [
          {
            type: "p",
            text: "We may end a trial, pause support, or terminate a license following a serious breach of the Acceptable Use Policy or the License Agreement. Where practical we will give notice and an opportunity to correct the problem first.",
          },
        ],
      },
      {
        id: "changes-law",
        heading: "12. Changes and governing law",
        blocks: [
          {
            type: "p",
            text: "We may update these terms when needed and will publish the revised version on this page, with the last-updated date shown at the top. These terms are governed by the laws of Bangladesh.",
          },
          {
            type: "p",
            text: "If you have any question about these terms, reach us through the contact page or by email.",
          },
        ],
      },
    ],
  },
};
