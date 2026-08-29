import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const PRIVACY_DOC: LocalizedLegalDoc = {
  bn: {
    title: "গোপনীয়তা নীতি",
    updated: LEGAL_UPDATED.bn,
    intro:
      "এই নীতিতে বর্ণনা করা হয়েছে Trialvo Shop কোন তথ্য সংগ্রহ করে, কেন করে, কতদিন রাখে, কাদের সাথে শেয়ার করে এবং আপনার কী কী অধিকার আছে। আমরা শুধু ততটুকু তথ্যই নিই যতটুকু ট্রায়াল চালু করা, অর্ডার সম্পন্ন করা ও সাপোর্ট দেওয়ার জন্য প্রয়োজন।",
    sections: [
      {
        id: "data-we-collect",
        heading: "১. আমরা কী তথ্য সংগ্রহ করি",
        blocks: [
          {
            type: "p",
            text: "আমরা মূলত দুই ধরনের তথ্য সংগ্রহ করি — আপনি নিজে যা দেন, এবং প্রযুক্তিগতভাবে যা স্বয়ংক্রিয়ভাবে তৈরি হয়।",
          },
          {
            type: "list",
            items: [
              "পরিচয় ও যোগাযোগের তথ্য: নাম, ইমেইল, ফোন নম্বর এবং প্রযোজ্য হলে প্রতিষ্ঠানের নাম।",
              "অর্ডার সংক্রান্ত তথ্য: কোন প্রোডাক্ট, পরিমাণ, মূল্য, অর্ডার আইডি ও পেমেন্টের অবস্থা।",
              "ট্রায়াল সংক্রান্ত তথ্য: কোন প্রোডাক্টের ট্রায়াল, ট্রায়ালের ধরন, পছন্দের ডোমেইন (স্বহোস্টেড হলে) ও ব্যবহারের উদ্দেশ্য।",
              "সাপোর্ট যোগাযোগ: আপনি পাঠানো মেসেজ, প্রশ্ন ও সংযুক্ত ফাইল।",
              "প্রযুক্তিগত তথ্য: ব্রাউজার ও ডিভাইসের ধরন, আনুমানিক অবস্থান, এবং সাইট ব্যবহারের সাধারণ লগ।",
            ],
          },
          {
            type: "note",
            text: "আমরা আপনার সম্পূর্ণ কার্ড নম্বর, CVV বা ব্যাংকিং পিন সংরক্ষণ করি না। পেমেন্টের সংবেদনশীল তথ্য সরাসরি পেমেন্ট গেটওয়ে প্রক্রিয়া করে।",
          },
        ],
      },
      {
        id: "why",
        heading: "২. কেন এই তথ্য প্রয়োজন",
        blocks: [
          {
            type: "list",
            items: [
              "ট্রায়াল অনুরোধ যাচাই ও ট্রায়াল ইনস্ট্যান্স চালু করা।",
              "অর্ডার নিশ্চিত করা, প্রোডাক্ট ডেলিভারি করা ও লাইসেন্স সংযুক্ত করা।",
              "আজীবন সাপোর্ট দেওয়া এবং আপডেটের খবর জানানো।",
              "প্রতারণা, অপব্যবহার ও একই প্রোডাক্টে বারবার ট্রায়াল নেওয়া প্রতিরোধ করা।",
              "সেবার মান ও সাইটের কার্যকারিতা উন্নত করা।",
            ],
          },
        ],
      },
      {
        id: "legal-basis",
        heading: "৩. প্রক্রিয়াকরণের ভিত্তি",
        blocks: [
          {
            type: "p",
            text: "চুক্তি সম্পাদনের প্রয়োজনে (অর্ডার ও ডেলিভারি), আমাদের বৈধ ব্যবসায়িক স্বার্থে (নিরাপত্তা, অপব্যবহার প্রতিরোধ, সেবা উন্নয়ন), আইনি বাধ্যবাধকতা পালনে (হিসাব ও কর সংক্রান্ত রেকর্ড), এবং প্রযোজ্য ক্ষেত্রে আপনার সম্মতির ভিত্তিতে আমরা তথ্য প্রক্রিয়া করি।",
          },
        ],
      },
      {
        id: "sharing",
        heading: "৪. তথ্য কাদের সাথে শেয়ার করা হয়",
        blocks: [
          {
            type: "p",
            text: "আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না এবং বিজ্ঞাপনী উদ্দেশ্যে ভাড়া দিই না। সেবা পরিচালনার জন্য সীমিত পরিসরে নিচের ধরনের প্রসেসরদের সাথে তথ্য শেয়ার হতে পারে:",
          },
          {
            type: "list",
            items: [
              "পেমেন্ট গেটওয়ে — লেনদেন সম্পন্ন ও যাচাই করার জন্য।",
              "ইমেইল ডেলিভারি সেবা — ট্রায়াল লিংক, অর্ডার ও সাপোর্ট ইমেইল পাঠানোর জন্য।",
              "হোস্টিং ও অবকাঠামো প্রদানকারী — অ্যাপ্লিকেশন ও ডাটাবেস চালানোর জন্য।",
              "আইনি বাধ্যবাধকতা — উপযুক্ত কর্তৃপক্ষের বৈধ অনুরোধে, আইন অনুযায়ী প্রয়োজনীয় পরিমাণে।",
            ],
          },
        ],
      },
      {
        id: "retention",
        heading: "৫. তথ্য কতদিন রাখা হয়",
        blocks: [
          {
            type: "list",
            items: [
              "অর্ডার ও লাইসেন্স রেকর্ড: আজীবন সাপোর্ট ও লাইসেন্স যাচাইয়ের প্রয়োজনে দীর্ঘমেয়াদে সংরক্ষিত।",
              "ট্রায়াল রেকর্ড ও ডেমো ডেটা: ট্রায়াল শেষ হওয়ার পর যুক্তিসঙ্গত সময়ের মধ্যে মুছে ফেলা হয়।",
              "সাপোর্ট যোগাযোগ: সেবার ধারাবাহিকতা রাখার জন্য সংরক্ষিত।",
              "প্রযুক্তিগত লগ: সীমিত সময়ের জন্য, নিরাপত্তা ও ত্রুটি নির্ণয়ের প্রয়োজনে।",
            ],
          },
        ],
      },
      {
        id: "security",
        heading: "৬. নিরাপত্তা ব্যবস্থা",
        blocks: [
          {
            type: "p",
            text: "আমরা ট্রান্সপোর্ট এনক্রিপশন (HTTPS), অ্যাডমিন প্যানেলে প্রমাণীকরণ, ভূমিকা-ভিত্তিক অ্যাক্সেস এবং সংবেদনশীল কনফিগারেশন পরিবেশ ভেরিয়েবলে রাখার মতো ব্যবস্থা ব্যবহার করি। তবে ইন্টারনেটে কোনো ব্যবস্থাই শতভাগ নিরাপদ নয় — তাই আপনার নিজের পাসওয়ার্ড ও অ্যাক্সেস সুরক্ষিত রাখা জরুরি।",
          },
        ],
      },
      {
        id: "your-rights",
        heading: "৭. আপনার অধিকার",
        blocks: [
          {
            type: "list",
            items: [
              "আপনার সম্পর্কে সংরক্ষিত তথ্য দেখতে চাওয়ার অধিকার।",
              "ভুল বা অসম্পূর্ণ তথ্য সংশোধনের অনুরোধ।",
              "আইনি ও হিসাবরক্ষণের বাধ্যবাধকতার বাইরে থাকা তথ্য মুছে ফেলার অনুরোধ।",
              "মার্কেটিং যোগাযোগ থেকে যেকোনো সময় বেরিয়ে আসার সুযোগ।",
            ],
          },
          {
            type: "p",
            text: "এই অধিকার প্রয়োগ করতে চাইলে অর্ডারে ব্যবহৃত ইমেইল থেকে আমাদের সাথে যোগাযোগ করুন, যাতে আমরা পরিচয় যাচাই করতে পারি।",
          },
        ],
      },
      {
        id: "children-cookies",
        heading: "৮. শিশু, কুকি ও নীতির পরিবর্তন",
        blocks: [
          {
            type: "p",
            text: "আমাদের সেবা ব্যবসায়িক ব্যবহারকারীদের জন্য এবং শিশুদের উদ্দেশ্য করে নয়। কুকি ও ব্রাউজার স্টোরেজ সম্পর্কে বিস্তারিত আমাদের কুকি নীতি পেজে দেওয়া আছে।",
          },
          {
            type: "p",
            text: "প্রয়োজনে এই নীতি হালনাগাদ করা হতে পারে; পরিবর্তিত সংস্করণ এই পেজে প্রকাশিত হবে এবং শীর্ষে আপডেটের তারিখ দেখানো থাকবে।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Privacy Policy",
    updated: LEGAL_UPDATED.en,
    intro:
      "This policy explains what information Trialvo Shop collects, why we collect it, how long we keep it, who we share it with, and what rights you have. We only ask for what we need to run a trial, complete an order, and provide support.",
    sections: [
      {
        id: "data-we-collect",
        heading: "1. Information we collect",
        blocks: [
          {
            type: "p",
            text: "We collect two kinds of information: what you give us directly, and what is generated automatically when you use the site.",
          },
          {
            type: "list",
            items: [
              "Identity and contact details: name, email address, phone number, and company name where relevant.",
              "Order information: which product, amount, price, order ID, and payment status.",
              "Trial information: which product, the trial type, your preferred domain for self-hosted trials, and your intended use case.",
              "Support correspondence: the messages, questions, and attachments you send us.",
              "Technical information: browser and device type, approximate location, and general usage logs.",
            ],
          },
          {
            type: "note",
            text: "We do not store your full card number, CVV, or banking PIN. Sensitive payment data is handled directly by the payment gateway.",
          },
        ],
      },
      {
        id: "why",
        heading: "2. Why we need it",
        blocks: [
          {
            type: "list",
            items: [
              "Reviewing trial requests and provisioning trial instances.",
              "Confirming orders, delivering products, and attaching licenses.",
              "Providing lifetime support and notifying you about updates.",
              "Preventing fraud, abuse, and repeated trials of the same product.",
              "Improving service quality and site performance.",
            ],
          },
        ],
      },
      {
        id: "legal-basis",
        heading: "3. Basis for processing",
        blocks: [
          {
            type: "p",
            text: "We process data to perform our contract with you (orders and delivery), for our legitimate business interests (security, abuse prevention, service improvement), to meet legal obligations (accounting and tax records), and on the basis of your consent where that applies.",
          },
        ],
      },
      {
        id: "sharing",
        heading: "4. Who we share it with",
        blocks: [
          {
            type: "p",
            text: "We do not sell your personal information and we do not rent it for advertising. To operate the service we share limited data with these categories of processor:",
          },
          {
            type: "list",
            items: [
              "Payment gateway — to complete and verify transactions.",
              "Email delivery service — to send trial links, order emails, and support replies.",
              "Hosting and infrastructure providers — to run the application and database.",
              "Legal requests — where a competent authority makes a lawful request, limited to what the law requires.",
            ],
          },
        ],
      },
      {
        id: "retention",
        heading: "5. How long we keep it",
        blocks: [
          {
            type: "list",
            items: [
              "Order and license records: kept long term because lifetime support and license verification depend on them.",
              "Trial records and demo data: deleted within a reasonable period after the trial ends.",
              "Support correspondence: retained so support stays consistent over time.",
              "Technical logs: kept for a limited period for security and troubleshooting.",
            ],
          },
        ],
      },
      {
        id: "security",
        heading: "6. How we protect it",
        blocks: [
          {
            type: "p",
            text: "We use transport encryption (HTTPS), authentication on the admin panel, role-based access, and environment variables for sensitive configuration. No system on the internet is completely secure, so keeping your own passwords and access safe remains important.",
          },
        ],
      },
      {
        id: "your-rights",
        heading: "7. Your rights",
        blocks: [
          {
            type: "list",
            items: [
              "Ask what information we hold about you.",
              "Ask us to correct information that is wrong or incomplete.",
              "Ask us to delete information that we are not required to keep for legal or accounting reasons.",
              "Opt out of marketing communication at any time.",
            ],
          },
          {
            type: "p",
            text: "To exercise any of these rights, contact us from the email address used on your order so that we can verify your identity.",
          },
        ],
      },
      {
        id: "children-cookies",
        heading: "8. Children, cookies, and policy changes",
        blocks: [
          {
            type: "p",
            text: "Our service is intended for business users and is not directed at children. Details about cookies and browser storage are on our Cookie Policy page.",
          },
          {
            type: "p",
            text: "We may update this policy when needed. Revised versions are published on this page with the update date shown at the top.",
          },
        ],
      },
    ],
  },
};
